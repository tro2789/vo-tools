import os
import subprocess
import uuid
import json
import zipfile
import shutil
import signal
import sys
import logging
import random
import string
import secrets
from functools import wraps
from collections import defaultdict
from time import time
from flask import Flask, request, send_file, after_this_request, jsonify, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from werkzeug.utils import secure_filename
from werkzeug.security import safe_join
from dotenv import load_dotenv
from acx_analyzer import analyze_acx_compliance

# Load environment variables
load_dotenv()

# Configure logging
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Determine static folder path
STATIC_FOLDER = os.path.join(os.path.dirname(__file__), 'out')
app = Flask(__name__, static_folder=STATIC_FOLDER, static_url_path='')

# Initialize SocketIO for real-time communication
socketio = SocketIO(
    app,
    cors_allowed_origins=os.getenv('ALLOWED_ORIGINS', 'http://localhost:3000').split(','),
    async_mode='eventlet',
    logger=True,
    engineio_logger=False
)

# --- CONFIGURATION ---
# Environment-based configuration
app.config['MAX_CONTENT_LENGTH'] = int(os.getenv('MAX_CONTENT_LENGTH', 50 * 1024 * 1024))
BASE_UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', '/tmp/uploads')
os.makedirs(BASE_UPLOAD_FOLDER, exist_ok=True)

ALLOWED_EXTENSIONS = set(os.getenv('ALLOWED_EXTENSIONS', 'wav,mp3,ogg,flac,m4a,aiff,wma,aac').split(','))
FFMPEG_TIMEOUT = int(os.getenv('FFMPEG_TIMEOUT', 300))

# CORS Configuration
ALLOWED_ORIGINS = os.getenv('ALLOWED_ORIGINS', 'http://localhost:3000').split(',')
CORS(app, 
     resources={r"/*": {"origins": ALLOWED_ORIGINS}},
     supports_credentials=True,
     max_age=int(os.getenv('CORS_MAX_AGE', 3600))
)

# Rate Limiting Configuration
RATE_LIMIT_ENABLED = os.getenv('RATE_LIMIT_ENABLED', 'True').lower() == 'true'
if RATE_LIMIT_ENABLED:
    limiter = Limiter(
        app=app,
        key_func=get_remote_address,
        default_limits=[
            f"{os.getenv('RATE_LIMIT_PER_MINUTE', 10)}/minute",
            f"{os.getenv('RATE_LIMIT_PER_HOUR', 100)}/hour"
        ],
        storage_uri="memory://"  # Use Redis in production: redis://localhost:6379
    )
    logger.info("Rate limiting enabled")
else:
    limiter = None
    logger.warning("Rate limiting disabled")

# API Key Authentication
API_KEY = os.getenv('API_KEY')
AUTH_ENABLED = os.getenv('AUTH_ENABLED', 'True').lower() == 'true'

def require_api_key(f):
    """Decorator to require API key authentication for endpoints."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not AUTH_ENABLED:
            logger.warning("API authentication is DISABLED - not recommended for production")
            return f(*args, **kwargs)
        
        if not API_KEY:
            logger.error("API_KEY not configured but AUTH_ENABLED=True")
            return jsonify({'error': 'Server configuration error'}), 500
        
        # Check for API key in header or query parameter
        provided_key = request.headers.get('X-API-Key') or request.args.get('api_key')
        
        if not provided_key:
            logger.warning(f"API key missing from {get_remote_address()}")
            return jsonify({'error': 'API key required. Provide X-API-Key header or api_key parameter'}), 401
        
        if provided_key != API_KEY:
            logger.warning(f"Invalid API key attempt from {get_remote_address()}")
            return jsonify({'error': 'Invalid API key'}), 403
        
        return f(*args, **kwargs)
    return decorated_function

# Security Headers Middleware
@app.after_request
def add_security_headers(response):
    """Add security headers to all responses."""
    # Prevent clickjacking
    response.headers['X-Frame-Options'] = 'DENY'
    
    # Prevent MIME type sniffing
    response.headers['X-Content-Type-Options'] = 'nosniff'
    
    # Enable XSS filter (legacy browsers)
    response.headers['X-XSS-Protection'] = '1; mode=block'
    
    # Force HTTPS (only if using HTTPS)
    if request.is_secure:
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    
    # Content Security Policy (restrictive for security)
    response.headers['Content-Security-Policy'] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: https:; "
        "font-src 'self' data:; "
        "connect-src 'self'; "
        "frame-ancestors 'none'"
    )
    
    # Referrer policy
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    
    # Permissions policy
    response.headers['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'
    
    return response

# WebSocket Rate Limiting
ws_rate_limits = defaultdict(list)
WS_RATE_LIMIT_WINDOW = 60  # seconds
WS_MAX_REQUESTS = int(os.getenv('WS_RATE_LIMIT_PER_MINUTE', 30))

def ws_rate_limit(max_requests=None):
    """Rate limiter decorator for WebSocket events."""
    if max_requests is None:
        max_requests = WS_MAX_REQUESTS
    
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            sid = request.sid
            now = time()
            
            # Clean old timestamps
            ws_rate_limits[sid] = [
                ts for ts in ws_rate_limits[sid]
                if now - ts < WS_RATE_LIMIT_WINDOW
            ]
            
            # Check limit
            if len(ws_rate_limits[sid]) >= max_requests:
                logger.warning(f"WebSocket rate limit exceeded for {sid}")
                emit('error', {'message': 'Rate limit exceeded. Please slow down.'})
                return
            
            # Record this request
            ws_rate_limits[sid].append(now)
            
            return f(*args, **kwargs)
        return wrapper
    return decorator

# --- FFmpeg Format Mappings ---
FORMATS = {
    'ulaw':    ['-ar', '8000', '-ac', '1', '-c:a', 'pcm_mulaw'], 
    'alaw':    ['-ar', '8000', '-ac', '1', '-c:a', 'pcm_alaw'], 
    'pcm16':   ['-ar', '8000', '-ac', '1', '-c:a', 'pcm_s16le'], 
    'g722':    ['-ar', '16000', '-ac', '1', '-c:a', 'g722'],      
    'pcm8':    ['-ar', '8000', '-ac', '1', '-c:a', 'pcm_u8'],
    'pcm16hd': ['-ar', '16000', '-ac', '1', '-c:a', 'pcm_s16le'],
    'sln':     ['-ar', '8000', '-ac', '1', '-c:a', 'pcm_s16le', '-f', 's16le']
}

EXTENSIONS = {
    'ulaw': '.wav', 
    'alaw': '.wav', 
    'pcm16': '.wav', 
    'pcm8': '.wav', 
    'pcm16hd': '.wav',
    'g722': '.g722', 
    'sln': '.sln'
}

SUFFIXES = {
    'ulaw': '_ulaw', 
    'alaw': '_alaw', 
    'pcm16': '_pcm16', 
    'g722': '_g722', 
    'pcm8': '_8bit', 
    'pcm16hd': '_hd',
    'sln': '_raw'
}

# --- TELEPROMPTER REMOTE CONTROL ---
# Store active rooms: {room_code: {'desktop': sid, 'phone': sid}}
active_rooms = {}

def generate_room_code():
    """Generate a secure 8-character alphanumeric room code."""
    # Use character set excluding confusing characters
    charset = string.ascii_uppercase + string.digits
    charset = charset.replace('O', '').replace('0', '').replace('I', '').replace('1', '')
    
    while True:
        # Use secrets module for cryptographically secure randomness
        code = ''.join(secrets.choice(charset) for _ in range(8))
        if code not in active_rooms:
            return code

@socketio.on('create_room')
@ws_rate_limit(max_requests=5)  # Max 5 room creations per minute
def handle_create_room():
    """Desktop teleprompter creates a new room."""
    room_code = generate_room_code()
    active_rooms[room_code] = {'desktop': request.sid, 'phone': None}
    join_room(room_code)
    logger.info(f"Room {room_code} created by desktop {request.sid}")
    emit('room_created', {'roomCode': room_code})

@socketio.on('join_room')
@ws_rate_limit(max_requests=10)  # Max 10 join attempts per minute
def handle_join_room(data):
    """Phone remote joins an existing room."""
    room_code = data.get('roomCode', '').upper()
    
    if room_code not in active_rooms:
        emit('error', {'message': 'Invalid room code'})
        logger.warning(f"Phone {request.sid} tried to join invalid room {room_code}")
        return
    
    if active_rooms[room_code]['phone'] is not None:
        emit('error', {'message': 'Room already has a phone connected'})
        logger.warning(f"Phone {request.sid} tried to join room {room_code} but phone already connected")
        return
    
    active_rooms[room_code]['phone'] = request.sid
    join_room(room_code)
    logger.info(f"Phone {request.sid} joined room {room_code}")
    
    # Notify desktop that phone connected
    desktop_sid = active_rooms[room_code]['desktop']
    emit('phone_connected', room=desktop_sid)
    
    # Confirm to phone
    emit('joined_room', {'roomCode': room_code})

@socketio.on('command')
@ws_rate_limit(max_requests=60)  # Max 60 commands per minute (1/sec average)
def handle_command(data):
    """Phone sends command to desktop."""
    # Find which room this phone is in
    room_code = None
    for code, members in active_rooms.items():
        if members['phone'] == request.sid:
            room_code = code
            break
    
    if not room_code:
        emit('error', {'message': 'Not in a room'})
        return
    
    desktop_sid = active_rooms[room_code]['desktop']
    action = data.get('action')
    value = data.get('value')
    
    logger.info(f"Command {action} from phone to desktop in room {room_code}")
    
    # Send command to desktop
    emit('command', {'action': action, 'value': value}, room=desktop_sid)

@socketio.on('state_update')
def handle_state_update(data):
    """Desktop sends state update to phone."""
    # Find which room this desktop is in
    room_code = None
    for code, members in active_rooms.items():
        if members['desktop'] == request.sid:
            room_code = code
            break
    
    if not room_code or not active_rooms[room_code]['phone']:
        return  # No phone connected, ignore
    
    phone_sid = active_rooms[room_code]['phone']
    
    # Send state to phone
    emit('state_update', data, room=phone_sid)

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnect."""
    # Find and clean up any rooms this client was in
    for room_code, members in list(active_rooms.items()):
        if members['desktop'] == request.sid:
            logger.info(f"Desktop {request.sid} disconnected from room {room_code}")
            # Notify phone if connected
            if members['phone']:
                emit('desktop_disconnected', room=members['phone'])
            del active_rooms[room_code]
        elif members['phone'] == request.sid:
            logger.info(f"Phone {request.sid} disconnected from room {room_code}")
            active_rooms[room_code]['phone'] = None
            # Notify desktop
            emit('phone_disconnected', room=members['desktop'])

# --- SECURITY HELPERS ---
def allowed_file(filename):
    """Check if file has allowed extension."""
    if not filename or '.' not in filename:
        return False
    return filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def sanitize_filename(filename):
    """Enhanced filename sanitization."""
    # Use werkzeug's secure_filename and add extra sanitization
    safe_name = secure_filename(filename)
    # Remove any remaining potentially dangerous characters
    safe_name = safe_name.replace('..', '').replace('/', '').replace('\\', '')
    # Limit filename length
    if len(safe_name) > 255:
        name, ext = os.path.splitext(safe_name)
        safe_name = name[:250] + ext
    return safe_name

def is_valid_audio(filepath):
    """Verifies file content using ffprobe with timeout."""
    try:
        cmd = ['ffprobe', '-v', 'quiet', '-print_format', 'json', '-show_streams', filepath]
        result = subprocess.run(
            cmd, 
            stdout=subprocess.PIPE, 
            stderr=subprocess.PIPE,
            timeout=10  # 10 second timeout for validation
        )
        data = json.loads(result.stdout)
        for stream in data.get('streams', []):
            if stream.get('codec_type') == 'audio':
                return True
        return False
    except subprocess.TimeoutExpired:
        logger.error(f"FFprobe timeout validating {filepath}")
        return False
    except Exception as e:
        logger.error(f"Error validating {filepath}: {str(e)}")
        return False

def validate_format(format_type):
    """Validate format parameter."""
    return format_type in FORMATS

def validate_volume(volume):
    """Validate volume parameter."""
    return volume in ['quiet', 'lower', 'medium', 'high', 'max']

def convert_single_file(input_path, output_path, target_format, filters):
    """Helper function to run the FFmpeg command with timeout."""
    try:
        filter_args = ['-af', ",".join(filters)] if filters else []
        
        cmd = [
            'ffmpeg', '-y', '-i', input_path, 
            *filter_args, 
            *FORMATS.get(target_format, FORMATS['ulaw']), 
            output_path
        ]
        
        result = subprocess.run(
            cmd, 
            check=True, 
            stdout=subprocess.PIPE, 
            stderr=subprocess.PIPE,
            timeout=FFMPEG_TIMEOUT
        )
        logger.info(f"Successfully converted {input_path} to {output_path}")
        return True
    except subprocess.TimeoutExpired:
        logger.error(f"FFmpeg timeout converting {input_path}")
        raise Exception("Conversion timeout - file too large or complex")
    except subprocess.CalledProcessError as e:
        logger.error(f"FFmpeg error converting {input_path}: {e.stderr.decode()}")
        raise Exception("Audio conversion failed")

# --- ERROR HANDLERS ---
@app.errorhandler(413)
def request_entity_too_large(error):
    """Handle file too large errors."""
    max_size_mb = app.config['MAX_CONTENT_LENGTH'] // (1024 * 1024)
    return jsonify({
        'error': f'Total upload size too large. Maximum allowed: {max_size_mb}MB'
    }), 413

@app.errorhandler(429)
def ratelimit_handler(e):
    """Handle rate limit exceeded errors."""
    logger.warning(f"Rate limit exceeded: {get_remote_address()}")
    return jsonify({
        'error': 'Rate limit exceeded. Please try again later.',
        'retry_after': e.description
    }), 429

@app.errorhandler(500)
def internal_error(error):
    """Handle internal server errors."""
    logger.error(f"Internal error: {str(error)}")
    return jsonify({
        'error': 'Internal server error. Please try again later.'
    }), 500

# --- ROUTES ---
@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint for monitoring."""
    try:
        # Check if FFmpeg is available
        subprocess.run(
            ['ffmpeg', '-version'],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=5
        )
        
        # Check if upload directory exists and is accessible
        if not os.path.exists(BASE_UPLOAD_FOLDER):
            raise Exception(f"Upload folder {BASE_UPLOAD_FOLDER} does not exist")
        
        if not os.access(BASE_UPLOAD_FOLDER, os.R_OK):
            raise Exception(f"Upload folder {BASE_UPLOAD_FOLDER} is not readable")
        
        return jsonify({
            'status': 'healthy',
            'service': 'audio-converter',
            'version': '1.0.0'
        }), 200
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return jsonify({
            'status': 'unhealthy',
            'error': str(e)
        }), 503

@app.route('/api/convert', methods=['POST'])
@require_api_key
def convert():
    """Audio conversion endpoint."""
    try:
        # Validate request
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        files = request.files.getlist('file')
        
        if not files or files[0].filename == '':
            return jsonify({'error': 'No file selected'}), 400

        # Validate parameters
        target_format = request.form.get('format', 'ulaw')
        if not validate_format(target_format):
            return jsonify({'error': f'Invalid format: {target_format}'}), 400

        volume = request.form.get('volume', 'medium')
        if not validate_volume(volume):
            return jsonify({'error': f'Invalid volume: {volume}'}), 400

        # Create job directory
        job_id = str(uuid.uuid4())
        job_dir = os.path.join(BASE_UPLOAD_FOLDER, job_id)
        os.makedirs(job_dir, exist_ok=True)
        
        logger.info(f"Starting conversion job {job_id}")

        converted_files = [] 
        errors = []

        # Get correct extension based on format
        ext = EXTENSIONS.get(target_format, '.wav')
        
        # Build audio filters
        audio_filters = []
        if volume == 'quiet': 
            audio_filters.append('volume=-10dB')
        elif volume == 'lower': 
            audio_filters.append('volume=-5dB')
        elif volume == 'high': 
            audio_filters.append('volume=5dB')
        elif volume == 'max': 
            audio_filters.append('loudnorm=I=-16:TP=-1.5:LRA=11')
        
        if request.form.get('optimize') == 'yes':
            audio_filters.append('highpass=f=300,lowpass=f=3400')

        # Process files
        for file in files:
            if not allowed_file(file.filename):
                errors.append(f"Skipped {file.filename}: Invalid file type")
                continue

            safe_name = sanitize_filename(file.filename)
            if not safe_name:
                errors.append(f"Skipped {file.filename}: Invalid filename")
                continue
                
            input_path = os.path.join(job_dir, safe_name)
            
            # Save file
            try:
                file.save(input_path)
            except Exception as e:
                logger.error(f"Error saving {file.filename}: {str(e)}")
                errors.append(f"Failed to save {file.filename}")
                continue

            # Validate audio content
            if not is_valid_audio(input_path):
                errors.append(f"Skipped {file.filename}: Not a valid audio file")
                if os.path.exists(input_path):
                    os.remove(input_path)
                continue

            # Determine output name
            original_name = os.path.splitext(safe_name)[0]
            suffix = SUFFIXES.get(target_format, '_converted')
            output_filename = f"{original_name}{suffix}{ext}"
            output_path = os.path.join(job_dir, output_filename)

            # Convert
            try:
                convert_single_file(input_path, output_path, target_format, audio_filters)
                converted_files.append(output_path)
                os.remove(input_path)
            except Exception as e:
                errors.append(f"Failed to convert {file.filename}: {str(e)}")
                if os.path.exists(input_path): 
                    os.remove(input_path)

        # Cleanup job directory after response
        @after_this_request
        def cleanup(response):
            try:
                shutil.rmtree(job_dir)
                logger.info(f"Cleaned up job {job_id}")
            except Exception as e:
                logger.error(f"Error cleaning up job {job_id}: {e}")
            return response

        if not converted_files:
            error_msg = f"No files were converted. {'; '.join(errors)}"
            logger.warning(f"Job {job_id} failed: {error_msg}")
            return jsonify({'error': error_msg}), 422

        # Single file
        if len(converted_files) == 1:
            return send_file(
                converted_files[0], 
                as_attachment=True, 
                download_name=os.path.basename(converted_files[0])
            )

        # Multiple files (zip)
        zip_filename = f"batch_converted_{job_id[:8]}.zip"
        zip_path = os.path.join(job_dir, zip_filename)
        
        with zipfile.ZipFile(zip_path, 'w') as zipf:
            for file_path in converted_files:
                zipf.write(file_path, arcname=os.path.basename(file_path))
        
        return send_file(zip_path, as_attachment=True, download_name=zip_filename)

    except Exception as e:
        logger.error(f"Unexpected error in convert endpoint: {str(e)}", exc_info=True)
        return jsonify({'error': 'An unexpected error occurred'}), 500

@app.route('/api/audio/acx-check', methods=['POST'])
@require_api_key
def acx_check():
    """ACX Audio Compliance Check endpoint."""
    try:
        # Validate request
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Validate file type (audio files only)
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type. Please upload an audio file.'}), 400
        
        # Create job directory
        job_id = str(uuid.uuid4())
        job_dir = os.path.join(BASE_UPLOAD_FOLDER, job_id)
        os.makedirs(job_dir, exist_ok=True)
        
        logger.info(f"Starting ACX analysis job {job_id} for {file.filename}")
        
        # Save file
        safe_name = sanitize_filename(file.filename)
        if not safe_name:
            shutil.rmtree(job_dir)
            return jsonify({'error': 'Invalid filename'}), 400
        
        filepath = os.path.join(job_dir, safe_name)
        
        try:
            file.save(filepath)
        except Exception as e:
            logger.error(f"Error saving {file.filename}: {str(e)}")
            shutil.rmtree(job_dir)
            return jsonify({'error': 'Failed to save file'}), 500
        
        # Validate audio content
        if not is_valid_audio(filepath):
            shutil.rmtree(job_dir)
            return jsonify({'error': 'Not a valid audio file'}), 400
        
        # Analyze for ACX compliance
        try:
            result = analyze_acx_compliance(filepath)
            logger.info(f"ACX analysis complete for job {job_id}: {result['summary']}")
            
            # Cleanup job directory
            shutil.rmtree(job_dir)
            
            return jsonify(result), 200
            
        except Exception as e:
            logger.error(f"ACX analysis failed for job {job_id}: {str(e)}", exc_info=True)
            shutil.rmtree(job_dir)
            return jsonify({'error': f'Analysis failed: {str(e)}'}), 500
    
    except Exception as e:
        logger.error(f"Unexpected error in ACX check endpoint: {str(e)}", exc_info=True)
        return jsonify({'error': 'An unexpected error occurred'}), 500

# Serve Next.js static files
@app.route('/')
@app.route('/<path:path>')
def serve_static(path='index.html'):
    """Serve Next.js static build with path traversal protection."""
    try:
        # Validate and sanitize path using safe_join
        safe_path = safe_join(STATIC_FOLDER, path)
        
        # Check if safe path exists and is a file
        if safe_path and os.path.exists(safe_path) and os.path.isfile(safe_path):
            return send_from_directory(STATIC_FOLDER, path)
        
        # For routes, serve index.html (Next.js handles client-side routing)
        index_path = safe_join(STATIC_FOLDER, 'index.html')
        if index_path and os.path.exists(index_path):
            return send_from_directory(STATIC_FOLDER, 'index.html')
        
        return jsonify({'error': 'File not found'}), 404
    except Exception as e:
        logger.error(f"Error serving static file {path}: {str(e)}")
        return jsonify({'error': 'File not found'}), 404

# --- GRACEFUL SHUTDOWN ---
def signal_handler(sig, frame):
    """Handle shutdown signals gracefully."""
    logger.info(f"Received signal {sig}, shutting down gracefully...")
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)

# --- MAIN ---
if __name__ == '__main__':
    host = os.getenv('FLASK_HOST', '0.0.0.0')
    port = int(os.getenv('FLASK_PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    
    logger.info(f"Starting VO Tools API with SocketIO on {host}:{port}")
    logger.info(f"Allowed origins: {ALLOWED_ORIGINS}")
    logger.info(f"Max upload size: {app.config['MAX_CONTENT_LENGTH'] // (1024 * 1024)}MB")
    logger.info(f"Authentication: {'ENABLED' if AUTH_ENABLED else 'DISABLED'}")
    
    # Use socketio.run for development only
    # In production, this is managed by gunicorn + supervisor (see Dockerfile)
    if debug:
        logger.warning("Running in DEBUG mode - for development only!")
    
    socketio.run(app, host=host, port=port, debug=debug)
