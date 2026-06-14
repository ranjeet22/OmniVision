import os
import uuid
from pathlib import Path
from threading import Lock

from dotenv import load_dotenv
from flask import Flask, jsonify, request, send_from_directory
from werkzeug.utils import secure_filename

from core.pipeline import analyze_source, ask_session_question

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIST_DIR = BASE_DIR / "frontend" / "dist"
UPLOAD_DIR = BASE_DIR / "downloads" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

app = Flask(__name__, static_folder=str(FRONTEND_DIST_DIR), static_url_path="")

_session_lock = Lock()
_sessions = {}


def _build_error(message: str, status_code: int = 400):
    return jsonify({"error": message}), status_code


def _normalize_source() -> tuple[str | None, str | None]:
    source_type = request.form.get("sourceType", "").strip().lower()

    if source_type == "youtube":
        youtube_url = request.form.get("youtubeUrl", "").strip()
        if not youtube_url:
            return None, "Please provide a YouTube URL."
        return youtube_url, None

    if source_type == "upload":
        file = request.files.get("file")
        if not file or not file.filename:
            return None, "Please upload a video or audio file."

        filename = secure_filename(file.filename)
        unique_path = UPLOAD_DIR / f"{uuid.uuid4().hex}_{filename}"
        file.save(unique_path)
        return str(unique_path), None

    return None, "Invalid source type. Use 'upload' or 'youtube'."


@app.get("/api/health")
def health_check():
    return jsonify({"status": "ok"})


@app.post("/api/analyze")
def analyze_video():
    language = request.form.get("language", "english").strip().lower() or "english"
    if language not in {"english", "hinglish"}:
        return _build_error("Language must be 'english' or 'hinglish'.")

    source, error = _normalize_source()
    if error:
        return _build_error(error)

    session_id = uuid.uuid4().hex

    try:
        result = analyze_source(source=source, language=language, session_id=session_id)
    except Exception as exc:
        return _build_error(str(exc), status_code=500)

    with _session_lock:
        _sessions[session_id] = result["rag_chain"]

    return jsonify(
        {
            "sessionId": session_id,
            "title": result["title"],
            "transcript": result["transcript"],
            "summary": result["summary"],
            "actionItems": result["action_items"],
            "keyDecisions": result["key_decisions"],
            "openQuestions": result["open_questions"],
            "metadata": result["metadata"],
        }
    )


@app.post("/api/ask")
def ask_video_question():
    payload = request.get_json(silent=True) or {}
    session_id = str(payload.get("sessionId", "")).strip()
    question = str(payload.get("question", "")).strip()

    if not session_id:
        return _build_error("sessionId is required.")
    if not question:
        return _build_error("question is required.")

    with _session_lock:
        rag_chain = _sessions.get(session_id)

    if rag_chain is None:
        return _build_error("Session not found. Please analyze a video first.", status_code=404)

    try:
        answer = ask_session_question(rag_chain, question)
    except Exception as exc:
        return _build_error(str(exc), status_code=500)

    return jsonify({"answer": answer})


@app.get("/")
def serve_frontend():
    if FRONTEND_DIST_DIR.exists() and (FRONTEND_DIST_DIR / "index.html").exists():
        return send_from_directory(FRONTEND_DIST_DIR, "index.html")
    return (
        "Frontend build not found. Run `npm install` and `npm run build` inside the `frontend` folder.",
        200,
    )


@app.get("/<path:path>")
def serve_static(path: str):
    target_path = FRONTEND_DIST_DIR / path
    if target_path.exists():
        return send_from_directory(FRONTEND_DIST_DIR, path)
    if FRONTEND_DIST_DIR.exists() and (FRONTEND_DIST_DIR / "index.html").exists():
        return send_from_directory(FRONTEND_DIST_DIR, "index.html")
    return ("Not found", 404)


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
