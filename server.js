const { Tournament, Player, Match, Queue, Round } = require("./serverClasses.js");
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


// so server can talk (not currently used)
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

    //if in lobby, request active tournaments to display
    socket.on("requestActiveTournaments", () => {
        if (tournaments.length !== 0) {
            tournaments.forEach((tournament) => {
                if (tournament.players.length != tournament.maxPlayers) {
                    socket.emit("addTournamentBox", { numberOfPlayers: tournament.maxPlayers, id: tournament.ID, createdBy: tournament.players[0].username });
                    socket.emit("updateQueue", { id: tournament.ID, queueCount: tournament.players.length, maxPlayers: tournament.maxPlayers });
                }
            });
        }
    })

    //when someone presses create tournament button
    socket.on("tournamentCreated", (numberOfPlayers) => {
        console.log("Tournament created with", numberOfPlayers, "players");
        const id = tournaments.length;
        const tournament = new Tournament(id, numberOfPlayers);
        tournament.addPlayer(socket.player); //automatically add host to tournament
        tournaments.push(tournament);

        io.emit("addTournamentBox", { numberOfPlayers, id, createdBy: tournament.players[0].username });
        io.emit("updateQueue", { id: id, queueCount: tournament.players.length, maxPlayers: tournament.maxPlayers });
        console.log("Emitted addTournamentBox to all clients");

    });

    socket.on("joinButtonClicked", (tournamentID) => {
        if (!socket.player) return;
        const tournament = tournaments.find(t => t.ID === Number(tournamentID));

        if (tournament.players.some(p => p.username === socket.player.username)) { //if player in tournament
            socket.emit("alreadyInTournament", tournamentID);
            return;
        }

        if (tournament.players.length >= tournament.maxPlayers) {
            socket.emit("tournamentFull", tournamentID);

            return;
        }

        if (tournament) {
            tournament.addPlayer(socket.player);
            io.emit("updateQueue", {
                id: tournamentID,
                queueCount: tournament.players.length,
                maxPlayers: tournament.maxPlayers
            });


            // Start the round and redirect players to their matches
            if (tournament.players.length === Number(tournament.maxPlayers)) {
                console.log("Starting tournament", tournamentID);
                const round = tournament.startRound(); //stores round in rounds array in tournament
                console.log("Round created, matches:", round.matches.length);
                round.matches.forEach((match) => {
                    const roomId = `tournament-${tournament.ID}-match-${match.matchNumber}`;

                    const socket1 = getSocketByUsername(match.playerOne.username);
                    const socket2 = getSocketByUsername(match.playerTwo.username);

                      console.log("socket1 found:", !!socket1, match.playerOne.username);
                        console.log("socket2 found:", !!socket2, match.playerTwo.username);

                    if (socket1) socket1.join(roomId);
                    if (socket2) socket2.join(roomId);

                    io.to(roomId).emit("redirect", `/match.html?matchId=${match.matchNumber}&tournamentId=${tournament.ID}`);
                });
            }
        }
        else {
            console.log("Tournament not found:", tournamentID);
        }
    });



    socket.on("message", (data) => {
        io.emit("message", { text: data, name: socket.username })
    })

    socket.on("ping", (callback) => {
        callback()
    })





    // --------------------- MATCH LOGIC ---------------------

    socket.on("joinMatch", (data) => {
        socket.player = players.find(p => p.username === data.username);
        socket.join(`tournament-${data.tournamentId}-match-${data.matchId}`);
    });

    socket.on("matchComplete", (data) => {
        // data should contain matchId and tournamentId so server knows which match
        const tournament = tournaments.find(t => t.ID === data.tournamentId);
        const round = tournament.rounds[tournament.rounds.length - 1]; // get current round
        const match = round.matches.find(m => m.matchNumber === data.matchId);

        match.winner = socket.player; // set the winner

        if (round.isComplete()) {
            const winners = round.getWinners();

            if (winners.length === 1) {
                io.emit("tournamentWinner", winners[0].username);
                return;
            }
            //start next round
            const nextRound = new Round(winners);
            tournament.rounds.push(nextRound);

            nextRound.matches.forEach((match) => {
                const socket1 = getSocketByUsername(match.playerOne.username);
                const socket2 = getSocketByUsername(match.playerTwo.username);
                if (socket1) socket1.join(`tournament-${tournament.ID}-match-${match.matchNumber}`);
                if (socket2) socket2.join(`tournament-${tournament.ID}-match-${match.matchNumber}`);
                io.to(`tournament-${tournament.ID}-match-${match.matchNumber}`).emit("redirect", `/match.html?matchId=${match.matchNumber}&tournamentId=${tournament.ID}`);
            });
        }
    });




})



function getSocketByUsername(username) { // allows us to get a socket by username, useful for sending messages to specific people
    for (const [id, socket] of io.sockets.sockets) {
        if (socket.player && socket.player.username === username) {
            return socket;
        }
    }
    return null;
}
