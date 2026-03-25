
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
    box.id = `tournament-${data.id}`;// gives box an id

  
    const queue = document.createElement("p");
    const tournamentID = document.createElement("p");
    queue.textContent = `Queue: 0/${data.numberOfPlayers}`;
    tournamentID.textContent = `ID: ${data.id}`;
    
    const joinButton = document.createElement("button");
    joinButton.textContent = "Join";
    joinButton.id = `${data.id}`;
    joinButton.classList.add("joinButton");
    
    box.appendChild(queue);
    box.appendChild(tournamentID);
    box.appendChild(joinButton);

    document.querySelector(".tournamentHolder").appendChild(box);

    joinButton.addEventListener('click', () => { 
    const tournamentID = box.id.split("-")[1];
    socket.emit("joinButtonClicked", tournamentID); // updates queue
    joinButton.disabled = true
});
});

//updates current players in queue
socket.on("updateQueue", (data) => {
    const box = document.querySelector(`#tournament-${data.id}`);
    const queue = box.querySelector("p:nth-child(1)"); // selects the first p (queue)
    queue.textContent = `Queue: ${data.queueCount}/${data.maxPlayers}`;
});

const joinButtons = document.querySelectorAll(".joinButton");
joinButtons.forEach((joinButton) => {
    joinButton.addEventListener('click', () => {
        const tournamentID = joinButton.closest(".tournamentBox").id.split("-")[1];
        socket.emit("joinButtonClicked", tournamentID);
    });
});

// When the tournament queue is full the server tells everyone to head to the race page
socket.on("redirectToRace", (data) => {
    localStorage.setItem("tournamentId", data.tournamentId);
    localStorage.setItem("passage", data.passage);
    localStorage.setItem("racePlayers", JSON.stringify(data.players));
    window.location.href = "/race.html";
});