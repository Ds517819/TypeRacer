const socket = io(); 
const username = localStorage.getItem("username");
socket.emit("giveName", username);

const matchId = parseInt(new URLSearchParams(window.location.search).get("matchId"));
const tournamentId = parseInt(new URLSearchParams(window.location.search).get("tournamentId"));
const won = new URLSearchParams(window.location.search).get("won") === "true";

const resultMessage = document.getElementById("resultMessage");
const backToLobbyBtn = document.getElementById("backToLobbyBtn");

backToLobbyBtn.addEventListener("click", () => {
    window.location.href = '/lobby.html';
});

if (won === true) { // if they won, let them know they won the match
    resultMessage.textContent = "You won your match!";
} else { //else they lost, and let them know their match is over
    resultMessage.textContent = "Match finished.";
}



socket.on("redirect", (url) => { //redirect to next match
    window.location.href = url;
});

socket.on("tournamentComplete", (data) => { //when entire tournament is finished
    resultMessage.textContent = data.message;
    
    setTimeout(() => { //return to lobby after 3 seconds
        window.location.href = '/lobby.html';
    }, 3000);
});
socket.on("updateTournamentResults", (data) => { //update tournament results in waiting room
    if (data.tournamentId === tournamentId) { //only update if it's for the current tournament
        const resultsList = document.getElementById("resultsList");
        const resultItem = document.createElement("li");
        resultItem.textContent = `Round ${data.roundNumber} - Match ${data.matchId}: ${data.winner} defeated ${data.loser}`;
        resultsList.appendChild(resultItem);
    }
});