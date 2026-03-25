
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

//shows password taken if in server array of users it already exists
socket.on("usernameTaken", () => {
  takenTag.style.display = "block";
});



socket.on("redirect", (url) => {
  window.location.href = url;
});