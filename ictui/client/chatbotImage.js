document.addEventListener("DOMContentLoaded", () => {

    let selectedChatHistory = null;

    const newChatButton = document.getElementById("new-chat-btn");
    const chatHistoryButtons = document.getElementById("chat-history-buttons");
    const chatConversation = document.getElementById('chat-conversation');
    const getResponseButton = document.getElementById("get-response-btn");
    const userQuestionInput = document.getElementById("user-question");
    const attachPhotoButton = document.getElementById("attach-photo-btn")
    const accessCameraBtn = document.getElementById("access-camera-btn")
    const imageNameDisplay = document.getElementById("image-name-display");

    //modals
    const cameraModal = document.getElementById("camera-modal");
    const cameraVideo = document.getElementById("camera-video");
    const captureBtn = document.getElementById("capture-btn");
    const cameraCanvas = document.getElementById("camera-canvas");
    const closeModal = document.querySelector(".close");


    function displayWelcomeMessage() {
        const welcomeMessage = document.createElement("div");
        welcomeMessage.className = "welcome-chat-message";

        const logo = document.createElement("img");
        logo.src = "images/6025105.png";
        logo.alt = "Logo";
        logo.className = "welcome-logo";

        const messageText = document.createElement("div");
        messageText.textContent = "Welcome. To chat with the smart asistant, " +
            "please create a chat history and choose your topic. Have a healthy day!";

        welcomeMessage.appendChild(logo);
        welcomeMessage.appendChild(messageText);
        chatConversation.appendChild(welcomeMessage);
    }

    displayWelcomeMessage();

    newChatButton.addEventListener("click", async () => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            alert("Token not found in local storage.");
            return;
        }

        const response = await fetch(`http://localhost:8000/create_new_chat?token=${token}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (response.ok) {
            const data = await response.json();
            console.log("New chat created:", data);

            const container = document.createElement("div");
            container.className = "chat-history-item";

            const newChatHistoryButton = document.createElement("button");
            newChatHistoryButton.textContent = data.chat_title;
            newChatHistoryButton.className = "chat-history-button";
            newChatHistoryButton.value = data._id;
            newChatHistoryButton.addEventListener("click", () => loadChatHistory(data._id));

            const updateButton = document.createElement("button");
            updateButton.className = "update-button";
            updateButton.innerHTML = '<img src="images/edit.png" alt="Update" class="update-icon">';
            updateButton.addEventListener("click", () => updateChatTitle(data._id));

            const deleteButton = document.createElement("button");
            deleteButton.className = "delete-button";
            deleteButton.innerHTML = '<img src="images/delete.png" alt="Delete" class="delete-icon">';
            deleteButton.addEventListener("click", () => deleteChatHistory(data._id));

            container.appendChild(newChatHistoryButton);
            container.appendChild(updateButton);
            container.appendChild(deleteButton);

            chatHistoryButtons.appendChild(container);
        } else {
            console.error("Failed to create new chat:", response.statusText);
        }
    });

    const fetchChatHistories = async () => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            alert("Token not found in local storage.");
            return;
        }

        const response = await fetch(`http://localhost:8000/get_chat_history_files?token=${token}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (response.ok) {
            const data = await response.json();
            console.log("Chat histories fetched:", data);

            chatHistoryButtons.innerHTML = "";

            data.chat_history_files.forEach(chat => {
                const container = document.createElement("div");
                container.className = "chat-history-item";

                const chatHistoryButton = document.createElement("button");
                chatHistoryButton.textContent = chat.chat_title;
                chatHistoryButton.className = "chat-history-button";
                chatHistoryButton.value = chat._id;
                chatHistoryButton.addEventListener("click", () => loadChatHistory(chat._id));

                const updateButton = document.createElement("button");
                updateButton.className = "update-button";
                updateButton.innerHTML = '<img src="images/edit.png" alt="Update" class="update-icon">';
                updateButton.addEventListener("click", () => updateChatTitle(chat._id));

                const deleteButton = document.createElement("button");
                deleteButton.className = "delete-button";
                deleteButton.innerHTML = '<img src="images/delete.png" alt="Delete" class="delete-icon">';
                deleteButton.addEventListener("click", () => deleteChatHistory(chat._id));

                container.appendChild(chatHistoryButton);
                container.appendChild(updateButton);
                container.appendChild(deleteButton);

                chatHistoryButtons.appendChild(container);
            });
        } else {
            console.error("Failed to fetch chat histories:", response.statusText);
        }
    };

    const loadChatHistory = async (chatHistoryId) => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            alert("Token not found in local storage.");
            return;
        }

        document.getElementById("loading-message").style.display = "block";

        const response = await fetch(`http://localhost:8000/select_chat_history?chat_history_id=${chatHistoryId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (response.ok) {
            const data = await response.json();
            console.log("Chat history details fetched:", data);

            chatConversation.innerHTML = "";

            if (data.chat_history.length === 0) {
                const emptyMessage = document.createElement("div");
                emptyMessage.className = "empty-chat-message";
                emptyMessage.textContent = "You haven't asked anything yet! Type something to start a conversation.";
                chatConversation.appendChild(emptyMessage);
            } else {
                data.chat_history.forEach(item => {
                    const question = item[0].trim();
                    const answer = item[1].trim();

                    appendUserMessage(question);

                    appendBotMessage(answer);
                });
            }

            if (selectedChatHistory) {
                selectedChatHistory.classList.remove("selected-chat-history");
            }
            selectedChatHistory = document.querySelector(`button[value="${chatHistoryId}"]`).parentElement;
            selectedChatHistory.classList.add("selected-chat-history");
        } else {
            console.error("Failed to fetch chat history details:", response.statusText);
        }

        document.getElementById("loading-message").style.display = "none";
    };

    const deleteChatHistory = async (chatHistoryId) => {
        const token = localStorage.getItem("access_token");
        if (!token) {
            alert("Token not found in local storage.");
            return;
        }

        const confirmDelete = confirm("Are you sure you want to delete this chat history?");
        if (!confirmDelete) {
            return; // Exit the function if the user cancels the deletion
        }

        const response = await fetch(`http://localhost:8000/delete_chat_history/${chatHistoryId}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        if (response.ok) {
            console.log("Chat history deleted successfully");
            fetchChatHistories();
        } else {
            console.error("Failed to delete chat history:", response.statusText);
        }
    };

    const updateChatTitle = async (chatHistoryId) => {
        const newTitle = prompt("Enter new title:");
        if (newTitle) {
            const response = await fetch(`http://localhost:8000/update_chat_title`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("access_token")}`
                },
                body: JSON.stringify({
                    chat_history_id: chatHistoryId,
                    chat_title: newTitle
                })
            });

            if (response.ok) {
                console.log("Chat title updated successfully");
                fetchChatHistories();
            } else {
                console.error("Failed to update chat title:", response.statusText);
            }
        }
    };


    function appendUserMessage(message) {
        const userMessage = user_template.replace("{{MSG}}", message);
        chatConversation.insertAdjacentHTML("beforeend", userMessage);
    }

    function appendBotMessage(message) {
        if (typeof message !== "string") {
            console.error("Expected a string message, but got:", message);
            return;
        }
        message = message.replace(/\n/g, "<br>");
        const botMessage = bot_template.replace("{{MSG}}", message);
        chatConversation.insertAdjacentHTML("beforeend", botMessage);
    }


    attachPhotoButton.addEventListener("click", () => {
        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = "image/*";
        fileInput.onchange = () => {
            const file = fileInput.files[0];
            if (file) {
                selectedFile = file;
                imageNameDisplay.textContent = `Selected Image: ${file.name}`;
                imageNameDisplay.style.display = "block";
            }
        };
        fileInput.click();
    });

    accessCameraBtn.addEventListener("click", () => {
        cameraModal.style.display = "block";
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(stream => {
                cameraVideo.srcObject = stream;
            })
            .catch(err => {
                console.error("Error accessing camera: ", err);
            });
    });

    captureBtn.addEventListener("click", () => {
        const context = cameraCanvas.getContext("2d");
        cameraCanvas.width = cameraVideo.videoWidth;
        cameraCanvas.height = cameraVideo.videoHeight;
        context.drawImage(cameraVideo, 0, 0, cameraCanvas.width, cameraCanvas.height);
        cameraCanvas.toBlob(blob => {
            selectedFile = new File([blob], "captured_image.png", { type: "image/png" });
            imageNameDisplay.textContent = `Captured Image: captured_image.png`;
            imageNameDisplay.style.display = "block";

            const stream = cameraVideo.srcObject;
            const tracks = stream.getTracks();
            tracks.forEach(track => track.stop());
            cameraVideo.srcObject = null;
            cameraModal.style.display = "none";
        });
    });

    closeModal.addEventListener("click", () => {
        cameraModal.style.display = "none";
        const stream = cameraVideo.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach(track => track.stop());
        cameraVideo.srcObject = null;
    });

    window.addEventListener("click", (event) => {
        if (event.target == cameraModal) {
            cameraModal.style.display = "none";
            const stream = cameraVideo.srcObject;
            const tracks = stream.getTracks();
            tracks.forEach(track => track.stop());
            cameraVideo.srcObject = null;
        }
    });

    getResponseButton.addEventListener("click", async () => {
        const question = userQuestionInput.value.trim();
        if (!question) {
            alert("Please enter a question.");
            return;
        }

        const token = localStorage.getItem("access_token");
        if (!token) {
            alert("Token not found.");
            return;
        }

        const formData = new FormData();
        formData.append("question", question);

        if (selectedFile) {
            formData.append("file", selectedFile);
        }

        document.getElementById("get-response-spinner").style.display = "block";
        document.getElementById("get-response-text").style.display = "none";

        appendUserMessage(question);

        const response = await fetch(`http://localhost:8000/image_response`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
            },
            body: formData,
        });

        if (response.ok) {
            const data = await response.json();
            console.log("Response from server:", data);

            if (data.result.answer) {
                console.log(data.result)
                appendBotMessage(data.result.answer);
            }
            if(data.result){
                appendBotMessage(data.result)
            }
            else {
                console.error("No answer found in the response:", data);
            }
        } else {
            console.error("Failed to get response:", response.statusText);
        }

        document.getElementById("get-response-spinner").style.display = "none";
        document.getElementById("get-response-text").style.display = "block";
    });
    fetchChatHistories();
});

const bot_template = `
<div class="chat-message bot">
    <div class="avatar">
        <img src="https://i.ibb.co/v1dcnMh/6025105.png">
    </div>
    <div class="message">{{MSG}}</div>
</div>
`;

const user_template = `
<div class="chat-message user">
    <div class="avatar">
        <img src="https://i.ibb.co/gdxDh59/png-clipart-profile-logo-computer-icons-user-user-blue-heroes-thumbnail.png">
    </div>
    <div class="message">{{MSG}}</div>
</div>
`;

const css = `
<style>

.update-icon {
    width: 20px;
    height: 20px;
}

.update-icon, .delete-icon {
    width: 20px;
    height: 20px;
}
.welcome-logo {
    display: block;
    margin: 0 auto 20px auto;
    max-width: 100px; /* Adjust the size as needed */
}
.delete-button {
    background-color: #f44336;
    color: white;
    border: none;
    padding: 5px 10px;
    cursor: pointer;
    border-radius: 5px;
}
.delete-button:hover {
    background-color: #e53935;
}

#loading-message {
    position: fixed;
    top: 50%;
    left: 60%;
    transform: translate(-50%, -50%);
    z-index: 1000;
}

.selected-chat-history {
    background-color: #d3d3d3;
    border-radius: 15px;
}

.welcome-chat-message {
    padding: 2.5rem;
    border-radius: 1rem;
    background-color: #cccbcb;
    color: #000000;
    font-size: 14px;
    text-align: center;
    margin-top: 200px;
}


.empty-chat-message {
    padding: 2.5rem;
    border-radius: 1.5rem;
    background-color: #f0f0f0;
    color: #333;
    font-size: 14px;
    text-align: center;
    margin-top: 200px;
}

.chat-message {
    padding: 1.5rem;
    border-radius: 1.5rem;
    margin-bottom: 1rem;
    display: flex;
    align-items: center ;
}
.chat-message.user {
    background-color: #2b313e;
}
.chat-message.bot {
    background-color: #475063;
}
.chat-message .avatar {
    width: 20%;
    margin-right: 0.5rem;
}
.chat-message .avatar img {
    max-width: 78px;
    max-height: 78px;
    border-radius: 50%;
    object-fit: cover;
}
.chat-message .message {
    width: 80%;
    padding: 0 1.5rem;
    color: #fff;
    font-size: 12px;
    font-family: "Poppins", sans-serif;
}
.chat-history-item {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
}
.chat-history-button {
    margin-right: 10px;
}
.update-button {
    background-color: #4CAF50;
    color: white;
    border: none;
    padding: 5px 10px;
    cursor: pointer;
    border-radius: 5px;
}
.update-button:hover {
    background-color: #45a049;
}

.modal {
    display: none;
    position: fixed;
    z-index: 1;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: auto;
    background-color: rgb(0,0,0);
    background-color: rgba(0,0,0,0.4);
}

.modal-content {
    background-color: #fefefe;
    margin: 15% auto;
    padding: 20px;
    border: 1px solid #888;
    width: 80%;
    max-width: 500px;
    text-align: center;
    position: relative;
}

.close {
    color: #aaa;
    float: right;
    font-size: 28px;
    font-weight: bold;
}

.close:hover,
.close:focus {
    color: black;
    text-decoration: none;
    cursor: pointer;
}

#camera-video {
    width: 100%;
    height: auto;
    transform: scaleX(-1); /* Flip the video horizontally */
}

#capture-btn {
    margin-top: 10px;
    padding: 10px 20px;
    background-color: #4CAF50;
    color: white;
    border: none;
    cursor: pointer;
    border-radius: 5px;
}

#capture-btn:hover {
    background-color: #45a049;
}

.input-section {
    display: flex;
    flex-direction: column;
    align-items: center;
}

.input-controls {
    display: flex;
    align-items: center;
    width: 100%;
}

#image-name-display {
    text-align: center;
    margin-bottom: 10px;
}

</style>
`;

document.head.insertAdjacentHTML("beforeend", css);