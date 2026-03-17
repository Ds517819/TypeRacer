const socket = io();
const messageBox = document.getElementById('messageBox');
const inputText = document.getElementById('inputText');
const inputName = document.getElementById('inputName');
const sendButton = document.getElementById('sendButton');
const sendNameButton = document.getElementById('sendNameButton');
let name = "Anon";

//when message received, add it to the message box
socket.on("message", (data) => {
    const message = document.createElement("div");
    message.classList.add("message");
    message.innerHTML = `${data.name}: ${data.message}`;
    messageBox.appendChild(message);
});

//when send button is clicked, send message to server
sendButton.addEventListener('click', () => {
    socket.emit("message", { message: inputText.value, name: name });
    inputText.value = '';
});

//when send name button is clicked, send name to server
sendNameButton.addEventListener('click', () => {
    name = inputName.value;
    socket.emit("setName", name);
    inputName.value = '';
});