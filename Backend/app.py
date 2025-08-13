from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import re
import time
import ast
import astor
import hashlib
from functools import lru_cache, wraps
import subprocess
import tempfile
import os
import openai
import json
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
import zipfile
import io
from pathlib import Path
import mimetypes
import logging
from collections import defaultdict
import jwt
from datetime import datetime, timedelta
import secrets
from pygments.lexers import guess_lexer_for_filename, get_lexer_by_name
from pygments.util import ClassNotFound
import concurrent.futures
# from your_analysis_tools import analyze_python_code, analyze_javascript_code # hypothetical functions

logger = logging.getLogger(__name__)

# Constants
CODE_LENGTH_THRESHOLD = 5000
MASKING_SUPPORTED_EXTENSIONS = {
	'.txt', '.js', '.py', '.env', '.json', '.yml', '.yaml', '.html', '.php', '.java', '.c', '.cpp'
}

# Initialize Flask app first
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Load SECRET_KEY from environment variable, or generate a new one if not set
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')
if not app.config['SECRET_KEY']:
    app.config['SECRET_KEY'] = secrets.token_hex(32)
    logger.warning("SECRET_KEY not set in environment, generating a new one. This will invalidate existing tokens on restart. For production, set a persistent SECRET_KEY environment variable.")

# In-memory database for snippets (for demonstration purposes)
# In a real application, this would be replaced with a persistent database
snippets_db = {} 

# User database (for demonstration purposes)
users_db = {
    "user1@example.com": {"password": "hashed_password_1", "user_id": "user1"},
    "user2@example.com": {"password": "hashed_password_2", "user_id": "user2"}
}

def generate_short_id():
    """Generates a unique short ID for snippets."""
    return secrets.token_urlsafe(6)

def jwt_required(f):
    """
    Decorator to protect API routes, ensuring a valid JWT is present.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'x-access-token' in request.headers:
            token = request.headers['x-access-token']
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = data['user_id']
        except Exception as e:
            return jsonify({'message': 'Token is invalid!', 'error': str(e)}), 401
        return f(current_user, *args, **kwargs)
    return decorated

def fast_strip(code_str):
    """Quickly strip comments and blank lines from Python code"""
    lines = code_str.split('\n')
    result_lines = []
    in_multiline_comment = False
    
    for line in lines:
        # Handle multiline comments
        if '"""' in line or "'''" in line:
            in_multiline_comment = not in_multiline_comment
            continue
        if in_multiline_comment:
            continue
            
        # Remove inline comments and leading/trailing whitespace
        temp = re.sub(r'#.*', '', line).rstrip()
        if temp:
            result_lines.append(temp)
    
    return '\n'.join(result_lines)

def minify_python(code):
    """Minify Python code using either fast_strip or AST-based approach"""
    try:
        # For long code, try fast_strip first
        if len(code) > CODE_LENGTH_THRESHOLD:
            fast_stripped = fast_strip(code)
            try:
                # Validate the stripped code
                compile(fast_stripped, '<string>', 'exec')
                return fast_stripped
            except SyntaxError:
                # Fall back to AST-based minification if fast_strip fails
                pass
        
        # AST-based minification for shorter code or if fast_strip failed
        tree = ast.parse(code)
        
        # Remove comments and docstrings
        for node in ast.walk(tree):
            # Remove docstrings
            if isinstance(node, (ast.FunctionDef, ast.ClassDef, ast.Module)):
                if (len(node.body) > 0 and 
                    isinstance(node.body[0], ast.Expr) and 
                    isinstance(node.body[0].value, ast.Str)):
                    node.body.pop(0)
        
        # Convert back to source code
        minified = astor.to_source(tree)
        
        # Clean up extra newlines and spaces
        minified = re.sub(r'\n\s*\n', '\n', minified)  # Remove multiple newlines
        minified = re.sub(r'^\s+', '', minified, flags=re.MULTILINE)  # Remove leading spaces
        minified = re.sub(r'\s+$', '', minified, flags=re.MULTILINE)  # Remove trailing spaces
        
        return minified.strip()
    except Exception as e:
        print(f"Error minifying Python code: {e}")
        return code

def minify_js(code: str) -> str:
    """Placeholder for JavaScript minification."""
    # You would implement actual JavaScript minification logic here
    return code

def minify_java(code: str) -> str:
    """Placeholder for Java minification."""
    # You would implement actual Java minification logic here
    return code

def detect_language_simple(code):
    """Simple language detection based on code patterns"""
    if 'def ' in code or 'import ' in code or 'print(' in code:
        return 'Python'
    elif 'function ' in code or 'const ' in code or 'let ' in code:
        return 'JavaScript'
    elif 'public class' in code or 'void ' in code:
        return 'Java'
    return 'unknown'

def shorten_code(code, compression_percent=50, language=None):
    """Shorten code based on language and compression percentage"""
    if language is None:
        language = detect_language_simple(code)
    
    if language == 'Python':
        return minify_python(code)
    
    # For non-Python code, use the existing regex-based approach
    compression_ratio = compression_percent / 100.0
    
    if compression_ratio > 0:
        code = re.sub(r'//.*', '', code)
    
    if compression_ratio > 0.3:
        code = re.sub(r'/\*.*?\*/', '', code, flags=re.DOTALL)
    
    if compression_ratio > 0.5:
        code = re.sub(r'\n\s*\n', '\n', code)
        code = re.sub(r'^\s+', '', code, flags=re.MULTILINE)
    
    if compression_ratio > 0.7:
        code = re.sub(r'\s+', ' ', code)
    
    return code.strip()

def calculate_stats(original, shortened):
    """Calculate detailed statistics about the code transformation"""
    orig_lines = len(original.splitlines())
    short_lines = len(shortened.splitlines())
    
    orig_chars = len(original)
    short_chars = len(shortened)
    
    return {
        'chars_saved': orig_chars - short_chars,
        'lines_reduced': orig_lines - short_lines,
        'reduction_percentage': round((1 - short_chars / orig_chars) * 100, 1),
        'compression_ratio': round(short_chars / orig_chars, 2)
    }

def calculate_complexity(code):
    """Calculate code complexity using Python's ast module"""
    try:
        tree = ast.parse(code)
        complexity = 0
        
        # Count control flow statements
        for node in ast.walk(tree):
            if isinstance(node, (ast.If, ast.While, ast.For, ast.FunctionDef, 
                               ast.Try, ast.ExceptHandler, ast.With)):
                complexity += 1
            elif isinstance(node, ast.BoolOp):
                complexity += len(node.values) - 1
            elif isinstance(node, ast.Return):
                complexity += 1
        
        # Calculate maintainability index
        loc = len(code.splitlines())
        comment_lines = len([line for line in code.splitlines() if line.strip().startswith('#')])
        code_lines = loc - comment_lines
        
        # Simple maintainability score (0-100)
        maintainability = max(0, min(100, 100 - (complexity * 2) - (code_lines * 0.1)))
        
        return {
            'score': complexity,
            'maintainability': maintainability,
            'loc': loc,
            'code_lines': code_lines,
            'comment_lines': comment_lines
        }
    except Exception as e:
        return {
            'score': 0,
            'maintainability': 0,
            'loc': 0,
            'code_lines': 0,
            'comment_lines': 0,
            'error': str(e)
        }

def estimate_runtime_diff(original, shortened):
    """Estimate runtime difference between original and shortened code"""
    try:
        # Simple benchmark by executing both versions
        start_orig = time.time()
        compile(original, '<string>', 'exec')
        orig_time = time.time() - start_orig

        start_short = time.time()
        compile(shortened, '<string>', 'exec')
        short_time = time.time() - start_short

        diff_ms = (short_time - orig_time) * 1000
        return {
            'diff_ms': round(diff_ms, 2),
            'status': '▲ Faster' if diff_ms < 0 else '▼ Slower' if diff_ms > 0 else '≈ Neutral'
        }
    except Exception:
        return {'diff_ms': 0, 'status': '≈ Neutral'}

def refactor_identifiers(code: str) -> str:
    """Refactor non-descriptive variable names"""
    try:
        tree = ast.parse(code)
        # Implementation of variable refactoring
        return astor.to_source(tree)
    except Exception:
        return code

def add_type_annotations(code: str) -> str:
    """Add type annotations to functions"""
    try:
        tree = ast.parse(code)
        # Implementation of type annotation addition
        return astor.to_source(tree)
    except Exception:
        return code

def format_code(code: str) -> str:
    """Format code using black"""
    try:
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as temp:
            temp.write(code)
            temp_path = temp.name

        subprocess.run(['black', temp_path], check=True)
        
        with open(temp_path, 'r') as temp:
            formatted_code = temp.read()
        
        os.unlink(temp_path)
        return formatted_code
    except Exception:
        return code

def generate_docstrings_via_openai(code: str) -> str:
    """Generate docstrings using OpenAI API"""
    try:
        prompt = f"Generate Google-style docstrings for each function in the following Python code:\n\n{code}"
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}]
        )
        return response['choices'][0]['message']['content']
    except Exception:
        return code

def modernize_syntax(code: str) -> str:
    """Modernize Python 2 syntax to Python 3"""
    try:
        # Implementation of syntax modernization
        return code
    except Exception:
        return code

def is_code_file(filename):
    """Check if a file is likely to be a code file based on extension"""
    code_extensions = {
        '.py', '.js', '.java', '.cpp', '.c', '.h', '.hpp', '.cs', '.php',
        '.rb', '.go', '.rs', '.swift', '.kt', '.ts', '.jsx', '.tsx', '.html',
        '.css', '.scss', '.sql', '.sh', '.bash', '.ps1'
    }
    return Path(filename).suffix.lower() in code_extensions

def process_zip_file(zip_data):
    """Process a zip file and return processed files information"""
    results = []
    
    with zipfile.ZipFile(io.BytesIO(zip_data)) as zip_ref:
        # Get list of files in zip
        file_list = zip_ref.namelist()
        
        # Process each file
        for filename in file_list:
            if not is_code_file(filename):
                continue
                
            try:
                # Read file content
                with zip_ref.open(filename) as file:
                    content = file.read().decode('utf-8')
                
                # Detect language
                language = detect_language_simple(content)
                
                # Shorten code
                shortened = shorten_code(content, language=language)
                
                # Calculate stats
                stats = calculate_stats(content, shortened)
                
                # Add to results
                results.append({
                    'filename': filename,
                    'language': language,
                    'original': content,
                    'shortened': shortened,
                    'stats': stats
                })
                
            except Exception as e:
                results.append({
                    'filename': filename,
                    'error': str(e)
                })
    
    return results

# ===================== Sensitive Data Masking =====================

# Thread pool for async processing
executor = concurrent.futures.ThreadPoolExecutor(max_workers=4)

# In-memory job store; only masked outputs are stored
masking_jobs = {}

def _mask_keep_last(value: str, keep: int = 4) -> str:
    if not value:
        return value
    if len(value) <= keep:
        return '*' * len(value)
    return '*' * (len(value) - keep) + value[-keep:]

def _mask_keep_prefix_and_last(value: str, prefix_len: int = 0, keep_last: int = 4) -> str:
    if not value:
        return value
    prefix = value[:prefix_len]
    remainder = value[prefix_len:]
    return f"{prefix}{_mask_keep_last(remainder, keep_last)}"

def get_masking_patterns():
    # Compiled regex patterns with masking strategies
    patterns = [
        {
            'name': 'OpenAI API Key',
            'regex': re.compile(r"\b(sk-[A-Za-z0-9]{20,})\b"),
            'mask': lambda m: _mask_keep_prefix_and_last(m.group(1), prefix_len=3, keep_last=4)
        },
        {
            'name': 'AWS Access Key ID',
            'regex': re.compile(r"\b((?:AKIA|ASIA|ANPA)[A-Z0-9]{16})\b"),
            'mask': lambda m: _mask_keep_last(m.group(1), keep=4)
        },
        {
            'name': 'AWS Secret Access Key',
            'regex': re.compile(r"(?i)(aws_?secret_?access_?key\s*[:=]\s*[\"\']?)([A-Za-z0-9/+=]{40})([\"\']?)"),
            'mask': lambda m: f"{m.group(1)}{'*' * 8}{m.group(3)}"
        },
        {
            'name': 'Private Key Block',
            'regex': re.compile(r"(-----BEGIN [A-Z ]*PRIVATE KEY-----)([\s\S]*?)(-----END [A-Z ]*PRIVATE KEY-----)", re.MULTILINE),
            'mask': lambda m: f"{m.group(1)}\n***MASKED PRIVATE KEY***\n{m.group(3)}"
        },
        {
            'name': 'Bearer JWT Token',
            'regex': re.compile(r"(?i)(Bearer\s+)([A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+)"),
            'mask': lambda m: f"{m.group(1)}***.***.***"
        },
        {
            'name': 'Password Assignment',
            'regex': re.compile(r"(?i)(?:\b(password|pwd|pass|db_pass|db_password)\b\s*[:=]\s*)([\"\']?)([^\n\"\']+)(\2)"),
            'mask': lambda m: re.sub(re.escape(m.group(3)), '********', m.group(0))
        },
        {
            'name': 'Generic Token/Secret Assignment',
            'regex': re.compile(r"(?i)(?:\b(token|secret|api[_-]?key|access[_-]?token)\b\s*[:=]\s*)([\"\']?)([A-Za-z0-9._-]{8,})(\2)"),
            'mask': lambda m: re.sub(re.escape(m.group(3)), _mask_keep_last(m.group(3), 4), m.group(0))
        },
        {
            'name': 'URL Credential Parameter',
            'regex': re.compile(r"(?i)([?&](?:api[_-]?key|access[_-]?token|token|key)=)([^&\s]+)"),
            'mask': lambda m: f"{m.group(1)}{'*' * 8}"
        },
        {
            'name': '.env Sensitive Variable',
            'regex': re.compile(r"(?im)^(\s*[A-Z0-9_]*(?:SECRET|TOKEN|PASSWORD|PASS|API_KEY|AWS_ACCESS_KEY_ID|AWS_SECRET_ACCESS_KEY|OPENAI_API_KEY)[A-Z0-9_]*\s*=\s*)(.+)$"),
            'mask': lambda m: f"{m.group(1)}********"
        },
    ]
    return patterns

def mask_sensitive_content(filename: str, text: str) -> dict:
    # Only process if supported extension
    suffix = Path(filename).suffix.lower()
    if suffix and suffix not in MASKING_SUPPORTED_EXTENSIONS:
        return {
            'filename': filename,
            'masked_text': text,
            'detections': [],
            'masked': False
        }

    masked_text = text
    detections_map = {}

    for rule in get_masking_patterns():
        def _replace(match):
            masked_segment = rule['mask'](match)
            detections_map[rule['name']] = detections_map.get(rule['name'], 0) + 1
            return masked_segment
        masked_text, num = rule['regex'].subn(_replace, masked_text)

    detections = [{'type': k, 'count': v} for k, v in detections_map.items()]
    return {
        'filename': filename,
        'masked_text': masked_text,
        'detections': detections,
        'masked': len(detections) > 0
    }

def process_zip_for_masking(zip_bytes: bytes) -> dict:
    in_mem = io.BytesIO(zip_bytes)
    report = {'files': [], 'summary': {'total_files': 0, 'files_masked': 0, 'detections_by_type': {}}}
    out_zip_mem = io.BytesIO()

    with zipfile.ZipFile(in_mem, 'r') as zin, zipfile.ZipFile(out_zip_mem, 'w', compression=zipfile.ZIP_DEFLATED) as zout:
        for info in zin.infolist():
            if info.is_dir():
                continue
            filename = info.filename
            report['summary']['total_files'] += 1

            try:
                data = zin.read(info.filename)
                suffix = Path(filename).suffix.lower()
                if suffix and suffix in MASKING_SUPPORTED_EXTENSIONS:
                    try:
                        text = data.decode('utf-8')
                    except Exception:
                        # Fallback to latin-1 for text-like files
                        text = data.decode('latin-1')

                    result = mask_sensitive_content(filename, text)
                    file_detections = result['detections']
                    if result['masked']:
                        report['summary']['files_masked'] += 1
                        for det in file_detections:
                            report['summary']['detections_by_type'][det['type']] = report['summary']['detections_by_type'].get(det['type'], 0) + det['count']

                    report['files'].append({
                        'filename': filename,
                        'masked': result['masked'],
                        'detections': file_detections
                    })

                    # Write masked text back preserving filename
                    zout.writestr(filename, result['masked_text'])
                else:
                    # Not a supported text file; copy as-is and record as unprocessed
                    report['files'].append({
                        'filename': filename,
                        'masked': False,
                        'detections': []
                    })
                    zout.writestr(filename, data)
            except Exception as e:
                # Write original file back unchanged on error, but do not log sensitive content
                report['files'].append({
                    'filename': filename,
                    'masked': False,
                    'error': 'processing_error'
                })
                try:
                    zout.writestr(filename, data)
                except Exception:
                    # Skip if even writing fails
                    pass

    out_zip_mem.seek(0)
    return {'zip_bytes': out_zip_mem.read(), 'report': report}

def process_single_file_for_masking(filename: str, file_bytes: bytes) -> dict:
    try:
        try:
            text = file_bytes.decode('utf-8')
        except Exception:
            text = file_bytes.decode('latin-1')

        result = mask_sensitive_content(filename, text)
        report = {
            'files': [{
                'filename': filename,
                'masked': result['masked'],
                'detections': result['detections']
            }],
            'summary': {
                'total_files': 1,
                'files_masked': 1 if result['masked'] else 0,
                'detections_by_type': {det['type']: det['count'] for det in result['detections']}
            }
        }

        # Return as a zip with the single masked file and JSON report
        out_zip_mem = io.BytesIO()
        with zipfile.ZipFile(out_zip_mem, 'w', compression=zipfile.ZIP_DEFLATED) as zout:
            zout.writestr(filename, result['masked_text'])
        out_zip_mem.seek(0)
        return {'zip_bytes': out_zip_mem.read(), 'report': report}
    except Exception:
        # On failure, return the original bytes zipped without logging content
        out_zip_mem = io.BytesIO()
        with zipfile.ZipFile(out_zip_mem, 'w', compression=zipfile.ZIP_DEFLATED) as zout:
            zout.writestr(filename, file_bytes)
        out_zip_mem.seek(0)
        return {'zip_bytes': out_zip_mem.read(), 'report': {'files': [{'filename': filename, 'masked': False, 'error': 'processing_error'}], 'summary': {'total_files': 1, 'files_masked': 0, 'detections_by_type': {}}}}

def _run_masking_job(job_id: str, original_filename: str, upload_bytes: bytes):
    try:
        masking_jobs[job_id]['status'] = 'processing'
        # Decide if input is a zip
        is_zip = False
        try:
            is_zip = zipfile.is_zipfile(io.BytesIO(upload_bytes))
        except Exception:
            is_zip = False

        if is_zip:
            result = process_zip_for_masking(upload_bytes)
        else:
            result = process_single_file_for_masking(original_filename, upload_bytes)

        # Append a masking_report.json inside the zip
        zip_with_report = io.BytesIO()
        with zipfile.ZipFile(io.BytesIO(result['zip_bytes']), 'r') as base_zip, zipfile.ZipFile(zip_with_report, 'w', compression=zipfile.ZIP_DEFLATED) as zout:
            # Copy all files
            for info in base_zip.infolist():
                if info.is_dir():
                    continue
                data = base_zip.read(info.filename)
                zout.writestr(info.filename, data)
            # Add report as JSON
            zout.writestr('masking_report.json', json.dumps(result['report'], indent=2))

        zip_with_report.seek(0)
        masking_jobs[job_id]['status'] = 'done'
        masking_jobs[job_id]['result_zip'] = zip_with_report.read()
        masking_jobs[job_id]['report'] = result['report']
    except Exception as e:
        masking_jobs[job_id]['status'] = 'error'
        masking_jobs[job_id]['error'] = 'processing_error'

@app.route('/api/mask/upload', methods=['POST'])
def upload_for_masking():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        f = request.files['file']
        filename = f.filename or 'upload'
        upload_bytes = f.read()

        job_id = secrets.token_urlsafe(16)
        masking_jobs[job_id] = {
            'status': 'queued',
            'created_at': datetime.utcnow().isoformat(),
            'original_name': filename
        }

        executor.submit(_run_masking_job, job_id, filename, upload_bytes)
        return jsonify({'job_id': job_id, 'status': 'queued'})
    except Exception:
        return jsonify({'error': 'upload_error'}), 500

@app.route('/api/mask/status/<job_id>', methods=['GET'])
def masking_status(job_id):
    job = masking_jobs.get(job_id)
    if not job:
        return jsonify({'error': 'not_found'}), 404
    safe = {'status': job['status'], 'created_at': job.get('created_at')}
    if job['status'] == 'done':
        safe['report'] = job.get('report', {})
    if job['status'] == 'error':
        safe['error'] = job.get('error', 'processing_error')
    return jsonify(safe)

@app.route('/api/mask/download/<job_id>', methods=['GET'])
def masking_download(job_id):
    job = masking_jobs.get(job_id)
    if not job:
        return jsonify({'error': 'not_found'}), 404
    if job.get('status') != 'done':
        return jsonify({'error': 'not_ready'}), 409
    result_zip = job.get('result_zip')
    if not result_zip:
        return jsonify({'error': 'missing_result'}), 500
    mem = io.BytesIO(result_zip)
    mem.seek(0)
    download_name = f"masked_{job.get('original_name', 'files')}.zip"
    return send_file(mem, mimetype='application/zip', as_attachment=True, download_name=download_name)

@app.route('/detect', methods=['POST'])
def detect_language():
    try:
        code = request.json.get('code', '')
        if not code:
            return jsonify({'error': 'No code provided'}), 400
            
        language = detect_language_simple(code)
        return jsonify({'language': language})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/shorten', methods=['POST'])
def shorten():
    try:
        data = request.get_json()
        code = data.get('code', '')
        compression_percent = data.get('compressionPercent', 50)
        lang = data.get('lang', 'python').lower()  # Get language from request

        if not code:
            return jsonify({"error": "No code provided"}), 400

        # Language-specific minification
        try:
            if lang == "python":
                compressed = minify_python(code)
            elif lang == "javascript":
                compressed = minify_js(code)
            elif lang == "java":
                compressed = minify_java(code)
            else:
                return jsonify({"error": "Unsupported language"}), 415
        except Exception as e:
            logger.error(f"Error during minification for language {lang}: {str(e)}")
            return jsonify({"error": f"Minification failed for {lang}: {str(e)}"}), 500

        return jsonify({
            "original": code,
            "shortened": compressed,
            "language": lang,
            "compression": compression_percent
        })
        
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/upgrade', methods=['POST'])
def upgrade_code():
    try:
        data = request.get_json()
        code = data.get('code', '')
        options = data.get('upgradeOptions', [])
        
        if not code:
            return jsonify({"error": "No code provided"}), 400
        
        transformed = code
        applied = []
        
        # Apply transformations in order
        if 'refactor' in options:
            transformed = refactor_identifiers(transformed)
            applied.append('refactor')
        
        if 'types' in options:
            transformed = add_type_annotations(transformed)
            applied.append('types')
        
        if 'lint' in options:
            transformed = format_code(transformed)
            applied.append('lint')
        
        if 'docs' in options:
            transformed = generate_docstrings_via_openai(transformed)
            applied.append('docs')
        
        if 'modern' in options:
            transformed = modernize_syntax(transformed)
            applied.append('modern')
        
        return jsonify({
            "original": code,
            "upgraded": transformed,
            "applied": applied
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/process-zip', methods=['POST'])
def process_zip():
    """Process a zip file containing code files"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
            
        file = request.files['file']
        if not file.filename.endswith('.zip'):
            return jsonify({'error': 'File must be a zip archive'}), 400
            
        # Read zip file
        zip_data = file.read()
        
        # Process zip file
        results = process_zip_file(zip_data)
        
        # Calculate overall statistics
        total_files = len(results)
        successful_files = len([r for r in results if 'error' not in r])
        total_chars_saved = sum(r['stats']['chars_saved'] for r in results if 'error' not in r)
        
        return jsonify({
            'success': True,
            'summary': {
                'total_files': total_files,
                'successful_files': successful_files,
                'total_chars_saved': total_chars_saved
            },
            'files': results
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login_user():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        user = users_db.get(email)

        if not user or user['password'] != password:  # In a real app, use hashed passwords
            return jsonify({'message': 'Invalid credentials'}), 401

        token = jwt.encode({
            'user_id': user['user_id'],
            'exp': datetime.utcnow() + timedelta(minutes=30)  # Token expires in 30 minutes
        }, app.config['SECRET_KEY'], algorithm="HS256")

        return jsonify({'token': token})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/snippets', methods=['POST'])
@jwt_required
def create_snippet(current_user):
    try:
        data = request.get_json()
        code = data.get('code')
        language = data.get('language')
        title = data.get('title', 'Untitled Snippet')

        if not code:
            return jsonify({'message': 'Code is required'}), 400

        short_id = generate_short_id()
        created_at = datetime.utcnow().isoformat()

        snippets_db[short_id] = {
            'short_id': short_id,
            'user_id': current_user,
            'code': code,
            'language': language,
            'title': title,
            'created_at': created_at,
            'updated_at': created_at
        }
        return jsonify({'message': 'Snippet created', 'snippet': snippets_db[short_id]}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/snippets', methods=['GET'])
@jwt_required
def get_user_snippets(current_user):
    try:
        user_snippets = [
            snippet for snippet in snippets_db.values()
            if snippet['user_id'] == current_user
        ]
        return jsonify(user_snippets), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/snippets/<short_id>', methods=['PUT'])
@jwt_required
def edit_snippet(current_user, short_id):
    try:
        data = request.get_json()
        new_code = data.get('code')
        new_title = data.get('title')

        snippet = snippets_db.get(short_id)

        if not snippet:
            return jsonify({'message': 'Snippet not found'}), 404

        if snippet['user_id'] != current_user:
            return jsonify({'message': 'Unauthorized to edit this snippet'}), 403

        if new_code:
            snippet['code'] = new_code
        if new_title:
            snippet['title'] = new_title
        snippet['updated_at'] = datetime.utcnow().isoformat()

        return jsonify({'message': 'Snippet updated', 'snippet': snippet}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/snippets/<short_id>', methods=['DELETE'])
@jwt_required
def delete_snippet(current_user, short_id):
    try:
        snippet = snippets_db.get(short_id)

        if not snippet:
            return jsonify({'message': 'Snippet not found'}), 404

        if snippet['user_id'] != current_user:
            return jsonify({'message': 'Unauthorized to delete this snippet'}), 403

        del snippets_db[short_id]
        return jsonify({'message': 'Snippet deleted'}), 204
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/metrics', methods=['POST'])
def track_metrics():
    data = request.get_json()
    # Add color mode to metrics tracking
    color_mode = data.get('colorMode', 'light')
    # ... rest of metrics logic ...

@app.route('/api/explain', methods=['POST'])
def explain_code():
    try:
        data = request.json
        # Add your explanation logic here
        return jsonify({"explanation": "Sample explanation"})
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/summarize-functions', methods=['POST'])
def summarize_functions():
    try:
        code = request.json['code']

        analysis_results = {
            'status': 'success',
            'data': {'summaries': []},
            'warnings': [],
            'errors': []
        }

        # Static analysis fallback
        try:
            static_analysis = analyze_code_structure(code)
            analysis_results['data']['summaries'] = static_analysis
        except Exception as e:
            analysis_results['warnings'].append(f'Static analysis failed: {str(e)}')

        # OpenAI enhanced analysis if configured
        try:
            if 'OPENAI_API_KEY' in os.environ:
                openai_summaries = generate_ai_summaries(code)
                analysis_results['data']['summaries'] = merge_summaries(
                    analysis_results['data']['summaries'], 
                    openai_summaries
                )
        except Exception as e:
            analysis_results['warnings'].append(f'AI analysis failed: {str(e)}')
        
        return jsonify(analysis_results), 200

    except Exception as e:
        return jsonify({
            'status': 'error',
            'error': str(e),
            'data': {},
            'warnings': []
        }), 500

def parse_ai_response(response_content: str) -> List[Dict]:
    """
    Parses the string content from the AI response into a structured format.
    This is a placeholder and should be implemented to correctly parse the AI's output.
    """
    # Example: In a real scenario, you might parse JSON or a specific text format
    print(f"AI Response Content to Parse: {response_content}") # For debugging
    return [] # Return an empty list for now, or a dummy structure if you know the expected format.

def generate_ai_summaries(code: str) -> List[Dict]:
    """Use OpenAI API to generate function summaries and refactoring suggestions"""
    client = openai.OpenAI()
    
    response = client.chat.completions.create(
        model="gpt-4-turbo",
        messages=[{
            "role": "system",
            "content": """Analyze this code and generate:
            1. Function summaries with inputs/outputs
            2. Refactoring suggestions
            3. Complexity estimates"""
        }, {
            "role": "user",
            "content": code
        }],
        temperature=0.2
    )
    
    return parse_ai_response(response.choices[0].message.content)

def merge_summaries(static_summaries: List[Dict], ai_summaries: List[Dict]) -> List[Dict]:
    """Merge results from static and AI analysis"""
    # Implementation logic to merge analyses
    return static_summaries  # Simplified for example

def parse_functions(code: str) -> List[Dict]:
    """
    Parses the code to extract function information based on detected language.
    This acts as a dispatcher to language-specific analysis functions.
    """
    language = detect_language_simple(code)
    if language == 'Python':
        return analyze_python_functions(code)
    # Add more language handlers here as needed
    return [] # Return empty for unsupported languages or if no functions are found

def analyze_code_structure(code: str) -> List[Dict]:
    """Enhanced static code analysis"""
    # Existing analysis logic improved with better error handling
    try:
        return parse_functions(code)  # Existing function with improved error handling
    except SyntaxError as e:
        logger.warning(f"Syntax error in code: {e}")
        return []

def analyze_python_functions(code):
    try:
        tree = ast.parse(code)
        functions = []
        
        class FunctionAnalyzer(ast.NodeVisitor):
            def visit_FunctionDef(self, node):
                func_info = {
                    'name': node.name,
                    'inputs': [],
                    'returns': None,
                    'side_effects': [],
                    'start_line': node.lineno,
                    'end_line': node.end_lineno
                }
                
                # Analyze arguments
                for arg in node.args.args:
                    param = {
                        'name': arg.arg,
                        'type': ast.unparse(arg.annotation) if arg.annotation else None
                    }
                    func_info['inputs'].append(param)
                
                # Analyze return type
                if node.returns:
                    func_info['returns'] = ast.unparse(node.returns)
                
                # Detect side effects
                side_effects = set()
                for child in ast.walk(node):
                    if isinstance(child, ast.Global):
                        side_effects.update(child.names)
                    elif isinstance(child, (ast.Call, ast.Expr)):
                        # Detect I/O operations
                        if isinstance(child.value, ast.Name) and child.value.id in ['print', 'open']:
                            side_effects.add(child.value.id)
                        elif isinstance(child.value, ast.Attribute) and child.value.attr in ['write', 'read']:
                            side_effects.add(child.value.attr)
                
                func_info['side_effects'] = list(side_effects)
                functions.append(func_info)
                
                self.generic_visit(node)
        
        analyzer = FunctionAnalyzer()
        analyzer.visit(tree)
        return functions
    
    except Exception as e:
        logger.error(f"Python analysis error: {e}")
        return []

@app.route('/api/analyze', methods=['POST'])
def analyze_code():
    code_snippet = request.json.get('code')
    if not code_snippet:
        return jsonify({'error': 'No code provided'}), 400

    language = 'unknown'
    try:
        # Pygments requires a filename to guess the lexer correctly
        # We use a dummy filename to give it a hint
        lexer = guess_lexer_for_filename('temp.txt', code_snippet)
        language = lexer.aliases[0]
    except (ClassNotFound, IndexError):
        # If Pygments can't determine the language, we default to 'unknown'
        language = 'unknown'

    analysis_results = {'language': language}

    # Now, based on the detected language, call the appropriate analysis function
    if language == 'python':
        analysis_results.update(analyze_python_code(code_snippet))
    elif language == 'javascript':
        analysis_results.update(analyze_javascript_code(code_snippet))
    else:
        # A simple response for unsupported languages
        analysis_results.update({'message': f'Analysis for {language} is not supported.'})

    return jsonify(analysis_results)

# A sample analysis function that can be implemented for a specific language
def analyze_python_code(code):
    # This is where you'd integrate tools like Radon or Pylint
    # Example using Radon (you would need to write code to execute and parse)
    # import subprocess
    # with open('temp_code.py', 'w') as f:
    #     f.write(code)
    # result = subprocess.run(['radon', 'cc', 'temp_code.py'], capture_output=True, text=True)
    # ... and so on
    return {
        'complexity': 10,
        'maintainability': 85,
        'suggestions': ['Add docstrings to functions.']
    }

def analyze_javascript_code(code):
    return {"analysis": "JavaScript code analysis results go here."}

if __name__ == '__main__':
    app.run(debug=True, port=5000)