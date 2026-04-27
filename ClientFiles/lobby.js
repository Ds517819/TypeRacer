
const socket = io();
const numberOfPlayers = document.getElementById('numberOfPlayers');
const tournamentMakerButton = document.getElementById('tournamentMakerButton');
const allowedValues = [2, 4, 8, 16]; //accepted tournament amounts

const username = localStorage.getItem("username")
let inTournament = false;

socket.emit("giveName", username)
socket.emit("requestActiveTournaments")
socket.emit("joinLobby")

tournamentMakerButton.disabled = true;

numberOfPlayers.addEventListener('input', () => {
    tournamentMakerButton.disabled = inTournament || !filterOptions(numberOfPlayers.value) //if user is in a tournament or theres an invalid amount of players
})
tournamentMakerButton.addEventListener('click', () => {
    if (!filterOptions(numberOfPlayers.value) || inTournament) {
        return;
    }
    socket.emit("tournamentCreated", numberOfPlayers.value)
    disableJoinButtons();
    tournamentMakerButton.disabled = true;
    tournamentMakerButton.style.color = "gray";
    inTournament = true;
})

function filterOptions(value) {
    return allowedValues.includes(Number(value));
}


socket.on("addTournamentBox", (data) => {
    const box = document.createElement("div");
    box.classList.add("tournamentBox");
    box.id = `tournament-${data.id}`;// gives box an id


    const queue = document.createElement("p");
    const tournamentID = document.createElement("p");
    const playerList = document.createElement("p");
    queue.textContent = `Queue: 0/${data.numberOfPlayers}`;
    tournamentID.textContent = `ID: ${data.id}`;
    playerList.textContent = `${data.usernames ? 'In Queue: ' + data.usernames.join(', ') : ''}`;
    


    const joinButton = document.createElement("button");
    joinButton.textContent = "Join";
    joinButton.id = `${data.id}`;
    joinButton.classList.add("joinButton");

    box.appendChild(queue);
    box.appendChild(tournamentID);
    box.appendChild(playerList);
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
        tournamentMakerButton.innerHTML = "Joined";
    });
});


//updates current players in queue
socket.on("updateQueue", (data) => {
    const box = document.querySelector(`#tournament-${data.id}`);
    console.log("updateQueue fired", data, "box found:", box); // debug line
    const queue = box.querySelector("p:nth-child(1)"); // selects the first p (queue)
    queue.textContent = `Queue: ${data.queueCount}/${data.maxPlayers}`; // updates queue count and shows usernames if available
    const playerList = box.querySelector("p:nth-child(3)"); // selects the third p (player list)
    playerList.textContent = `${data.usernames ? 'Queue: ' + data.usernames.join(', ') : ''}`; // updates player list
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

socket.on("resetTournamentState", () => { //if user loses change their tournament status to false so they can make a new tournament
    inTournament = false;
    tournamentMakerButton.disabled = false;
    tournamentMakerButton.style.color = "";
    tournamentMakerButton.innerHTML = "Create Tournament";
    

    const joinButtons = document.querySelectorAll(".joinButton"); //let them join tournaments again
    joinButtons.forEach((button) => {
        button.disabled = false;
        button.style.color = "";
    });
});

function disableJoinButtons() {
    const joinButtons = document.querySelectorAll(".joinButton");
    joinButtons.forEach((button) => {
        button.disabled = true;
        button.style.color = "gray";
    });
}
