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
- **Flask-SQLAlchemy**: An extension for Flask that adds SQLAlchemy support.
- **psycopg2-binary**: PostgreSQL adapter for Python. (Inferred from `requirements.txt` and `database_setup.py`)
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
5.  **Set up the database:**
    Ensure you have PostgreSQL running and credentials configured in your environment variables or in `database_setup.py`.
    ```bash
    python database_setup.py
    ```
6.  **Run the Flask application:**
    ```bash
    flask run
    ```
    The backend server will typically run on `http://127.0.0.1:5000`.

## Database
The backend uses PostgreSQL as its database, managed through SQLAlchemy. The database schema is defined and initialized via `support.py` and `database_setup.py`.

-   **`support.py`**: Defines the `User` model and initializes the SQLAlchemy `db` object.
-   **`database_setup.py`**: A script to set up the PostgreSQL database and create a dedicated user with necessary privileges. It checks for the existence of the database and user before creation.

## API Endpoints

The backend exposes the following API endpoints:

| Endpoint                           | Method | Description                                                | Authentication |
| :--------------------------------- | :----- | :--------------------------------------------------------- | :------------- |
| `/detect`                          | `POST` | Detects the programming language of a given code snippet.  | None           |
| `/api/shorten`                     | `POST` | Shortens a provided code snippet.                          | None           |
| `/upgrade`                         | `POST` | Applies various transformations to a code snippet.         | None           |
| `/process-zip`                     | `POST` | Processes a zip file containing multiple code files.       | None           |
| `/metrics`                         | `POST` | Tracks application metrics (e.g., color mode usage).       | None           |
| `/api/explain`                     | `POST` | Provides an explanation for a given code snippet.          | None           |
| `/api/summarize-functions`         | `POST` | Summarizes functions within a code snippet.                | None           |
| `/api/analyze`                     | `POST` | Analyzes code to provide function details and complexity.  | None           |
| `/api/profile`                     | `GET`  | Retrieves the authenticated user's profile.                | Token Required |
| `/api/profile`                     | `PUT`  | Updates the authenticated user's profile.                  | Token Required |
| `/api/profile`                     | `DELETE` | Deletes the authenticated user's account.                  | Token Required |
| `/api/auth/login`                  | `POST` | Authenticates a user and returns a JWT token.              | None           |
| `/api/auth/register`               | `POST` | Registers a new user.                                      | None           |
| `/api/auth/reset-password`         | `POST` | Initiates a password reset process.                        | None           |

## Code Structure

-   **`app.py`**: The main Flask application file. It defines all the routes, handles API requests, and integrates various functionalities like code shortening, analysis, and authentication.
-   **`database_setup.py`**: A script for setting up the PostgreSQL database, including creating the database and user roles.
-   **`pyrightconfig.json`**: Configuration file for Pyright, a static type checker for Python.
-   **`requirements.txt`**: Lists all the Python dependencies required for the backend.
-   **`support.py`**: Contains SQLAlchemy database instance, the `User` model definition, and the `init_db` function for database initialization.

## Key Logic and Features

-   **Code Minification (`minify_python`, `shorten_code`)**: Functions to reduce the size of code by removing comments, docstrings, and extra whitespace. Supports Python and other languages via regex-based stripping.
-   **Language Detection (`detect_language_simple`)**: A simple utility to identify the programming language of a given code snippet.
-   **Code Analysis (`calculate_stats`, `calculate_complexity`, `analyze_code_structure`, `analyze_python_functions`, `estimate_runtime_diff`)**: Provides various metrics and insights into code, including character/line savings, complexity scores (cyclomatic, maintainability), and estimated runtime differences.
-   **Code Transformation/Upgrade (`upgrade_code`, `refactor_identifiers`, `add_type_annotations`, `format_code`, `generate_docstrings_via_openai`, `modernize_syntax`)**: Endpoints and functions that allow for automated code improvements such as refactoring, type annotation addition, formatting (using `black`), docstring generation (using OpenAI), and Python 2 to 3 syntax modernization.
-   **Zip File Processing (`process_zip_file`)**: Handles the ingestion and processing of `.zip` archives containing multiple code files, applying shortening and analysis to each.
-   **User Authentication and Authorization (`login`, `register`, `profile`, `token_required`, `reset_password`)**: Implements user registration, login with JWT token generation, profile management (GET, PUT, DELETE), password reset functionality, and a `token_required` decorator for protected routes.