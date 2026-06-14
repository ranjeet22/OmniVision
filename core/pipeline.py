from core.extractor import extract_action_items, extract_key_decisions, extract_questions
from core.rag_engine import ask_question, build_rag_chain
from core.summarizer import generate_title, summarize
from core.transcriber import transcribe_all
from utils.audio_processor import process_input


def analyze_source(source: str, language: str = "english", session_id: str | None = None) -> dict:
    chunks = process_input(source)
    transcript = transcribe_all(chunks, language)

    title = generate_title(transcript)
    summary = summarize(transcript)
    action_items = extract_action_items(transcript)
    key_decisions = extract_key_decisions(transcript)
    open_questions = extract_questions(transcript)
    rag_chain = build_rag_chain(transcript, collection_name=session_id)

    return {
        "title": title,
        "transcript": transcript,
        "summary": summary,
        "action_items": action_items,
        "key_decisions": key_decisions,
        "open_questions": open_questions,
        "rag_chain": rag_chain,
        "metadata": {
            "chunksProcessed": len(chunks),
            "language": language,
            "source": source,
        },
    }


def ask_session_question(rag_chain, question: str) -> str:
    return ask_question(rag_chain, question)
