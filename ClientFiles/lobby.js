
const socket = io();
const numberOfPlayers = document.getElementById('numberOfPlayers');
const tournamentMakerButton = document.getElementById('tournamentMakerButton');

const username = localStorage.getItem("username")
let inTournament = false;

socket.emit("giveName", username)
socket.emit("requestActiveTournaments")

tournamentMakerButton.disabled = true

numberOfPlayers.addEventListener('input', () => {
    tournamentMakerButton.disabled = inTournament || (numberOfPlayers.value === '') || (numberOfPlayers.value % 2 != 0) || (numberOfPlayers.value > 20)
})
tournamentMakerButton.addEventListener('click', () => {
    socket.emit("tournamentCreated", numberOfPlayers.value)
    disableJoinButtons();
    tournamentMakerButton.disabled = true;
    tournamentMakerButton.style.color = "gray";
    inTournament = true;
})


socket.on("addTournamentBox", (data) => {
    const box = document.createElement("div");
    box.classList.add("tournamentBox");
    box.id = `tournament-${data.id}`;// gives box an id


    const queue = document.createElement("p");
    const tournamentID = document.createElement("p");
    const createdBy = document.createElement("p");
    queue.textContent = `Queue: 0/${data.numberOfPlayers}`;
    tournamentID.textContent = `ID: ${data.id}`;
    createdBy.textContent = `Created by: ${data.createdBy}`;


    const joinButton = document.createElement("button");
    joinButton.textContent = "Join";
    joinButton.id = `${data.id}`;
    joinButton.classList.add("joinButton");

    box.appendChild(queue);
    box.appendChild(tournamentID);
    box.appendChild(createdBy);
    box.appendChild(joinButton);

    // if player is already in tournament, gray out the button
    if (inTournament === true) {
        joinButton.disabled = true;
        joinButton.style.color = "gray";
    }


    document.querySelector(".tournamentHolder").appendChild(box);


    joinButton.addEventListener('click', () => {
        const tournamentID = box.id.split("-")[1];
        disableJoinButtons();
        socket.emit("joinButtonClicked", tournamentID); // updates queue
        inTournament = true;
        tournamentMakerButton.disabled = true;
        tournamentMakerButton.style.color = "gray";
    });
});


//updates current players in queue
socket.on("updateQueue", (data) => {
    const box = document.querySelector(`#tournament-${data.id}`);
    console.log("updateQueue fired", data, "box found:", box); // debug line
    const queue = box.querySelector("p:nth-child(1)"); // selects the first p (queue)
    queue.textContent = `Queue: ${data.queueCount}/${data.maxPlayers}`
    if (data.queueCount >= data.maxPlayers) { //automatically remove tournament box once full
        box.remove();
    };
});

socket.on("tournamentFull", (tournamentID) => { //if user tries to join a full tournament, popup window and refresh the page
    alert("tournament is full");
});

socket.on("redirect", (url) => {
    window.location.href = url;
});

function disableJoinButtons() {
    const joinButtons = document.querySelectorAll(".joinButton");
    joinButtons.forEach((button) => {
        button.disabled = true;
        button.style.color = "gray";
    });
}
