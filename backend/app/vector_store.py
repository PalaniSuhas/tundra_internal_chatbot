import os
import pickle
from typing import List, Dict
import faiss
import numpy as np
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from app.config import settings


class VectorStore:
    def __init__(self):
        self.embeddings = OpenAIEmbeddings(
            model=settings.EMBEDDING_MODEL,
            openai_api_key=settings.OPENAI_API_KEY
        )
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.CHUNK_SIZE,
            chunk_overlap=settings.CHUNK_OVERLAP
        )
        self.indexes: Dict[str, faiss.IndexFlatL2] = {}
        self.documents: Dict[str, List[Dict]] = {}
        
        os.makedirs(settings.FAISS_INDEX_PATH, exist_ok=True)
    
    async def add_documents(self, session_id: str, texts: List[str], metadatas: List[Dict]):
        chunks = []
        chunk_metadatas = []
        
        for text, metadata in zip(texts, metadatas):
            text_chunks = self.text_splitter.split_text(text)
            chunks.extend(text_chunks)
            chunk_metadatas.extend([metadata] * len(text_chunks))
        
        embeddings = await self.embeddings.aembed_documents(chunks)
        embeddings_np = np.array(embeddings).astype('float32')
        
        if session_id not in self.indexes:
            dimension = embeddings_np.shape[1]
            self.indexes[session_id] = faiss.IndexFlatL2(dimension)
            self.documents[session_id] = []
        
        self.indexes[session_id].add(embeddings_np)
        
        for chunk, metadata in zip(chunks, chunk_metadatas):
            self.documents[session_id].append({
                "content": chunk,
                "metadata": metadata
            })
        
        self._save_index(session_id)
    
    async def similarity_search(self, session_id: str, query: str, k: int = 4) -> List[Dict]:
        if session_id not in self.indexes:
            return []
        
        query_embedding = await self.embeddings.aembed_query(query)
        query_embedding_np = np.array([query_embedding]).astype('float32')
        
        distances, indices = self.indexes[session_id].search(query_embedding_np, k)
        
        results = []
        for idx in indices[0]:
            if idx < len(self.documents[session_id]):
                results.append(self.documents[session_id][idx])
        
        return results
    
    def _save_index(self, session_id: str):
        index_path = os.path.join(settings.FAISS_INDEX_PATH, f"{session_id}.index")
        docs_path = os.path.join(settings.FAISS_INDEX_PATH, f"{session_id}.pkl")
        
        faiss.write_index(self.indexes[session_id], index_path)
        
        with open(docs_path, 'wb') as f:
            pickle.dump(self.documents[session_id], f)
    
    def load_index(self, session_id: str):
        index_path = os.path.join(settings.FAISS_INDEX_PATH, f"{session_id}.index")
        docs_path = os.path.join(settings.FAISS_INDEX_PATH, f"{session_id}.pkl")
        
        if os.path.exists(index_path) and os.path.exists(docs_path):
            self.indexes[session_id] = faiss.read_index(index_path)
            
            with open(docs_path, 'rb') as f:
                self.documents[session_id] = pickle.load(f)
            
            return True
        return False


vector_store = VectorStore()