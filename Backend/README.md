# Backend README

## Table of Contents
- [Introduction](#introduction)
- [Technologies Used](#technologies-used)
- [Setup and Installation](#setup-and-installation)
- [Database](#database)
- [API Endpoints](#api-endpoints)
- [Code Structure](#code-structure)
- [Key Logic and Features](#key-logic-and-features)

## Introduction
This directory contains the backend services for the My-Code-Shortener application. It is built using Flask, a Python web framework, and is responsible for handling code shortening, analysis, user authentication, and other core functionalities.

## Technologies Used
- **Python**: The primary programming language.
- **Flask**: A lightweight WSGI web application framework.
- **PyJWT**: Python implementation of JSON Web Tokens for authentication.
- **python-dotenv**: Reads key-value pairs from a .env file and sets them as environment variables.
- **openai**: Python client library for the OpenAI API.
- **black**: Uncompromising Python code formatter.
- **astor**: Read/write Python ASTs. (Used for AST manipulation in code minification)
- **Flask-CORS**: A Flask extension for handling Cross Origin Resource Sharing (CORS).

## Setup and Installation

1.  **Navigate to the Backend directory:**
    ```bash
    cd Backend
    ```
2.  **Create a Python virtual environment:**
    ```bash
    python -m venv venv
    ```
3.  **Activate the virtual environment:**
    -   **Windows:**
        ```bash
        .\venv\Scripts\activate
        ```
    -   **macOS/Linux:**
        ```bash
        source venv/bin/activate
        ```
4.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```
5.  **Run the Flask application:**
    ```bash
    flask run
    ```
    The backend server will typically run on `http://127.0.0.1:5000`.

## Database
This application no longer uses a database. All data is processed in-memory during runtime.

## API Endpoints

The backend exposes the following API endpoints:

| Endpoint                           | Method | Description                                                |
| :--------------------------------- | :----- | :--------------------------------------------------------- |
| `/detect`                          | `POST` | Detects the programming language of a given code snippet.  |
| `/api/shorten`                     | `POST` | Shortens a provided code snippet.                          |
| `/upgrade`                         | `POST` | Applies various transformations to a code snippet.         |
| `/process-zip`                     | `POST` | Processes a zip file containing multiple code files.       |
| `/metrics`                         | `POST` | Tracks application metrics (e.g., color mode usage).       |
| `/api/explain`                     | `POST` | Provides an explanation for a given code snippet.          |
| `/api/summarize-functions`         | `POST` | Summarizes functions within a code snippet.                |
| `/api/analyze`                     | `POST` | Analyzes code to provide function details and complexity.  |

## Code Structure

-   **`app.py`**: The main Flask application file. It defines all the routes and handles API requests.
-   **`pyrightconfig.json`**: Configuration file for Pyright, a static type checker for Python.
-   **`requirements.txt`**: Lists all the Python dependencies required for the backend.
-   **`support.py`**: A now-empty file that previously contained database-related code, but is now obsolete and can be removed.

## Key Logic and Features

-   **Code Minification (`minify_python`, `shorten_code`)**: Functions to reduce the size of code by removing comments, docstrings, and extra whitespace. Supports Python and other languages via regex-based stripping.
-   **Language Detection (`detect_language_simple`)**: A simple utility to identify the programming language of a given code snippet.
-   **Code Analysis (`calculate_stats`, `calculate_complexity`, `analyze_code_structure`, `analyze_python_functions`, `estimate_runtime_diff`)**: Provides various metrics and insights into code, including character/line savings, complexity scores (cyclomatic, maintainability), and estimated runtime differences.
-   **Code Transformation/Upgrade (`upgrade_code`, `refactor_identifiers`, `add_type_annotations`, `format_code`, `generate_docstrings_via_openai`, `modernize_syntax`)**: Endpoints and functions that allow for automated code improvements such as refactoring, type annotation addition, formatting (using `black`), docstring generation (using OpenAI), and Python 2 to 3 syntax modernization.
-   **Zip File Processing (`process_zip_file`)**: Handles the ingestion and processing of `.zip` archives containing multiple code files, applying shortening and analysis to each.