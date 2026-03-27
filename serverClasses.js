const fs = require('fs')

class Tournament {
    constructor(ID, maxPlayers) {
        this.players = [];
        this.ID = ID;
        this.maxPlayers = maxPlayers;  //adding comment to commit to branch
        this.currentPlayers = 0; //adding to track how many players in each tournament, will also be used to prevent players from joining full lobby
        this.rounds = []; //keeps track of matches

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
        this.createMatches();
    }

    createMatches() {
        for (let i = 0; i < this.players.length; i += 2) {
            const match = new Match(this.players[i], this.players[i + 1], this.matches.length);
            this.matches.push(match);
        }
    }

    getWinners() {
        return this.matches.map(match => match.winner);
    }

    isComplete() {
        return this.matches.every(match => match.winner !== null);
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
        const passages = fs.readFileSync('passages.txt', 'utf8').split('\n')

        const passage = passages[Math.floor(Math.random() * passages.length)] // gets random passage

        return passage
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



module.exports = { Tournament, Player, Match, Queue, Round };