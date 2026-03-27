
const socket = io();
const numberOfPlayers = document.getElementById('numberOfPlayers');
const tournamentMakerButton = document.getElementById('tournamentMakerButton');

const username = localStorage.getItem("username")
socket.emit("giveName", username)
socket.emit("requestActiveTournaments")

tournamentMakerButton.disabled = true

numberOfPlayers.addEventListener('input', () => {
    tournamentMakerButton.disabled = (numberOfPlayers.value === '') || (numberOfPlayers.value % 2 != 0) || (numberOfPlayers.value > 20)
})

tournamentMakerButton.addEventListener('click', () => {
    socket.emit("tournamentCreated", numberOfPlayers.value)
    const joinButtons = document.querySelectorAll(".joinButton");
    joinButtons.disabled = true;
    joinButtons.forEach((joinButton) => {
        joinButton.disabled = true; 
    })
    //TODO: track id of tournament created by host, disable that tournament box's join button


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
    joinButton.disabled = true
    socket.emit("joinButtonClicked", tournamentID); // updates queue
});
});

//updates current players in queue
socket.on("updateQueue", (data) => {
    const box = document.querySelector(`#tournament-${data.id}`);
    console.log("updateQueue fired", data, "box found:", box); // debug line
    const queue = box.querySelector("p:nth-child(1)"); // selects the first p (queue)
    queue.textContent = `Queue: ${data.queueCount}/${data.maxPlayers}`
    if(data.queueCount >= data.maxPlayers) { //automatically remove tournament box once full
        box.remove();
    };
});

const joinButtons = document.querySelectorAll(".joinButton");
joinButtons.forEach((joinButton) => {
    joinButton.addEventListener('click', () => {
        const tournamentID = joinButton.closest(".tournamentBox").id.split("-")[1];
        socket.emit("joinButtonClicked", tournamentID);
    });
});


socket.on("tournamentFull", (tournamentID) => { //if user tries to join a full tournament, popup window and refresh the page
    alert("tournament is full");
});

