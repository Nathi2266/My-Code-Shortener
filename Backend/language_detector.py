from tree_sitter import Language, Parser
import os
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class LanguageDetector:
    def __init__(self):
        self.parsers = {}
        self.initialize_parsers()

    def initialize_parsers(self):
        try:
            # Create parsers directory if it doesn't exist
            if not os.path.exists('parsers'):
                os.makedirs('parsers')

            # Download and build language grammars
            languages = {
                'python': 'https://github.com/tree-sitter/tree-sitter-python',
                'javascript': 'https://github.com/tree-sitter/tree-sitter-javascript',
                'java': 'https://github.com/tree-sitter/tree-sitter-java'
            }

            for lang, repo in languages.items():
                try:
                    # Build the parser
                    Language.build_library(
                        f'parsers/{lang}.so',
                        [repo]
                    )
                    # Create parser instance
                    self.parsers[lang] = Parser()
                    self.parsers[lang].set_language(Language(f'parsers/{lang}.so', lang))
                    logger.info(f"Successfully initialized {lang} parser")
                except Exception as e:
                    logger.error(f"Failed to initialize {lang} parser: {str(e)}")
                    continue

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
