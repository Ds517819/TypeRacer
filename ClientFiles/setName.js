
const socket = io();
let username = "Anon";
const inputName = document.getElementById('inputName');
const sendNameButton = document.getElementById('sendNameButton');
const takenTag = document.getElementById('takenTag');



//when send name button is clicked, send name to server
sendNameButton.addEventListener('click', () => {
  username = inputName.value;
  localStorage.setItem("username", username)
  socket.emit("setName", username)
  inputName.value = '';
});

sendNameButton.addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    username = inputName.value;
    localStorage.setItem("username", username)
    socket.emit("setName", username)
    inputName.value = '';
  }
});

inputName.addEventListener('keydown', (event) => { //now enter key also sets username
  if (event.key === 'Enter') {
    event.preventDefault();
    sendNameButton.click();
  }
});

//shows username taken if in server array of users it already exists
socket.on("usernameTaken", () => {
  takenTag.style.display = "block";
});



socket.on("redirect", (url) => {
  window.location.href = url;
});