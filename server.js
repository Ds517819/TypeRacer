const { Tournament, Player, Match, Queue } = require("./serverClasses.js");
//loads express module and assigns it to a variable called express
const express = require("express");
//to access http server
const http = require("http");

//gets server class from socket.io module
const socketio = require("socket.io");
const Server = socketio.Server;
const app = express();
const server = http.createServer(app);
const io = new Server(server);

server.listen(3000);
//gives people access to public folder
app.use(express.static(__dirname + "/ClientFiles"));

//route, where the server sends clients first
app.get("/", (req, res) => {
    res.sendFile(__dirname + "/ClientFiles/setName.html");
});


// so server can talk
process.stdin.on("data", (data) => {
    const words = data.toString().trim().split(" ")

    if (words[0] === "broadcast") {
        io.emit("message", { text: data.toString().substring(9), name: "Server" })
    }
})

let players = [];// arr of server players
let tournaments = [];// arr of server tournaments

io.on("connection", (socket) => {
    socket.username = null  // store it on the socket
    console.log("A user connected " + socket.handshake.address + " at " + new Date().toLocaleTimeString() + " Current Connections: " + io.engine.clientsCount);


    //sets name, if name taken then nothing
    socket.on("setName", (username) => {
        console.log("setName received:", username);
        let taken = false;

        players.forEach((player) => {
            if (username == player.username) {
                socket.emit("usernameTaken")
                taken = true;
            }
        });
        if (taken == false) {
            socket.player = new Player(username)
            players.push(socket.player);
            socket.emit("redirect", `/lobby.html`) // sends them to the lobby
        }
    })

    //since on new page different socket, computer sends stored username on local storage and adds to same object
    socket.on("giveName", (username) => {
        socket.player = players.find(player => player.username === username);
    });

    //when someone presses create tournament button
    socket.on("tournamentCreated", (numberOfPlayers) => {

        const id = tournaments.length;
        const tournament = new Tournament(id, numberOfPlayers);
        tournaments.push(tournament);

        io.emit("addTournamentBox", { numberOfPlayers, id });


    });

    socket.on("joinButtonClicked", (tournamentID) => {
        const tournament = tournaments.find(t => t.ID === Number(tournamentID));

        if (tournament) {
            tournament.addPlayer(socket.player);
            // Keep this socket in the tournament's room for targeted events
            socket.join(`tournament-${tournamentID}`);
            io.emit("updateQueue", {
                id: tournamentID,
                queueCount: tournament.players.length,
                maxPlayers: tournament.maxPlayers
            });

            // When the queue is full, start the race for everyone in the room
            if (tournament.players.length >= tournament.maxPlayers) {
                const match = new Match(tournament.players, 0 /* match index */);
                tournament.currentPassage = match.passage;
                io.to(`tournament-${tournamentID}`).emit("redirectToRace", {
                    tournamentId: tournamentID,
                    passage: match.passage,
                    players: tournament.players.map(p => p.username)
                });
            }
        }
        else {
            console.log("Tournament not found:", tournamentID);
        }
    });

    // Re-join room after page redirect (new socket connection on race.html)
    socket.on("rejoinTournament", (tournamentID) => {
        socket.join(`tournament-${tournamentID}`);
        const tournament = tournaments.find(t => t.ID === Number(tournamentID));
        if (tournament && tournament.currentPassage) {
            socket.emit("raceData", {
                passage: tournament.currentPassage,
                players: tournament.players.map(p => p.username)
            });
        }
    });

    // Broadcast a player's typing progress to everyone else in the tournament room
    socket.on("playerProgress", (data) => {
        if (socket.player) {
            socket.to(`tournament-${data.tournamentId}`).emit("updateProgress", {
                username: socket.player.username,
                progress: data.progress
            });
        }
    });

    // Announce the winner to everyone in the tournament room (first finisher only)
    socket.on("playerFinished", (data) => {
        if (socket.player) {
            const tournament = tournaments.find(t => t.ID === Number(data.tournamentId));
            if (tournament && !tournament.raceFinished) {
                tournament.raceFinished = true;
                io.to(`tournament-${data.tournamentId}`).emit("raceFinished", {
                    winner: socket.player.username
                });
            }
        }
    });

    socket.on("message", (data) => {
        io.emit("message", { text: data, name: socket.username })
    })

    socket.on("ping", (callback) => {
        callback()
    })
})