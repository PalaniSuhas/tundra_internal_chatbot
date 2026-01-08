from typing import List, Dict, AsyncGenerator
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from app.config import settings
from app.vector_store import vector_store


class RAGEngine:
    def __init__(self):
        self.llm = ChatOpenAI(
            model=settings.OPENAI_MODEL,
            openai_api_key=settings.OPENAI_API_KEY,
            temperature=0.7,
            streaming=True
        )
        
        self.system_prompt = """You are an advanced AI assistant designed for a professional, production-grade conversational application. Your primary responsibility is to provide accurate, context-aware, structured, and helpful responses while strictly respecting session boundaries and conversation isolation.

Core Principles:
- Each chat session is completely independent
- Maintain full awareness of the current chat's message history
- Never reference information from other chats
- Be clear, concise, and professional
- Use structured formatting when appropriate (headings, bullet points, code blocks)
- Avoid unnecessary emojis or casual tone unless requested
- Prefer correctness over speed
- If uncertain, state it clearly

When context from uploaded files is provided:
- Treat uploaded files as authoritative for that chat
- Acknowledge file usage explicitly
- Reason across multiple files when present

Your responses are streamed token-by-token, so structure answers with core information first, followed by details."""
    
    async def generate_response(
        self,
        query: str,
        session_id: str,
        chat_history: List[Dict],
        use_rag: bool = True
    ) -> AsyncGenerator[str, None]:
        
        context_docs = []
        if use_rag:
            context_docs = await vector_store.similarity_search(session_id, query, k=4)
        
        messages = [SystemMessage(content=self.system_prompt)]
        
        for msg in chat_history[-10:]:
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["content"]))
            else:
                messages.append(AIMessage(content=msg["content"]))
        
        user_message_content = query
        if context_docs:
            context_text = "\n\n".join([
                f"Document: {doc['metadata'].get('filename', 'Unknown')}\n{doc['content']}"
                for doc in context_docs
            ])
            user_message_content = f"""Based on the following context from uploaded files:

{context_text}

User Question: {query}"""
        
        messages.append(HumanMessage(content=user_message_content))
        
        async for chunk in self.llm.astream(messages):
            if chunk.content:
                yield chunk.content
    
    async def generate_chat_title(self, first_message: str) -> str:
        prompt = f"Generate a concise 3-5 word title for a chat that starts with: '{first_message[:100]}'. Return only the title, no quotes or extra text."
        
        messages = [HumanMessage(content=prompt)]
        response = await self.llm.ainvoke(messages)
        
        return response.content.strip()


rag_engine = RAGEngine()