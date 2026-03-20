
const socket = io();
let username = "Anon";
const inputName = document.getElementById('inputName');
const sendNameButton = document.getElementById('sendNameButton');



//when send name button is clicked, send name to server
sendNameButton.addEventListener('click', () => {
    username = inputName.value;
    localStorage.setItem("username", username)
    socket.emit("setName", username)
    inputName.value = '';
});



socket.on("redirect", (url) => {
  window.location.href = url; 
});