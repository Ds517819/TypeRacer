class Tournament {
    constructor(ID, maxPlayers) {
        this.players = [];
        this.ID = ID;
        this.maxPlayers = maxPlayers;
    }

    getPlayer(index) {
        console.log(this.players[index]); // added this.
    }

    getUsernames() {
        return this.players.map(player => player.username).join(" ");
    }

    addPlayer(player) {
        this.players.push(player); // added this.
    }

    removePlayer(player) {
        const index = this.players.indexOf(player);
        this.players.splice(index, 1);
    }

    startRound(){

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

    isFinished(){
        if (this.passageQueue =! null){
            // if they finished the passage return true
            if (this.passageQueue.isEmpty()){
                this.passageQueue = null; //wipes for next round?
                return true;
            }
            //otherwise they are not finished
            else
                {
                return false;
            }
        }

    }

    checkInput(key){ //players inputted key will be compared to the queue and will dequeue if it is the same
        if(key === this.passageQueue.peek){
            this.passageQueue.dequeue();
            return true;
        }
        else{
            return false
        }
    }

}


//class for the 1v1s
class Match {
    constructor(players, matchNumber) {
        this.players = players
        this.matchNumber = matchNumber
        this.countdown = 10
        this.passage = this.readPassage()
        this.startTime = 0
        this.endTime = 0
    }


    //will read passages file and randomly return one passage for use
    readPassage() {
        const fs = require('fs')
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



module.exports = { Tournament, Player, Match, Queue };