# My Code Shortener

A full-stack web app to shorten and analyze code, with optional sensitive-data masking and a polished UI. The app consists of a Flask backend and a React (Chakra UI) frontend.

## Features
- Code shortening with adjustable compression level
- Copy shortened code to clipboard
- Syntax highlighting for original code view
- Sensitive data masking for single files or ZIP archives (download processed ZIP)
- Authentication (register/login) using JWT
- Global video background with dark overlay; all cards/nav are translucent and blurred for readability

## Tech Stack
- Frontend: React 18, Chakra UI, React Router v7, Framer Motion, react-icons, react-syntax-highlighter, CRA (react-scripts)
- Backend: Flask 3, Flask-SQLAlchemy, Flask-CORS, PyJWT, python-dotenv, OpenAI client (optional), Pygments

## Repository Structure
```
My-Code-Shortener/
  Backend/
    app.py
    requirements.txt
    README.md
  Frontend/
    package.json
    src/
      App.js
      index.js
      setupProxy.js
      components/
        Layout.jsx
      pages/
        Home.jsx
        Login.jsx
        Register.jsx
      assets/
        videos/
          cSHORT.mp4
```

## Prerequisites
- Node.js (v18+ recommended) and npm
- Python 3.10+ and pip

## Setup and Run (Development)
### 1) Backend (Flask)
Windows PowerShell/cmd:
```
cd Backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
flask run
```
macOS/Linux:
```
cd Backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
flask run
```
Backend runs at http://127.0.0.1:5000 by default.

Environment variables (recommended):
- SECRET_KEY: secret used to sign JWTs (auto-generated at runtime if unset; set persistently in production)
- DATABASE_URL or SQLALCHEMY_DATABASE_URI: database connection (defaults to SQLite sqlite:///app.db)

### 2) Frontend (React)
Windows PowerShell/cmd:
```
cd Frontend
npm install
npm start
```
macOS/Linux:
```
cd Frontend
npm install
npm start
```
Frontend runs at http://localhost:3000 and proxies API requests to the backend via src/setupProxy.js during development.

## Usage
1. Visit http://localhost:3000
2. Register or log in
3. Paste code, adjust compression, and click "Shorten Code"
4. Copy short code; expand to view original code with highlighting
5. For masking, upload a file or ZIP, wait for processing, then download the masked ZIP

## Background Video
- Configured globally in Frontend/src/components/Layout.jsx and imported from Frontend/src/assets/videos/cSHORT.mp4
- Dark overlay ensures text contrast; navbar and content cards use translucent backgrounds with blur
- To change the background, replace cSHORT.mp4 and restart the dev server

## Selected API Endpoints
- POST /api/shorten: shorten a provided code snippet
- POST /api/auth/login: login, returns JWT
- POST /api/auth/register: create a new account
- POST /api/mask/upload: upload file/zip for masking
- GET  /api/mask/status/{job_id}: polling status
- GET  /api/mask/download/{job_id}: download masked ZIP

## Build (Frontend)
```
cd Frontend
npm run build
```
Outputs to Frontend/build.

## Troubleshooting
- "Module not found: react-icons/fi": run npm install inside the Frontend directory
- "npm start" ENOENT at project root: run from Frontend (cd Frontend && npm start)
- Backend secret not set: set SECRET_KEY in the environment for persistent sessions in production

## Publish to GitHub
Run these from the repository root:
```
git add README.md
git commit -m "docs: add project README"
git push origin main
```
If this is a new repository, initialize and set remote first:
```
git init
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git add .
git commit -m "chore: initial commit"
git push -u origin main
```

## License
Add your preferred license here (e.g., MIT)
