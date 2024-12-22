document.addEventListener("DOMContentLoaded", () => {

    let selectedChatHistory = null;

    const newChatButton = document.getElementById("new-chat-btn");
    const chatHistoryButtons = document.getElementById("chat-history-buttons");
    const chatConversation = document.getElementById('chat-conversation');
    const pineconeIndexDropdown = document.getElementById("pinecone-index-dropdown");
    const getResponseButton = document.getElementById("get-response-btn");
    const userQuestionInput = document.getElementById("user-question");

    function displayWelcomeMessage() {
        const welcomeMessage = document.createElement("div");
        welcomeMessage.className = "welcome-chat-message";

        const logo = document.createElement("img");
        logo.src = "images/6025105.png";
        logo.alt = "Logo";
        logo.className = "welcome-logo";

        const messageText = document.createElement("div");
        messageText.textContent = "Welcome. To chat with the smart asistant, please create a chat history and choose your topic. Have a healthy day!";

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
            newChatHistoryButton.value = data._id; // Store the chat history ID in the button's value
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

    // Function to load chat history details
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
        message = message.replace(/\n/g, "<br>");
        const botMessage = bot_template.replace("{{MSG}}", message);
        chatConversation.insertAdjacentHTML("beforeend", botMessage);
    }

    pineconeIndexDropdown.addEventListener("change", async () => {
        const selectedIndex = pineconeIndexDropdown.selectedIndex;
        const selectedOption = pineconeIndexDropdown.options[selectedIndex].text;
        let namespace = "";
        let indexNumber = "";

        switch (selectedOption) {
            case "Basal Cell Carcinoma":
                indexNumber = "1";
                namespace = "Basal_Cell_Carcinoma";
                break;
            case "Darier's Disease":
                indexNumber = "1";
                namespace = "Darier_s_Disease";
                break;
            case "Epidermolysis Bullosa Pruriginosa":
                indexNumber = "1";
                namespace = "Epidermolysis_Bullosa_Pruriginosa";
                break;
            case "Hailey-Hailey Disease":
                indexNumber = "1";
                namespace = "Hailey-Hailey_Disease";
                break;
            case "Herpes Simplex":
                indexNumber = "1";
                namespace = "Herpes_Simplex";
                break;
            case "Impetigo":
                indexNumber = "1";
                namespace = "Impetigo";
                break;
            case "Larva Migrans":
                indexNumber = "1";
                namespace = "Larva_Migrans";
                break;
            case "Leprosy Borderline":
                indexNumber = "2";
                namespace = "Leprosy_Borderline";
                break;
            case "Leprosy Lepromatous":
                indexNumber = "2";
                namespace = "Leprosy_Lepromatous";
                break;
            case "Leprosy Tuberculoid":
                indexNumber = "2";
                namespace = "Leprosy_Tuberculoid";
                break;
            case "Lichen Planus":
                indexNumber = "2";
                namespace = "Lichen_Planus";
                break;
            case "Lupus Erythematosus Chronicus Discoides":
                indexNumber = "2";
                namespace = "Lupus_Erythematosus_Chronicus_Discoides";
                break;
            case "Melanoma":
                indexNumber = "2";
                namespace = "Melanoma";
                break;
            case "Molluscum Contagiosum":
                indexNumber = "2";
                namespace = "Molluscum_Contagiosum";
                break;
            case "Mycosis Fungoides":
                indexNumber = "3";
                namespace = "Mycosis_Fungoides";
                break;
            case "Neurofibromatosis":
                indexNumber = "3";
                namespace = "Neurofibromatosis";
                break;
            case "Papilomatosis Confluentes And Reticulate":
                indexNumber = "3";
                namespace = "Papilomatosis_Confluentes_And_Reticulate";
                break;
            case "Pediculosis Capitis":
                indexNumber = "3";
                namespace = "Pediculosis_Capitis";
                break;
            case "Pityriasis Rosea":
                indexNumber = "3";
                namespace = "Pityriasis_Rosea";
                break;
            case "Porokeratosis Actinic":
                indexNumber = "3";
                namespace = "Porokeratosis_Actinic";
                break;
            case "Psoriasis":
                indexNumber = "3";
                namespace = "Psoriasis";
                break;
            case "Tinea Corporis":
                indexNumber = "4";
                namespace = "Tinea_Corporis";
                break;
            case "Tinea Nigra":
                indexNumber = "4";
                namespace = "Tinea_Nigra";
                break;
            case "Tungiasis":
                indexNumber = "4";
                namespace = "Tungiasis";
                break;
            case "Actinic Keratosis":
                indexNumber = "4";
                namespace = "actinic_keratosis";
                break;
            case "Dermatofibroma":
                indexNumber = "4";
                namespace = "dermatofibroma";
                break;
            case "Nevus":
                indexNumber = "4";
                namespace = "nevus";
                break;
            case "Pigmented Benign Keratosis":
                indexNumber = "4";
                namespace = "pigmented_benign_keratosis";
                break;
            case "Seborrheic Keratosis":
                indexNumber = "5";
                namespace = "seborrheic_keratosis";
                break;
            case "Squamous Cell Carcinoma":
                indexNumber = "5";
                namespace = "squamous_cell_carcinoma";
                break;
            case "Vascular Lesion":
                indexNumber = "5";
                namespace = "vascular_lesion";
                break;
            default:
                console.error("Invalid option selected");
                return; // Exit if no valid option is selected
        }

        const token = localStorage.getItem("access_token");
        if (!token) {
            alert("Token not found in local storage.");
            return;
        }

        const response = await fetch(`http://localhost:8000/set_pinecone_index?index_number=${indexNumber}&namespace=${namespace}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (response.ok) {
            console.log(`Pinecone index set to ${indexNumber} with namespace ${namespace}`);
        } else {
            console.error("Failed to set Pinecone index:", response.statusText);
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
            alert("Token cannot found!");
            return;
        }

        document.getElementById("get-response-spinner").style.display = "block";
        document.getElementById("get-response-text").style.display = "none";

        appendUserMessage(question);

        const formData = new FormData();
        formData.append("question", question);

        const response = await fetch(`http://localhost:8000/qa_response`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
            },
            body: formData,
        });

        if (response.ok) {
            const data = await response.json();
            console.log("Response from server:", data);

            if (data.result && data.result.answer) {
                appendBotMessage(data.result.answer);
            } else {
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

/*CSS*/
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
</style>
`;

// Append CSS to the head of the document
document.head.insertAdjacentHTML("beforeend", css);