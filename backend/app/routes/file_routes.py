from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from typing import List
import pypdf
import docx
import io
from bson import ObjectId

from app.auth import get_current_user
from app.database import get_db
from app.vector_store import vector_store

router = APIRouter(prefix="/api/files", tags=["Files"])


async def extract_text_from_file(file: UploadFile) -> str:
    content = await file.read()

    if file.filename.endswith(".pdf"):
        pdf_reader = pypdf.PdfReader(io.BytesIO(content))
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text()
        return text

    elif file.filename.endswith(".docx"):
        doc = docx.Document(io.BytesIO(content))
        text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
        return text

    elif file.filename.endswith(".txt"):
        return content.decode("utf-8")

    else:
        raise HTTPException(status_code=400, detail="Unsupported file type")


@router.post("/upload/{session_id}")
async def upload_file(
    session_id: str,
    file: UploadFile = File(...),
    current_user=Depends(get_current_user),
    db=Depends(get_db),
):
    session = await db.chat_sessions.find_one({"_id": ObjectId(session_id)})
    if not session or session["user_id"] != str(current_user["_id"]):
        raise HTTPException(status_code=404, detail="Session not found")

    try:
        text_content = await extract_text_from_file(file)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process file: {str(e)}")

    file_doc = {
        "session_id": session_id,
        "filename": file.filename,
        "file_type": file.content_type,
        "file_size": len(text_content),
        "content_text": text_content,
        "vectorized": False,
    }

    result = await db.files.insert_one(file_doc)

    await vector_store.add_documents(
        session_id,
        [text_content],
        [{"filename": file.filename, "file_id": str(result.inserted_id)}],
    )

    await db.files.update_one(
        {"_id": result.inserted_id}, {"$set": {"vectorized": True}}
    )

    return {
        "file_id": str(result.inserted_id),
        "filename": file.filename,
        "message": "File uploaded and vectorized successfully",
    }


@router.get("/{session_id}")
async def get_files(
    session_id: str, current_user=Depends(get_current_user), db=Depends(get_db)
):
    session = await db.chat_sessions.find_one({"_id": ObjectId(session_id)})
    if not session or session["user_id"] != str(current_user["_id"]):
        raise HTTPException(status_code=404, detail="Session not found")

    files = await db.files.find({"session_id": session_id}).to_list(100)
    return [
        {
            "id": str(f["_id"]),
            "filename": f["filename"],
            "file_type": f["file_type"],
            "file_size": f["file_size"],
            "uploaded_at": f["uploaded_at"].isoformat(),
            "vectorized": f["vectorized"],
        }
        for f in files
    ]