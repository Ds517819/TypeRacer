const socket = io();
const messageBox = document.getElementById('messageBox');
const inputText = document.getElementById('inputText');

const sendButton = document.getElementById('sendButton');


//when message received, add it to the message box
socket.on("message", (text) => {
    const message = document.createElement("div");
    message.classList.add("message");
    message.innerHTML = `${text}`;
    messageBox.appendChild(message);
});

//when send button is clicked, send message to server
sendButton.addEventListener('click', () => {
    socket.emit("message", inputText.value);
    inputText.value = '';
});


//ping
setInterval(() => {
    start = Date.now();
    socket.emit("ping", () =>{
        const latency = Date.now() - start;
        document.getElementById("latency").innerHTML = `Latency: ${latency}ms`;
    } );
}, 1000);