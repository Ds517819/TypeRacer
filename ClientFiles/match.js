const socket = io();
const username = localStorage.getItem("username");
socket.emit("giveName", username);
const matchId = parseInt(new URLSearchParams(window.location.search).get("matchId"));
const tournamentId = parseInt(new URLSearchParams(window.location.search).get("tournamentId"));
socket.emit("joinMatch", { matchId, tournamentId, username }); // puts player in room for their match

const userInput = document.getElementById("typingInput"); //where user will type
const generatedTest = document.getElementById("passageText"); //generated text
const playerProgressBars = document.getElementById("playerProgressBars"); //progress
const countdownDisplay = document.getElementById("countdownDisplay"); //countdown
const statusMessage = document.getElementById("statusMessage"); //whether won or lost
const roundInfo = document.getElementById("round_num"); //round num
const matchNumber = document.getElementById("ID"); //tournament id

let currPassage = "";
let currentIndex = 0;
let Players = [];
let passagequeue = [];
let raceStarted = false;
let raceOver = false;
let startTime = null;


socket.emit("requestMatch", { matchId, tournamentId });

socket.on("matchStart", (data) => { //we get the passage and player username from the server 
    //console.log("matchStart received:", data);
    currPassage = data.passage; //set passage + players to one from server
    Players = data.players; 
    roundInfo.textContent = `Round ${data.roundNumber}`;
    matchNumber.textContent = `Match ${data.matchNumber}`;

    passagequeue = currPassage.split(''); //split the generated passage to compare each character
    displayPassage();
    createProgressBars();
    startCountdown(10);
});

function displayPassage() {
    generatedTest.innerHTML = '';
    for (let i = 0; i < currPassage.length; i++) { //for each character in the passage, we want them to have a unique div so we can mark an incorrect letter
        const charDiv = document.createElement('div'); 
        charDiv.textContent = currPassage[i];
        charDiv.className = 'char';
        charDiv.id = i;
        charDiv.style.display = 'inline';
        generatedTest.appendChild(charDiv); //add to passage display
    }
}

function startRace() { //Runs once countdown finishes and lets user type
    raceStarted = true;
    startTime = Date.now();
    userInput.disabled = false;
    userInput.focus();
    statusMessage.textContent = 'Type the passage above!';
}

function createProgressBars() {
    playerProgressBars.innerHTML = ''; //reset progress bars when new round
    
    for (let i = 0; i < Players.length; i++) { //for each player 
        const player = Players[i];
        const progressContainer = document.createElement('div'); //create a div for their progress bar
        progressContainer.className = 'progress-container';
        
        const label = document.createElement('div');
        label.className = 'player-label';
        label.innerHTML = `Player ${i + 1} (${player.username}) <span id="wpm-${player.username}" class="wpm-display">0 WPM</span>`; //get the username from the server and map it to their progress bar
        if (player.username === username) { //if the player is the current user we also want to make sure they know its them
            label.innerHTML = `Player ${i + 1} (${player.username}) - You <span id="wpm-${player.username}" class="wpm-display">0 WPM</span>`; //mark current user as themself 
            progressContainer.classList.add('current-player');
        }
        
        const progressBarWrapper = document.createElement('div'); //using a container to better handle progress bar
        progressBarWrapper.className = 'progress-bar-wrapper';
        
        const progressBar = document.createElement('div'); //initalize progress bar and its data (how far along and %)
        progressBar.className = 'progress-bar';
        progressBar.id = `progress-${player.username}`;
        progressBar.style.width = '0%';
        
        const percentage = document.createElement('div');
        percentage.className = 'percentage';
        percentage.id = `percentage-${player.username}`;
        percentage.textContent = '0%';
        
        progressBar.appendChild(percentage);
        progressBarWrapper.appendChild(progressBar);
        progressContainer.appendChild(label);
        progressContainer.appendChild(progressBarWrapper);
        playerProgressBars.appendChild(progressContainer);
    }
}

function startCountdown(seconds) { //once both clients connect to the match we start a countdown
    let count = seconds; 
    countdownDisplay.textContent = `Race starts in ${count}...`;
    countdownDisplay.style.display = 'block';
    
    const countdownInterval = setInterval(() => { //we want to update the countdown every second and this seemed to be the best way to do it without freezing the entire page
        count--;
        if (count > 0) { //update countdown every second until it equals 0
            countdownDisplay.textContent = `Race starts in ${count}...`;
        } else {
            countdownDisplay.textContent = 'GO!';
            setTimeout(() => {
                countdownDisplay.style.display = 'none';
                startRace();
            }, 500);
            clearInterval(countdownInterval); 
        }
    }, 1000);
}

function updateProgress(playerUsername, progress, wpm) { //used to update progress bar GUI for Each player, which is then sent back to the server and relayed to their opponent. the actual emit is done after user input
    const progressBar = document.getElementById(`progress-${playerUsername}`); 
    const percentage = document.getElementById(`percentage-${playerUsername}`);
    const wpmDisplay = document.getElementById(`wpm-${playerUsername}`);
    
    if (progressBar) { //Update progress bar, percentage complete, and wpm everytime theres an input
        progressBar.style.width = `${progress}%`;
    }
    if (percentage) {
        percentage.textContent = `${progress}%`;
    }
    if (wpmDisplay) {
        wpmDisplay.textContent = `${wpm} WPM`;
    }
}

function calculateWPM() { //function to calculate each users wpm
    if (!startTime) return 0;
    const timeElapsed = (Date.now() - startTime) / 1000 / 60; // convert to minutes
    const wordsTyped = currentIndex / 5; 
    return Math.round(wordsTyped / timeElapsed);
}

function endRace() { //once passageQueue is empty
    raceOver = true; //end race and disable input
    userInput.disabled = true;
    userInput.value = '';
    statusMessage.textContent = 'Race finished! Waiting for results...';
    socket.emit("matchComplete", { username, matchId, tournamentId }); //let server know match is complete
}




userInput.addEventListener('input', (e) => { //handles user input
    if (raceStarted === false || raceOver) { //if the race hasnt started or the race is over we want to disable all input
        return;
    } 
    
    const typed = e.target.value; //get current value of input box (upon startup will be empty)
    
    if (typed.length > 0 && passagequeue.length > 0) { //once user types an input
        const lastTyped = typed[typed.length - 1];  //we want to compare the latest input to the first character in the queue
        const expectedChar = passagequeue[0]; //store first character
        
        if (lastTyped === expectedChar) { //if input matches up with queue
            passagequeue.shift(); //pop from queue
            document.getElementById(currentIndex).classList.add('correct'); //marks character as correct, and as such turns it green
            document.getElementById(currentIndex).classList.remove('incorrect'); //marks character as incorract, and as such turns it red
            currentIndex++; //move to next num index in passage
            
            const progress = Math.min(100, Math.round((currentIndex / currPassage.length) * 100)); // calculate progress and clamp at 100
            const wpm = calculateWPM(); //calculate WPM per user, and send updates to server to relay to opponent
            updateProgress(username, progress, wpm);
            socket.emit("updateProgress", { username, progress, wpm, matchId, tournamentId }); //send progress across the server
            
            if (passagequeue.length === 0) { //once queue is empty we end the race 
                endRace();
            }
            
            userInput.value = ''; //clear textbox
        } else {
            document.getElementById(currentIndex).classList.add('incorrect'); //else, we want to let user know their input is wrong
            document.getElementById(currentIndex).classList.remove('correct');
        }
    }
});

userInput.addEventListener('paste', (e) => { //this is used to prevent pasting into the textbox note: dont even think this is needed since we search by character, but gonna keep anyway.
    e.preventDefault(); 
})


socket.on("playerProgress", (data) => { //wheever we get a progress update from the server (which is whenever user inputs) we want to update it on the opponents side
    if (data.matchId === matchId && data.username !== username) { //only update progress of other player in the same match
        updateProgress(data.username, data.progress, data.wpm); //added wpm
    }
});


socket.on("raceResults", (data) => { //when we receive data that the current round is over, we want to let user know and tell them to get ready for the next round
    statusMessage.textContent = `Race finished! Winner: ${data.winner}`;
    statusMessage.style.display = 'block';
    
    const won = data.winner === username; //if current player is the winner we send them to the waiting room, otherwise we send them black to lobby
    if (won === true) { //if winner matches up with current user, tell them they won
        statusMessage.textContent += ' - You won!';
        setTimeout(() => { 
            statusMessage.textContent += ' Moving to waiting room...';
            window.location.href = `/waitingRoom.html?matchId=${matchId}&tournamentId=${tournamentId}&won=${won}`; //after 2 seconds redirect to waiting room, this is 2 seconds since I would run into a race condition where they wouldnt be redirected to the next game but their opponent would
        }, 2000);
    } else { //else, they lost
        statusMessage.textContent += ' - You have been eliminated!';
        setTimeout(() => { 
            statusMessage.textContent += ' Returning to lobby...';
            window.location.href = '/lobby.html'; //redirect to lobby after 3 seconds
        }, 3000);
    }
});

socket.on("tournamentComplete", (data) => { //once tournament is complete send player back to lobby
    statusMessage.textContent = data.message;
    statusMessage.style.display = 'block';
    
    setTimeout(() => {
        window.location.href = '/lobby.html';
    }, 3000);
});

