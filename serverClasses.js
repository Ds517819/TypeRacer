class Tournament {
    constructor(ID, maxUsers) {
        this.players = [];
        this.ID = ID
        this.maxUsers = maxUsers
    }
    getUsers(Users) {
        console.log(Users)
    }
    getUsernames(Users) {
        Users.forEach((user) => {
            return user.username + " ";
        })
    }

    addPlayer(player){
        players.push(player)
    }

}



class Player {
    constructor(username) {
        this.username = username;
    }

}


//class for the 1v1s
class Match {
    constructor(Users, matchNumber) {
        this.Users = Users
        this.matchNumber = matchNumber
        this.countdown = 10
        this.passage = this.readPassage()
        this.passageQueue = this.makePassageQueue(this.passage)
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

    makePassageQueue(passage) {
        const queue = new Queue()
        passage.split('').forEach((character) => {
            queue.enqueue(character)
        })
        return queue
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


match = new Match()
console.log(match.passage) // testing

match.passageQueue.items.forEach((character, index ) => { //testing
    console.log(index, character)
})
    

module.exports = { Tournament, Player, Match, Queue };