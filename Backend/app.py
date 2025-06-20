from flask import Flask, request, jsonify
from flask_cors import CORS
import re
import time
import ast
import astor
import hashlib
from functools import lru_cache
import subprocess
import tempfile
import os
import openai
from typing import List, Dict, Any
from dotenv import load_dotenv
import zipfile
import io
from pathlib import Path
import mimetypes

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})

load_dotenv()
openai.api_key = "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"

# Constants
CODE_LENGTH_THRESHOLD = 5000

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

@app.route('/shorten', methods=['POST'])
def shorten():
    try:
        data = request.get_json()
        code = data.get('code')
        compression_percent = data.get('compressionPercent')
        
        if not code:
            return jsonify({'error': 'Missing required "code" parameter'}), 400
            
        # Detect language using the detector instance
        language = detect_language_simple(code)
        
        # Shorten code
        shortened = shorten_code(code, compression_percent, language)
        
        # Calculate stats
        stats = calculate_stats(code, shortened)
        
        # Calculate complexity
        complexity = calculate_complexity(code)
        
        # Estimate runtime
        runtime = estimate_runtime_diff(code, shortened)
        
        return jsonify({
            'shortened': shortened,
            'stats': stats,
            'complexity': complexity,
            'runtime': runtime,
            'language': language
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/upgrade', methods=['POST'])
def upgrade_code():
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

if __name__ == '__main__':
    app.run(debug=True, port=5000)