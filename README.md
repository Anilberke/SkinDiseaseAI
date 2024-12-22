# Proffesor X

## Overview
This project is a web application that integrates various technologies to provide a
smart assistant for dermatology-related queries. The application uses a combination of Java,
Spring Boot, Python, FastAPI, and JavaScript to deliver a seamless user experience. 
The backend is powered by MongoDB and Pinecone for data storage and retrieval, 
while the frontend is built using HTML, CSS, and JavaScript.

## Technologies Used
- **_Java_**: For backend services using Spring Boot.
- **_Spring Boot_**: For creating RESTful APIs.
- **_Python_**: For additional backend services using FastAPI.
- **_FastAPI_**: For creating fast and efficient APIs.
- **_JavaScript_**: For frontend interactivity.
- **_MongoDB_**: For database storage.
- **_Pinecone_**: For vector-based data retrieval.
- **_JWT_**: For authentication and authorization.
- **_Docker_**: For containerization.

## Project Structure

### Backend
- **Java Spring Boot:**
The backend of this project is built using Java and Spring Boot. It handles user authentication, user management, and JWT-based security. Below is a detailed description of the key components and their functionalities:

    - **_Controllers_**: These classes handle incoming HTTP requests and return responses. They are responsible for routing requests to the appropriate service classes.
    - **_Services_**: These classes contain the business logic of the application. They interact with the database and perform operations based on the user's requests.
    - **_Models_**: These classes define the structure of the data stored in the database. They are used to map the data between the application and the database.
    - **_Repositories_**: These classes interact with the MySQL database to perform CRUD operations.
    - **_Security_**: This package contains classes that handle user authentication and authorization using JWT tokens.
  
- **Python - RAG Model:**
    The Python service for the Retrieval-Augmented Generation (RAG) system is built using FastAPI and integrates several key components to handle functionalities such as chat history management, image classification, and vector-based data retrieval using Pinecone. The service starts by setting up the environment and loading necessary configurations from environment variables. It connects to MongoDB using pymongo for storing and retrieving chat histories. Pinecone is initialized for vector-based data retrieval, ensuring the index is properly configured. For image classification, pre-trained models from transformers and torch are loaded to classify images and return predicted labels. The service includes CRUD operations for managing chat histories in MongoDB, and it uses langchain to create a Conversational Retrieval Chain for handling user queries. The FastAPI application defines endpoints to manage chat histories and handle user queries, integrating with MongoDB for data storage and Pinecone for vector-based retrieval. The service also includes functions to classify images, generate embeddings, and upsert documents into Pinecone, ensuring efficient and accurate data retrieval for user queries.


- **Academic Articles Processing with Huawei Cloud:**
The project includes a component that retrieves academic articles from the CORE API, processes them using Huawei Cloud technologies like FunctionGraph, and stores the articles on OBS (Object Storage Service). Below is a detailed description of the key functionalities and their implementations:
  - CORE API Integration: The code interacts with the CORE API to search for academic articles based on a query and retrieve metadata for specific articles.
  - OBS Integration: The code uses the Huawei Cloud OBS client to upload downloaded PDF articles to an OBS bucket.
  - FunctionGraph: The code is designed to be executed as a FunctionGraph function, enabling serverless processing of academic articles.

### Frontend
The frontend of this project is built using HTML, CSS, and JavaScript. 
It provides a user-friendly interface for interacting with the smart assistant.
Users can input their queries, upload images, and receive responses from the system.
Also they can use their camera to take a picture and upload it to the system.

## How to Run
This step-by-step guide will help you run the project on your local machine:\
**Note**! Make sure you have Docker installed on your machine.\
After making sure Docker is up and running, follow these steps:\
* Go to the project directory and run the following command:
```docker compose up```
* This docker compose file will build and run the python and client services.
* The client service will be available at http://localhost:8080/ictui/client/home.html
* Then you need to run the Java Spring Boot service.
* Go to the Java Spring Boot directory and run the following command:
```mvn clean install``` this command will build the project.
* After build success run the following command:
```docker compose up``` this command will run both MySQL and Spring Boot services.\
IMPORTANT: If spring boot service down, try to rerun the spring boot container. Because sometimes 
MySQL container starts before the spring boot container and the spring boot container can't connect to the MySQL container.

## Contributors
Kaan Yavuz - https://github.com/kaanyvz \
Anıl Berke Arslantaş - https://github.com/Anilberke

