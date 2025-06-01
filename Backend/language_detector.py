from tree_sitter import Language, Parser
import os
import logging
import subprocess
import shutil
from pathlib import Path
import time

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LanguageDetector:
    def __init__(self):
        self.parsers = {}
        self.initialize_parsers()

    def safe_remove_directory(self, path):
        """Safely remove a directory with retries"""
        max_retries = 3
        retry_delay = 1  # seconds

        for attempt in range(max_retries):
            try:
                if os.path.exists(path):
                    # First try to remove read-only attributes
                    for root, dirs, files in os.walk(path):
                        for dir in dirs:
                            os.chmod(os.path.join(root, dir), 0o777)
                        for file in files:
                            os.chmod(os.path.join(root, file), 0o777)
                    
                    shutil.rmtree(path)
                return True
            except Exception as e:
                logger.warning(f"Attempt {attempt + 1} failed to remove {path}: {str(e)}")
                if attempt < max_retries - 1:
                    time.sleep(retry_delay)
                else:
                    logger.error(f"Failed to remove directory after {max_retries} attempts: {path}")
                    return False

    def initialize_parsers(self):
        try:
            # Create parsers directory if it doesn't exist
            parsers_dir = Path('parsers')
            if not parsers_dir.exists():
                parsers_dir.mkdir()

            # Define language repositories
            languages = {
                'python': 'https://github.com/tree-sitter/tree-sitter-python',
                'javascript': 'https://github.com/tree-sitter/tree-sitter-javascript',
                'java': 'https://github.com/tree-sitter/tree-sitter-java'
            }

            # Create a temporary directory for cloning
            temp_dir = Path('temp_grammars')
            self.safe_remove_directory(temp_dir)  # Clean up any existing temp directory
            temp_dir.mkdir()

            for lang, repo in languages.items():
                try:
                    # Clone the repository
                    repo_dir = temp_dir / f'tree-sitter-{lang}'
                    if repo_dir.exists():
                        self.safe_remove_directory(repo_dir)
                    
                    subprocess.run(['git', 'clone', repo, str(repo_dir)], check=True)

                    # Build the parser
                    Language.build_library(
                        str(parsers_dir / f'{lang}.so'),
                        [str(repo_dir)]
                    )

                    # Create parser instance
                    self.parsers[lang] = Parser()
                    self.parsers[lang].set_language(Language(str(parsers_dir / f'{lang}.so'), lang))
                    logger.info(f"Successfully initialized {lang} parser")

                except Exception as e:
                    logger.error(f"Failed to initialize {lang} parser: {str(e)}")
                    continue
                finally:
                    # Clean up the repository directory after building
                    if repo_dir.exists():
                        self.safe_remove_directory(repo_dir)

            # Clean up temporary directory
            self.safe_remove_directory(temp_dir)

        except Exception as e:
            logger.error(f"Failed to initialize parsers: {str(e)}")
            raise

    def detect_language(self, code):
        if not code or not isinstance(code, str):
            return "unknown"
            
        try:
            for lang, parser in self.parsers.items():
                tree = parser.parse(bytes(code, 'utf8'))
                if not tree.root_node.has_error:
                    return lang
            return "unknown"
        except Exception as e:
            logger.error(f"Error detecting language: {str(e)}")
            return "unknown"

# Create a singleton instance
detector = LanguageDetector()