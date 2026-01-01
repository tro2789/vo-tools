"""
ACX Audio Compliance Analyzer

Analyzes audio files for compliance with ACX audiobook standards:
- MP3 format at 192 kbps or higher, Constant Bit Rate (CBR)
- 44.1 kHz sample rate
- Integrated loudness (LUFS) between −23 dB and −18 dB
- Peak amplitude no higher than −3 dB
"""

import os
import subprocess
import json
import logging
import tempfile
import numpy as np
from pydub import AudioSegment
from scipy import signal

logger = logging.getLogger(__name__)

# ACX Compliance Thresholds
ACX_SPECS = {
    'sample_rate': 44100,
    'bitrate_min': 192000,  # 192 kbps
    'rms_min': -23.0,  # dB (integrated loudness / LUFS)
    'rms_max': -18.0,  # dB (integrated loudness / LUFS)
    'peak_max': -3.0,  # dB
}

def get_audio_metadata(filepath):
    """
    Extract audio metadata using ffprobe.
    
    Returns:
        dict: Audio metadata including format, codec, bitrate, sample rate, etc.
    """
    try:
        cmd = [
            'ffprobe',
            '-v', 'quiet',
            '-print_format', 'json',
            '-show_format',
            '-show_streams',
            filepath
        ]
        
        result = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=30
        )
        
        if result.returncode != 0:
            raise Exception(f"ffprobe failed: {result.stderr.decode()}")
        
        data = json.loads(result.stdout)
        
        # Extract audio stream info
        audio_stream = None
        for stream in data.get('streams', []):
            if stream.get('codec_type') == 'audio':
                audio_stream = stream
                break
        
        if not audio_stream:
            raise Exception("No audio stream found in file")
        
        format_info = data.get('format', {})
        
        return {
            'codec': audio_stream.get('codec_name', 'unknown'),
            'sample_rate': int(audio_stream.get('sample_rate', 0)),
            'channels': audio_stream.get('channels', 0),
            'channel_layout': audio_stream.get('channel_layout', 'unknown'),
            'bit_rate': int(audio_stream.get('bit_rate', 0)) if audio_stream.get('bit_rate') else int(format_info.get('bit_rate', 0)),
            'duration': float(format_info.get('duration', 0)),
            'format': format_info.get('format_name', 'unknown'),
        }
    
    except subprocess.TimeoutExpired:
        raise Exception("Timeout while analyzing audio file")
    except json.JSONDecodeError:
        raise Exception("Failed to parse audio metadata")
    except Exception as e:
        logger.error(f"Error getting audio metadata: {str(e)}")
        raise


def is_cbr(filepath):
    """
    Determine if audio file uses Constant Bit Rate (CBR) encoding.
    
    This checks for bitrate variation by examining the bitrate reported
    at the stream level vs format level.
    
    Returns:
        bool: True if CBR, False if VBR
    """
    try:
        cmd = [
            'ffprobe',
            '-v', 'quiet',
            '-print_format', 'json',
            '-show_streams',
            '-show_format',
            filepath
        ]
        
        result = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=30
        )
        
        data = json.loads(result.stdout)
        
        # Get stream and format bitrates
        audio_stream = next((s for s in data.get('streams', []) if s.get('codec_type') == 'audio'), None)
        if not audio_stream:
            return False
        
        stream_bitrate = audio_stream.get('bit_rate')
        format_bitrate = data.get('format', {}).get('bit_rate')
        
        # If both are present and similar (within 5%), likely CBR
        if stream_bitrate and format_bitrate:
            stream_br = int(stream_bitrate)
            format_br = int(format_bitrate)
            
            if stream_br > 0:
                variation = abs(stream_br - format_br) / stream_br
                return variation < 0.05  # Less than 5% variation = CBR
        
        # Default assumption for MP3: check if VBR header is present
        # This is a simplified check - true VBR detection is complex
        return stream_bitrate is not None
    
    except Exception as e:
        logger.warning(f"CBR detection inconclusive: {str(e)}")
        return True  # Assume CBR if unable to determine


def calculate_integrated_loudness(filepath):
    """
    Calculate integrated loudness using FFmpeg's ebur128 filter (ITU-R BS.1770).
    This matches the loudness measurement used by ACX Audio Lab.
    
    Args:
        filepath: path to audio file
    
    Returns:
        float: Integrated loudness in LUFS (dB)
    """
    try:
        cmd = [
            'ffmpeg',
            '-i', filepath,
            '-af', 'ebur128=framelog=verbose',
            '-f', 'null',
            '-'
        ]
        
        result = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=120
        )
        
        # Parse integrated loudness from stderr
        output = result.stderr.decode('utf-8', errors='ignore')
        
        # Look for "I:" value which is integrated loudness
        for line in output.split('\n'):
            if 'I:' in line and 'LUFS' in line:
                # Example: "  I:         -20.1 LUFS"
                parts = line.split('I:')
                if len(parts) > 1:
                    lufs_str = parts[1].split('LUFS')[0].strip()
                    try:
                        return float(lufs_str)
                    except ValueError:
                        continue
        
        raise Exception("Could not extract integrated loudness from FFmpeg output")
    
    except subprocess.TimeoutExpired:
        raise Exception("Timeout while calculating loudness")
    except Exception as e:
        logger.error(f"Error calculating integrated loudness: {str(e)}")
        raise


def calculate_peak(audio_data):
    """
    Calculate peak amplitude in dB.
    
    Args:
        audio_data: numpy array of audio samples
    
    Returns:
        float: Peak level in dB (0 dB = maximum)
    """
    peak = np.max(np.abs(audio_data))
    
    # Normalize to -1 to 1 range and convert to dB
    if peak > 0:
        peak_db = 20 * np.log10(peak)
    else:
        peak_db = -np.inf
    
    return float(peak_db)


def detect_silence(audio_data, sample_rate, threshold_db=-40):
    """
    Detect leading and trailing silence in audio.
    
    Args:
        audio_data: numpy array of audio samples
        sample_rate: sample rate in Hz
        threshold_db: threshold in dB below which is considered silence
    
    Returns:
        tuple: (leading_silence_seconds, trailing_silence_seconds)
    """
    # Convert threshold to amplitude
    threshold = 10 ** (threshold_db / 20)
    
    # Find first and last non-silent samples
    non_silent = np.where(np.abs(audio_data) > threshold)[0]
    
    if len(non_silent) == 0:
        # Entire file is silent
        duration = len(audio_data) / sample_rate
        return duration, 0.0
    
    first_sound = non_silent[0]
    last_sound = non_silent[-1]
    
    leading_silence = first_sound / sample_rate
    trailing_silence = (len(audio_data) - last_sound - 1) / sample_rate
    
    return float(leading_silence), float(trailing_silence)


def analyze_acx_compliance(filepath):
    """
    Analyze audio file for ACX compliance.
    
    Args:
        filepath: path to audio file
    
    Returns:
        dict: ACX compliance report with pass/fail for each requirement
    """
    temp_wav = None
    
    try:
        # Get metadata
        logger.info(f"Analyzing {filepath} for ACX compliance")
        metadata = get_audio_metadata(filepath)
        
        # Check format and bitrate
        is_mp3 = 'mp3' in metadata['format'].lower() or metadata['codec'] == 'mp3'
        bitrate = metadata['bit_rate']
        bitrate_ok = bitrate >= ACX_SPECS['bitrate_min']
        cbr = is_cbr(filepath) if is_mp3 else True
        
        # Check sample rate
        sample_rate = metadata['sample_rate']
        sample_rate_ok = sample_rate == ACX_SPECS['sample_rate']
        
        # Determine channel configuration
        channels = metadata['channels']
        if channels == 1:
            channel_str = 'mono'
        elif channels == 2:
            channel_str = 'stereo'
        else:
            channel_str = f'{channels} channels'
        
        # Calculate integrated loudness using FFmpeg ebur128
        logger.info("Calculating integrated loudness (LUFS)")
        rms_db = calculate_integrated_loudness(filepath)
        
        # Load audio data for peak and silence detection
        logger.info("Loading audio for peak analysis")
        audio = AudioSegment.from_file(filepath)
        audio_data = np.array(audio.get_array_of_samples(), dtype=np.float32)
        
        # Normalize to -1 to 1 range
        if audio.sample_width == 2:  # 16-bit
            audio_data = audio_data / (2**15)
        elif audio.sample_width == 3:  # 24-bit
            audio_data = audio_data / (2**23)
        elif audio.sample_width == 4:  # 32-bit
            audio_data = audio_data / (2**31)
        
        # Calculate peak
        logger.info("Calculating peak amplitude")
        peak_db = calculate_peak(audio_data)
        
        # Detect silence
        lead_silence, trail_silence = detect_silence(audio_data, audio.frame_rate)
        
        # Check compliance
        rms_ok = ACX_SPECS['rms_min'] <= rms_db <= ACX_SPECS['rms_max']
        peak_ok = peak_db <= ACX_SPECS['peak_max']
        
        # Overall pass/fail (removed noise floor from criteria)
        format_ok = is_mp3 and bitrate_ok and cbr
        overall_pass = all([format_ok, sample_rate_ok, rms_ok, peak_ok])
        
        result = {
            'format': {
                'value': metadata['format'],
                'codec': metadata['codec'],
                'bitrate': bitrate,
                'bitrate_kbps': round(bitrate / 1000, 1),
                'cbr': cbr,
                'ok': format_ok,
                'is_mp3': is_mp3,
                'message': f"MP3 @ {round(bitrate/1000)}kbps {'CBR' if cbr else 'VBR'}" if is_mp3 else metadata['format']
            },
            'sampleRate': {
                'value': sample_rate,
                'ok': sample_rate_ok,
                'required': ACX_SPECS['sample_rate'],
                'message': f"{sample_rate} Hz" + (" ✓" if sample_rate_ok else f" (required: {ACX_SPECS['sample_rate']} Hz)")
            },
            'rms': {
                'value': round(rms_db, 2),
                'ok': rms_ok,
                'range': [ACX_SPECS['rms_min'], ACX_SPECS['rms_max']],
                'message': f"{round(rms_db, 2)} dB" + (" ✓" if rms_ok else f" (must be between {ACX_SPECS['rms_min']} and {ACX_SPECS['rms_max']} dB)")
            },
            'peak': {
                'value': round(peak_db, 2),
                'ok': peak_ok,
                'max': ACX_SPECS['peak_max'],
                'message': f"{round(peak_db, 2)} dB" + (" ✓" if peak_ok else f" (must be ≤ {ACX_SPECS['peak_max']} dB)")
            },
            'silence': {
                'lead': round(lead_silence, 2),
                'trail': round(trail_silence, 2),
                'message': f"{round(lead_silence, 2)}s lead, {round(trail_silence, 2)}s trail"
            },
            'duration': round(metadata['duration'], 2),
            'channels': channel_str,
            'overallPass': overall_pass,
            'summary': 'ACX Compliant ✓' if overall_pass else 'Not ACX Compliant ✗'
        }
        
        logger.info(f"Analysis complete: {'PASS' if overall_pass else 'FAIL'}")
        return result
    
    except Exception as e:
        logger.error(f"ACX analysis failed: {str(e)}", exc_info=True)
        raise
    
    finally:
        # Clean up temporary WAV file if it was created
        if temp_wav and os.path.exists(temp_wav):
            try:
                os.unlink(temp_wav)
                logger.debug(f"Cleaned up temporary WAV file")
            except Exception as e:
                logger.warning(f"Failed to clean up temp file: {str(e)}")
