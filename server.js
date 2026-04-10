
const fs = require('fs')
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
let tournamentIdCounter = 0;// counter for unique tournament IDs



io.on("connection", (socket) => {
    socket.username = null  // store it on the socket
    console.log("A user connected " + socket.handshake.address + " at " + new Date().toLocaleTimeString() + " Current Connections: " + io.engine.clientsCount);


    //sets name, if name taken then nothing
    socket.on("setName", (username) => {
        console.log("setName received:", username);
        let taken = false;

        if(username.length == 0) { //dont want to let people join without setting a name
            socket.emit("noName");
            taken = true;
        } else {
            players.forEach((player) => {
                if (username == player.username) {
                    socket.emit("usernameTaken")
                    taken = true;
                }
            });
        }
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
                    socket.emit("addTournamentBox", { numberOfPlayers: tournament.maxPlayers, id: tournament.ID, usernames: tournament.getUsernames() ? tournament.getUsernames().split(" ") : [] });
                    socket.emit("updateQueue", { id: tournament.ID, queueCount: tournament.players.length, maxPlayers: tournament.maxPlayers, usernames: tournament.getUsernames() ? tournament.getUsernames().split(" ") : [] });
                }
            });
        }
    })

    //when someone presses create tournament button
    socket.on("tournamentCreated", (numberOfPlayers) => {
        console.log("Tournament created with", numberOfPlayers, "players");
        const id = tournamentIdCounter++;
        const tournament = new Tournament(id, numberOfPlayers);
        tournament.addPlayer(socket.player); //automatically add host to tournament
        tournaments.push(tournament);

        io.emit("addTournamentBox", { numberOfPlayers, id, usernames: tournament.getUsernames() ? tournament.getUsernames().split(" ") : [] }); // also send usernames to display in lobby
        io.emit("updateQueue", { id: id, queueCount: tournament.players.length, maxPlayers: tournament.maxPlayers, usernames: tournament.getUsernames() });
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
            socket.emit("tournamentFull", tournamentID); //Note: Do we need?

            return;
        }

        if (tournament) {
            tournament.addPlayer(socket.player);
            io.emit("updateQueue", {
                id: tournamentID,
                queueCount: tournament.players.length,
                maxPlayers: tournament.maxPlayers,
                usernames: tournament.getUsernames() ? tournament.getUsernames().split(" ") : []
            });


            // Start the round and redirect players to their matches
            if (tournament.players.length === Number(tournament.maxPlayers)) {
                console.log("Starting tournament", tournamentID);
                const round = tournament.startRound(); //stores round in rounds array in tournament
                console.log("Round created, matches:", round.matches.length);
                round.matches.forEach((match) => {
                    const roomId = `tournament-${tournament.ID}-match-${match.matchNumber}`;

                    const socket1 = getSocketByUsername(match.playerOne.username); //find unique socket for each player based on their username
                    const socket2 = getSocketByUsername(match.playerTwo.username);

                    socket1.join(roomId); //send player 1 to their respective match
                    socket1.emit("redirect", `/match.html?matchId=${match.matchNumber}&tournamentId=${tournament.ID}`);
                    socket2.join(roomId); //send player 2 to the same match
                    socket2.emit("redirect", `/match.html?matchId=${match.matchNumber}&tournamentId=${tournament.ID}`);
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

        //finds the players that join the match because new socket and they join that match
    socket.on("joinMatch", (data) => {
        socket.player = players.find(p => p.username === data.username);//find and set player for new socket
        socket.join(`tournament-${data.tournamentId}-match-${data.matchId}`); //that new socket joins the match room
    });

    socket.on("requestMatch", (data) => { //when match page loads, we request a passage and player info for each map
        const tournament = tournaments.find(t => t.ID === data.tournamentId); //find current tournament
        const round = tournament.rounds[tournament.rounds.length - 1]; //get current round
        const match = round.matches.find(m => m.matchNumber === data.matchId); //get current match
        
        const roomId = `tournament-${data.tournamentId}-match-${data.matchId}`; //get room that match is in
        io.to(roomId).emit("matchStart", {  passage: match.passage, players: [match.playerOne, match.playerTwo], roundNumber: tournament.rounds.length, matchNumber: match.matchNumber, countdown: match.countdown}); //send passage and player to people in room
    });

    socket.on("updateProgress", (data) => { //whenever we receive a progress update (should be constant) we send it to the other player with the same match number
        const roomId = `tournament-${data.tournamentId}-match-${data.matchId}`;
        io.to(roomId).emit("playerProgress", { username: data.username, progress: data.progress, wpm: data.wpm, matchId: data.matchId });
    });

    socket.on("matchComplete", (data) => {
        const tournament = tournaments.find(t => t.ID === data.tournamentId); 
        const round = tournament.rounds[tournament.rounds.length - 1]; // get current round
        const match = round.matches.find(m => m.matchNumber === data.matchId);

        match.winner = socket.player; // set the winner
        match.loser = match.playerOne === socket.player ? match.playerTwo : match.playerOne; // set the loser
        
        const roomId = `tournament-${data.tournamentId}-match-${data.matchId}`; //get the current room
        io.to(roomId).emit("raceResults", { winner: socket.player.username }); //send current winner to room
        const loserSocket = getSocketByUsername(match.loser.username);
        if (loserSocket) {
            loserSocket.emit("redirect", `/loserPage.html?tournamentId=${tournament.ID}&won=false`); //send loser to loser page
        }
        round.removePlayer(match.loser); // remove the loser from the round
        const resultPayload = { tournamentId: data.tournamentId, roundNumber: tournament.rounds.length, matchId: match.matchNumber, winner: socket.player.username, loser: match.loser.username };
        tournament.results.push(resultPayload);
        io.emit("updateTournamentResults", resultPayload); //update tournament results for waiting room
    });

    socket.on("joinWaitingRoom", (data) => { //when winner joins waiting room
        socket.join(`tournament-${data.tournamentId}-waiting`); //join waiting room
        
        const tournament = tournaments.find(t => t.ID === data.tournamentId);
        const round = tournament.rounds[tournament.rounds.length - 1];
        
        if (tournament && Array.isArray(tournament.results)) {
            tournament.results.forEach((result) => {
                socket.emit("updateTournamentResults", result);
            });
        }
        
        if (round.winnersInWaitingRoom.includes(data.username) === false) { //mark this winner as in waiting room
            round.winnersInWaitingRoom.push(data.username);
        }
        
        if (round.isComplete() === true && round.allMatchesComplete() === true) { //if all matches are complete AND all winners are in waiting room
                const winners = round.getWinners();


                if (winners.length === 1) { //if theres only one winner, end tournament
                    io.to(`tournament-${tournament.ID}-waiting`).emit("tournamentComplete", { 
                        winner: winners[0].username, 
                        message: "Tournament Complete! Winner: " + winners[0].username 
                    });
                    return;
                }
                const nextRound = new Round(winners); //else we wanna start a new round
                tournament.rounds.push(nextRound); 

                for (let i = 0; i < nextRound.matches.length; i++) { //for each match in the next round, send the corresponding players to their match page
                    const match = nextRound.matches[i];
                    const socket1 = getSocketByUsername(match.playerOne.username);
                    const socket2 = getSocketByUsername(match.playerTwo.username);
                    socket1.join(`tournament-${tournament.ID}-match-${match.matchNumber}`); //add both players to their match room
                    socket2.join(`tournament-${tournament.ID}-match-${match.matchNumber}`);
                    io.to(`tournament-${tournament.ID}-match-${match.matchNumber}`).emit("redirect", `/match.html?matchId=${match.matchNumber}&tournamentId=${tournament.ID}`); //redirect both to match page
                }
            }
    });




})



function getSocketByUsername(username) { //allows us to get a socket by username, useful for sending messages to specific people
    for (const [id, socket] of io.sockets.sockets) {
        if (socket.player && socket.player.username === username) {
            return socket;
        }
    }
    return null;
}


class Tournament {
    constructor(ID, maxPlayers) {
        this.players = [];
        this.ID = ID;
        this.maxPlayers = maxPlayers;  //adding comment to commit to branch
        this.currentPlayers = 0; //adding to track how many players in each tournament, will also be used to prevent players from joining full lobby
        this.rounds = []; //keeps track of matches
        this.results = []; // store completed match results for replay in waiting room

    }

    getPlayer(index) {
        console.log(this.players[index]); // added this.
    }

    getUsernames() {
        return this.players.map(player => player.username).join(" ");
    }

    addPlayer(player) {
        this.players.push(player); // added this.
        this.currentPlayers++;
    }

    removePlayer(player) { // helper for remove players
        const index = this.players.indexOf(player);
        this.players.splice(index, 1);
        this.currentPlayers--;
    }

    removePlayerLosers() {
        this.matches.forEach(match => {
            if (match.loser) this.removePlayer(match.loser);
        });
    }
    startRound() {
            const round = new Round(this.players);
            this.rounds.push(round);
            return round;
        }
}





class Round {
    constructor(players) {
        this.matches = [];
        this.players = players;
        this.winnersInWaitingRoom = []; // track which winners have joined waiting room
        this.createMatches();
    }

    createMatches() { 
        for (let i = 0; i < this.players.length - 1; i += 2) {
            const match = new Match(this.players[i], this.players[i + 1], this.matches.length);
            this.matches.push(match);
        }
    }

    getWinners() { //array of winners from previous rounds
        const winners = [];
        for (let i = 0; i < this.matches.length; i++) { //for each match get the winner and add them to the array
            winners.push(this.matches[i].winner); 
        }
        return winners;
    }

    isComplete() { //make sure all matches are finished before advancing to next round
        for (let i = 0; i < this.matches.length; i++) {
            if (this.matches[i].winner === null) { //if there isnt a winner yet, we do not advacnce
                return false;
            }
        }
        return true;
    }
    
    allMatchesComplete() { //make sure all matches are complete and winners have been redirected to waiting room
        const winners = this.getWinners();
        for (let i = 0; i < winners.length; i++) { //make sure each winning username is in the array
            if (this.winnersInWaitingRoom.includes(winners[i].username) === false) { //if theres a winner not yet waiting we dont go to the next round
                return false;
            }
        }
        return true;
    }
    removePlayer(player){
        this.players = this.players.filter(p => p !== player);
    }
}


class Player {
    constructor(username) {
        this.username = username;
        this.passageQueue = null; // included in player because each player gets their own for each match
    }

    makePassageQueue(passage) {
        const queue = new Queue()
        passage.split('').forEach((character) => {
            queue.enqueue(character)
        })
        return queue
    }

    isFinished() {
        if (this.passageQueue !== null) {
            // if they finished the passage return true
            if (this.passageQueue.isEmpty()) {
                this.passageQueue = null; //wipes for next round?
                return true;
            }
            //otherwise they are not finished
            else {
                return false;
            }
        }
        return false;

    }

    checkInput(key) { //players inputted key will be compared to the queue and will dequeue if it is the same
        if (key === this.passageQueue.peek()) {
            this.passageQueue.dequeue();
            return true;
        }
        else {
            return false
        }
    }

}


//class for the 1v1s
class Match {
    constructor(playerOne, playerTwo, matchNumber) {
        this.playerOne = playerOne
        this.playerTwo = playerTwo
        this.matchNumber = matchNumber
        this.countdown = 10
        this.passage = this.readPassage()
        this.startTime = 0
        this.endTime = 0
        this.loser = null; // will be player
        this.winner = null;
    }


    //will read passages file and randomly return one passage for use
    readPassage() {
        const passages = fs.readFileSync('passages.txt', 'utf8')
            .split(/\r?\n/)
            .filter(line => line.trim().length > 0);

        const passage = passages[Math.floor(Math.random() * passages.length)]; // gets random passage

        return passage;
    }



}

class Queue {
    constructor() {
        this.items = []
    }

    enqueue(item) {
        this.items.push(item)
    }

    dequeue() {
        return this.items.shift()
    }

    peek() {
        return this.items[0]
    }

    isEmpty() {
        return this.items.length === 0
    }
}