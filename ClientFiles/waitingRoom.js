const socket = io(); 
const username = localStorage.getItem("username");
socket.emit("giveName", username);

const matchId = parseInt(new URLSearchParams(window.location.search).get("matchId"));
const tournamentId = parseInt(new URLSearchParams(window.location.search).get("tournamentId"));
const won = new URLSearchParams(window.location.search).get("won") === "true";

const resultMessage = document.getElementById("resultMessage");

if (won === true) { // if they won, let them know they won the match
    resultMessage.textContent = "You won your match!";
} else { //else they lost, and let them know their match is over
    resultMessage.textContent = "Match finished.";
}

socket.emit("joinWaitingRoom", { tournamentId, username }); //join waiting room for this tournament

socket.on("redirect", (url) => { //redirect to next match
    window.location.href = url;
});

socket.on("tournamentComplete", (data) => { //when entire tournament is finished
    resultMessage.textContent = data.message;
    
    setTimeout(() => { //return to lobby after 3 seconds
        window.location.href = '/lobby.html';
    }, 3000);
});
