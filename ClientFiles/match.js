const socket = io();
const username = localStorage.getItem("username");
socket.emit("giveName", username);
const matchId = new URLSearchParams(window.location.search).get("matchId");
const tournamentId = new URLSearchParams(window.location.search).get("tournamentId");
socket.emit("joinMatch", { matchId, tournamentId, username }); // puts player in room for their match