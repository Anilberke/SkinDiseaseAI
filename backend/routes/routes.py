import sys
sys.path.insert(0, '../')

from fastapi import FastAPI, HTTPException, Header, File, UploadFile, Form
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from backend.service import (get_response,
                             load_chat_history,
                             save_chat_history,
                             generate_chat_history_file,
                             get_chat_history_files,
                             delete_chat_history,
                             get_db, get_user_email_from_token)


load_dotenv()
openai_api_key = os.getenv("OPENAI__API_KEY")
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or "*" for all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class User(BaseModel):
    openai_api_key: str


class Query(BaseModel):
    question: str


class ChatHistory(BaseModel):
    chat_history_file: str

class ChatTitleUpdate(BaseModel):
    chat_history_id: str
    chat_title: str


openai_api_key = None
pinecone_index_number = None
namespaceStr = None
chat_history_files = []


#OK
@app.post("/set_pinecone_index")
async def set_pinecone_index_number(index_number: int, namespace: str):
    """
    This endpoint is responsible for setting the Pinecone index number dynamically.
    It takes in the Pinecone index number as a query parameter.
    """
    global pinecone_index_number
    global namespaceStr
    pinecone_index_number = index_number
    namespaceStr = namespace
    return {"message": f"Pinecone index number set to {pinecone_index_number} and namespace set to {namespaceStr}"}

#OK
@app.get("/get_chat_history_files")
async def get_chat_history_files_endpoint(token: str):
    """
    This endpoint is responsible for getting the chat history files.
    It takes in the user's token as a query parameter and returns the chat history files associated with that token.
    """
    user_email = get_user_email_from_token(token)
    return {"chat_history_files": get_chat_history_files(user_email)}

#OK
@app.post("/create_new_chat")
async def create_new_chat(token: str):
    """
    This endpoint is responsible for creating a new chat history file.
    It takes in the user's token as a query parameter and returns the newly created chat history file.
    """
    print("Creating new chat")
    user_email = get_user_email_from_token(token)
    chat_history_file = generate_chat_history_file(user_email)
    chat_history_files.append(chat_history_file["_id"])
    chat_history = []
    save_chat_history(chat_history, chat_history_file["_id"], chat_history_file["chat_title"])
    return {"message": "New chat created successfully", "chat_title": chat_history_file["chat_title"]}

#OK
@app.post("/select_chat_history")
async def select_chat_history(chat_history_id: str):
    """
    This endpoint is responsible for selecting a chat history file.
    It takes in the chat history ID as a query parameter and returns the selected chat history.
    """
    global chat_history_file
    chat_history_file = chat_history_id
    chat_history_content = load_chat_history(chat_history_file)
    print(chat_history_content)
    return {"chat_history": chat_history_content["chat_history"], "chat_title": chat_history_content["chat_title"]}

#OK
@app.post("/get_response")
async def handle_get_response(question: str = Form(...),
                              authorization: str = Header(None),
                              file: UploadFile = File(None)):
    if not authorization:
        raise HTTPException(status_code=400, detail="Authorization header missing")

    token = authorization.split(" ")[1]
    global chat_history_file
    chat_history = load_chat_history(chat_history_file)

    image = await file.read() if file else None
    response = get_response(question,
                            chat_history["chat_history"],
                            pinecone_index_number,
                            namespaceStr,
                            token, image)

    save_chat_history(response.get("chat_history", chat_history["chat_history"]), chat_history_file,
                      chat_history["chat_title"])
    return response

@app.post("/qa_response")
async def handle_qa_response(question: str = Form(...),
                             authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=400, detail="Authorization header missing")

    token = authorization.split(" ")[1]
    global chat_history_file
    chat_history = load_chat_history(chat_history_file)

    if not pinecone_index_number or not namespaceStr:
        raise HTTPException(status_code=400, detail="Pinecone index number and namespace must be set")

    response = get_response(question, chat_history["chat_history"], pinecone_index_number, namespaceStr, token)
    save_chat_history(response.get("chat_history", chat_history["chat_history"]),
                      chat_history_file,
                      chat_history["chat_title"])
    return response

@app.post("/image_response")
async def handle_image_response(question: str = Form(...),
                                authorization: str = Header(None),
                                file: UploadFile = File(...)):
    if not authorization:
        raise HTTPException(status_code=400, detail="Authorization header missing")

    token = authorization.split(" ")[1]
    global chat_history_file
    chat_history = load_chat_history(chat_history_file)

    image = await file.read()
    response = get_response(question,
                            chat_history["chat_history"],
                            None,
                            None,
                            token,
                            image)
    save_chat_history(response.get("chat_history", chat_history["chat_history"]),
                      chat_history_file,
                      chat_history["chat_title"])
    return response

#OK
@app.delete("/delete_chat_history/{chat_history_id}")
async def delete_chat_history_endpoint(chat_history_id: str):
    """
    This endpoint is responsible for deleting a chat history from MongoDB.
    It takes in the chat history ID as a path parameter and deletes the corresponding chat history.
    """
    try:
        delete_chat_history(chat_history_id)
        global chat_history_files
        chat_history_files = [file for file in chat_history_files if file != chat_history_id]
        return {"message": "Chat history deleted successfully"}
    except HTTPException as e:
        return e.detail

#OK
@app.post("/update_chat_title")
async def update_chat_title(chat_title_update: ChatTitleUpdate):
    """
    This endpoint is responsible for updating the chat title of a chat history.
    It takes in the chat history ID and the new chat title as a request body.
    """
    db = get_db()
    chat_histories = db["chat_histories"]
    chat_histories.update_one({"_id": chat_title_update.chat_history_id}, {"$set": {"chat_title": chat_title_update.chat_title}}, upsert=True)
    updated_chat_history = chat_histories.find_one({"_id": chat_title_update.chat_history_id})

    return {
        "message": "Chat title updated successfully",
        "chat_title": updated_chat_history.get("chat_title")  # Return the updated chat title
    }
