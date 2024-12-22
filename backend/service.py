from dotenv import load_dotenv
from typing import Dict, Optional
from pymongo import MongoClient
from pinecone import Pinecone
from langchain_community.vectorstores.pinecone import Pinecone as LangChainPinecone
from langchain_openai.embeddings import OpenAIEmbeddings
from langchain_openai.llms import OpenAI
from langchain.memory import ConversationBufferMemory
from langchain.chains import ConversationalRetrievalChain
from datetime import datetime, timezone
from fastapi import HTTPException
from transformers import AutoModelForImageClassification, ConvNextFeatureExtractor
from PIL import Image, ImageOps
import torch.nn.functional as F
from backend.apig_sdk import signer
import torch
import io
import uuid
import time
import streamlit as st
import os
import math
import requests
import jwt

load_dotenv()
openai_api_key = os.getenv("OPENAI__API_KEY")

load_dotenv()

INDEX_NAME_TEMPLATE = "<index-template>"
CHAT_HISTORY_FILE_TEMPLATE = "<filetemplate>"

NUM_RETRIEVED_DOCS = 5
TEMPERATURE = 0.3
CONVERSATION_MEMORY_SIZE = 5

diseases = [
    "Basal Cell Carcinoma", "Darier_s Disease", "Epidermolysis Bullosa Pruriginosa", "Hailey-Hailey Disease",
    "Herpes Simplex", "Impetigo", "Larva Migrans", "Leprosy Borderline", "Leprosy Lepromatous", "Leprosy Tuberculoid",
    "Lichen Planus", "Lupus Erythematosus Chronicus Discoides", "Melanoma", "Molluscum Contagiosum",
    "Mycosis Fungoides", "Neurofibromatosis", "Papilomatosis Confluentes And Reticulate", "Pediculosis Capitis", "Pityriasis Rosea",
    "Porokeratosis Actinic", "Psoriasis", "Tinea Corporis", "Tinea Nigra", "Tungiasis", "actinic keratosis",
    "dermatofibroma", "nevus", "pigmented benign keratosis", "seborrheic keratosis", "squamous cell carcinoma",
    "vascular lesion", "Vitiligo"
]

num_parts = 5
part_size = math.ceil(len(diseases) / num_parts)
disease_parts = [diseases[i:i + part_size] for i in range(0, len(diseases), part_size)]
namespaces = [disease.replace(" ", "_") for disease in diseases]

openai_api_key = None
pinecone_index_name = None
namespace = None
chat_history_files = []


def get_user_email_from_token(token: str) -> str:
    decoded_token = jwt.decode(token, options={"verify_signature": False})
    return decoded_token["sub"]


def get_db():
    uri = "<mongouri>"
    client = MongoClient(uri)
    db = client["<appname>"]
    return db


def generate_chat_history_file(user_email: str) -> dict[str, str]:
    print("Generating chat history file")
    db = get_db()
    chat_histories = db["chat_histories"]

    existing_files_count = chat_histories.count_documents({"_id": {"$regex": f"^chat_history_{user_email}"}})
    print(f"Existing chat history files for {user_email}: {existing_files_count}")

    uuid_str = str(uuid.uuid4())
    chat_title = f"Chat History {existing_files_count + 1}"

    return {"_id": CHAT_HISTORY_FILE_TEMPLATE.format(user_email, uuid_str), "chat_title": chat_title}


def load_chat_history(chat_history_id):
    db = get_db()
    chat_histories = db["chat_histories"]
    chat_history = chat_histories.find_one({"_id": chat_history_id})
    return {"chat_history": chat_history["chat_history"], "chat_title": chat_history["chat_title"]}


def save_chat_history(chat_history, chat_history_id, chat_title):
    db = get_db()
    chat_histories = db["chat_histories"]
    chat_histories.update_one({"_id": chat_history_id},
                              {"$set": {"chat_history": chat_history, "chat_title": chat_title}}, upsert=True)


def get_chat_history_files(user_email: str) -> list[dict]:
    db = get_db()
    chat_histories = db["chat_histories"]
    chat_history_files = [
        {"_id": chat_history["_id"], "chat_title": chat_history["chat_title"]}
        for chat_history in chat_histories.find({"_id": {"$regex": f"^chat_history_{user_email}"}})
    ]
    return chat_history_files


def delete_chat_history(chat_history_id: str):
    db = get_db()
    chat_histories = db["chat_histories"]
    result = chat_histories.delete_one({"_id": chat_history_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Chat history not found")
    else:
        return {"message": "Chat history deleted successfully"}


def get_user_info(token: str) -> dict:
    decoded_token = jwt.decode(token, options={"verify_signature": False})
    user_email = decoded_token["sub"]
    user_info_response = requests.get(f"http://localhost:8090/v1/api/user/getUser/{user_email}",
                                      headers={"Authorization": f"Bearer {token}"})
    return user_info_response.json()


def calculate_age(birth_date_str: str) -> int:
    birth_date = datetime.strptime(birth_date_str, "%Y-%m-%dT%H:%M:%S.%f%z")
    current_time = datetime.now(timezone.utc)
    return (current_time - birth_date).days

def preprocess_image(image: bytes) -> Image:
    image = Image.open(io.BytesIO(image)).convert("RGB")
    image = ImageOps.exif_transpose(image)  # Correct orientation
    image = ImageOps.fit(image, (224, 224))  # Resize to model's expected input size
    return image

def send_image_for_prediction(image_file, ak, sk, endpoint):
    method = 'POST'
    headers = {"x-sdk-content-sha256": "UNSIGNED-PAYLOAD"}
    request = signer.HttpRequest(method, endpoint, headers)

    sig = signer.Signer()
    sig.Key = ak
    sig.Secret = sk
    sig.Sign(request)


    files = {'image': image_file}
    response = requests.request(request.method, request.scheme + "://" + request.host + request.uri, headers=request.headers, files=files)

    if response.status_code == 200:
        return response.json()
    else:
        return {"error": response.text}

def classify_image(image: bytes) -> str:
    ak = "<ak>"
    sk = "<sk>"
    endpoint = "<endpoint>"

    # Call the send_image_for_prediction function
    image_file = io.BytesIO(image)
    result = send_image_for_prediction(image_file, ak, sk, endpoint)

    # Check the confidence and return the prediction
    confidence_threshold = 0.7
    if result.get("confidence", 0) < confidence_threshold:
        return "Please take another photo, it's not looking like a disease with this version."

    return result.get("prediction", "Unknown")


def initialize_pinecone_client(index_number: str) -> LangChainPinecone:
    index_name = INDEX_NAME_TEMPLATE.format(index_number)
    pc_client = Pinecone(api_key=st.secrets["pinecone_api_key"])
    embedding_model = OpenAIEmbeddings(model="text-embedding-3-large", openai_api_key=openai_api_key)
    index = pc_client.Index(index_name)
    index.describe_index_stats()
    return LangChainPinecone(index=index, embedding=embedding_model, text_key="context")


def create_qa_chain(vectorstore: LangChainPinecone, namespace_str: str) -> ConversationalRetrievalChain:
    llm = OpenAI(temperature=TEMPERATURE, openai_api_key=openai_api_key, max_tokens=1024)
    retriever = vectorstore.as_retriever(search_type="similarity",
                                         search_kwargs={"k": NUM_RETRIEVED_DOCS, "namespace": namespace_str})
    conversation_memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True)
    return ConversationalRetrievalChain.from_llm(llm=llm, retriever=retriever, memory=conversation_memory)


def get_response(user_query: str,
                 chat_history: list,
                 pinecone_index_number: str,
                 namespace_str: str,
                 token: str,
                 image: Optional[bytes] = None) -> Dict[str, Optional[str]]:
    try:

        full_query = f"Give detailed answer about Question: {user_query}\n"

        if image:
            label = classify_image(image)
            if label == "Unknown":
                print("Unknown")
                response = "Please take another photo, it's not looking like a disease with this version."
                chat_history.append((full_query, response))
                return {"result": response, "chat_history": chat_history}
            if label == "Please take another photo, it's not looking like a disease with this version.":
                print("Threshold")
                response = "Please take another photo, it's not looking like a disease with this version."
                chat_history.append((full_query, response))
                return {"result": response, "chat_history": chat_history}

            full_query += f" Disease: {label}"
            print(label)

            # Determine the part and namespace based on the label
            for i, part in enumerate(disease_parts):
                if label in part:
                    pinecone_index_number = str(i + 1)
                    namespace_str = label.replace(" ", "_")
                    print("Namespace: " + namespace_str)
                    print("Pinecone Index Number: " + pinecone_index_number)
                    break

        print("Namespace:" + namespace_str)

        if not pinecone_index_number:
            return {"result": "Pinecone index number is not set", "chat_history": chat_history}

        vectorstore = initialize_pinecone_client(pinecone_index_number)
        qa_chain = create_qa_chain(vectorstore, namespace_str)

        result = qa_chain({'question': full_query, 'chat_history': chat_history})

        response = result['answer']
        chat_history.append((full_query, response))

        return {'result': result, 'chat_history': chat_history}
    except Exception as e:
        print(f"An error occurred: {e}")
        return {"answer": "An error occurred while processing your request. Please try again later.", "sources": None,
                "chat_history": chat_history}
