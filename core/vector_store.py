import os 
from langchain_chroma import Chroma 
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

CHROMA_DIR = "vector_db"
COLLECTION_NAME = "meeting_transcript"
EMBEDDING_MODEL  = "all-MiniLM-L6-v2"

def get_embeddings():
    return HuggingFaceEmbeddings(
        model_name = EMBEDDING_MODEL,
        model_kwargs = {"device" : 'cpu'}
    )

def _resolve_collection_name(collection_name: str | None = None) -> str:
    return collection_name or COLLECTION_NAME


def build_vector_store(transcript : str, collection_name: str | None = None)->Chroma:
    print("Building vector Store")
    resolved_collection_name = _resolve_collection_name(collection_name)

    splitter = RecursiveCharacterTextSplitter(
        chunk_size = 500,
        chunk_overlap = 50
    )
    chunks = splitter.split_text(transcript)

    docs = [
        Document(page_content=chunk, metadata = {'chunk_index' : i})
        for i,chunk in enumerate(chunks)
    ]

    embeddings = get_embeddings()
    vector_store = Chroma.from_documents(
        documents= docs,
        embedding=embeddings,
        collection_name=resolved_collection_name,
        persist_directory=CHROMA_DIR
    )

    return vector_store



def load_vector_store(collection_name: str | None = None) ->Chroma:
    embeddings = get_embeddings()
    resolved_collection_name = _resolve_collection_name(collection_name)
    vector_store = Chroma(
        collection_name=resolved_collection_name,
        embedding_function= embeddings,
        persist_directory=CHROMA_DIR
    )

    return vector_store

def get_retriever(vector_store : Chroma, k :int = 4):
    return vector_store.as_retriever(
        search_type = 'similarity',
        search_kwargs = {"k":k}
    )

