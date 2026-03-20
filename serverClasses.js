class Tournament {
    constructor(Users) {
        this.Users = Users
    }

    getUsers(Users) {
        console.log(Users)
    }
    getUsernames(Users) {
        Users.forEach((user) => {
            return user.username + " ";
        })
    }

}

class User {
    constructor(username, ID) {
        this.username = username;
        this.ID = ID;
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


const match = new Match()
console.log(match.passage) // testing

match.passageQueue.items.forEach((character, index ) => { //testing
    console.log(index, character)
})