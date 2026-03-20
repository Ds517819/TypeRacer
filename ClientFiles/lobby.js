
const socket = io();
const numberOfPlayers = document.getElementById('numberOfPlayers');
const tournamentMakerButton = document.getElementById('tournamentMakerButton');


const username = localStorage.getItem("username")
socket.emit("giveName", username)

tournamentMakerButton.disabled = true

numberOfPlayers.addEventListener('input', () => {
    tournamentMakerButton.disabled = (numberOfPlayers.value === '') || (numberOfPlayers.value % 2 != 0) || (numberOfPlayers.value > 20)
})

tournamentMakerButton.addEventListener('click', () => {
    socket.emit("tournamentCreated", numberOfPlayers.value)
})


socket.on("addTournamentBox", (data) => {
    const box = document.createElement("div");
    box.classList.add("tournamentBox");
    box.textContent = `Max Players: ${data.numberOfPlayers}` + "\n" + 'Tournament ID: ${data.id}';

    const joinButton = document.createElement("button");
    joinButton.textContent = "Join";
    joinButton.classList.add("joinButton");

    box.appendChild(joinButton);
    document.querySelector(".tournamentHolder").appendChild(box);
});


joinButton.addEventListener('click', () => {
    socket.emit("joinButtonClicked", tournamentNumber);

});