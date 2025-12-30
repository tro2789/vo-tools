import os
import subprocess
import uuid
import json
import zipfile
import shutil
import signal
import sys
import logging
from flask import Flask, request, send_file, after_this_request, jsonify, send_from_directory
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from werkzeug.utils import secure_filename
from dotenv import load_dotenv

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

# Serve Next.js static files
@app.route('/')
@app.route('/<path:path>')
def serve_static(path='index.html'):
    """Serve Next.js static build."""
    try:
        # Try to serve the requested file
        if path and os.path.exists(os.path.join(STATIC_FOLDER, path)):
            return send_from_directory(STATIC_FOLDER, path)
        # For routes, serve index.html (Next.js handles client-side routing)
        return send_from_directory(STATIC_FOLDER, 'index.html')
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
    
    logger.info(f"Starting Audio Converter API on {host}:{port}")
    logger.info(f"Allowed origins: {ALLOWED_ORIGINS}")
    logger.info(f"Max upload size: {app.config['MAX_CONTENT_LENGTH'] // (1024 * 1024)}MB")
    
    app.run(host=host, port=port, debug=debug)
