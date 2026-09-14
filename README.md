# QuickDroid — APK Security Scanner

Static security analysis engine for Android applications with manifest parsing, jadx decompilation, code extraction, and OWASP Mobile Top 10 rule detection.

## Prerequisites
- Python 3.10+
- Java Runtime Environment (JRE/JDK 11+ for jadx)
- Node.js 18+ & npm

## 1. Setup jadx Decompiler (One-Time)
Run the automated setup script to download and extract portable `jadx 1.5.6` into `tools/jadx/` without requiring a system-wide PATH installation:

- **Windows (PowerShell):**
  ```powershell
  .\setup_jadx.ps1
  ```
- **Linux / macOS:**
  ```bash
  chmod +x setup_jadx.sh
  ./setup_jadx.sh
  ```

## 2. Backend Setup & Run
Install Python dependencies and start the FastAPI engine:
```powershell
pip install -r backend/requirements.txt
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
```
- API Docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/api/health`

## 3. Frontend Setup & Run
```powershell
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

## 4. Run Automated Test Suite
Run the test suite verifying manifest extraction, jadx decompilation, and code extraction across both fixtures:
```powershell
python -m pytest backend/tests/ -v
```