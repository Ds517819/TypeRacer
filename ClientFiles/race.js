const socket = io();

// --- Retrieve state stored by lobby.js before redirect ---
const username    = localStorage.getItem("username");
const tournamentId = localStorage.getItem("tournamentId");
const storedPassage = localStorage.getItem("passage");
const storedPlayers = JSON.parse(localStorage.getItem("racePlayers") || "[]");

// --- DOM references ---
const passageDisplay   = document.getElementById("passage-display");
const raceInput        = document.getElementById("race-input");
const wpmDisplay       = document.getElementById("wpm");
const progressPctDisplay = document.getElementById("progress-pct");
const playersContainer = document.getElementById("players-container");
const finishMessage    = document.getElementById("finish-message");
const countdownOverlay = document.getElementById("countdown-overlay");
const countdownNumber  = document.getElementById("countdown-number");

// --- Race state ---
let passage     = storedPassage || "";
let raceStarted = false;
let finished    = false;
let startTime   = null;

// Re-attach player name and rejoin tournament room after page redirect
socket.emit("giveName", username);
if (tournamentId) {
    socket.emit("rejoinTournament", tournamentId);
}

// --- Build passage display (one <span> per character) ---
function buildPassageDisplay(text) {
    passageDisplay.innerHTML = "";
    for (let i = 0; i < text.length; i++) {
        const span = document.createElement("span");
        span.textContent = text[i];
        span.id = `char-${i}`;
        if (i === 0) span.classList.add("current");
        passageDisplay.appendChild(span);
    }
}

// --- Build per-player progress bars ---
function buildPlayerProgress(players) {
    playersContainer.innerHTML = "";
    players.forEach((player) => {
        const row = document.createElement("div");
        row.classList.add("player-row");
        row.id = `player-row-${player}`;

        const label = document.createElement("span");
        label.classList.add("player-label");
        label.textContent = player + (player === username ? " (you)" : "");

        const barContainer = document.createElement("div");
        barContainer.classList.add("progress-bar-container");

        const bar = document.createElement("div");
        bar.classList.add("progress-bar");
        bar.id = `bar-${player}`;
        bar.style.width = "0%";

        const pctLabel = document.createElement("span");
        pctLabel.classList.add("progress-label");
        pctLabel.id = `pct-${player}`;
        pctLabel.textContent = "0%";

        barContainer.appendChild(bar);
        row.appendChild(label);
        row.appendChild(barContainer);
        row.appendChild(pctLabel);
        playersContainer.appendChild(row);
    });
}

// --- Update a player's progress bar ---
function updatePlayerBar(player, progress) {
    const bar = document.getElementById(`bar-${player}`);
    const pct = document.getElementById(`pct-${player}`);
    if (bar) bar.style.width = `${progress}%`;
    if (pct) pct.textContent = `${progress}%`;
}

// --- WPM calculation (chars typed / 5 = words; divide by elapsed minutes) ---
function calcWPM(correctChars) {
    if (!startTime || correctChars === 0) return 0;
    const elapsedMinutes = (Date.now() - startTime) / 60000;
    return Math.round((correctChars / 5) / elapsedMinutes);
}

// --- Countdown then enable typing ---
function startCountdown() {
    let count = 3;

    function tick() {
        if (count > 0) {
            countdownNumber.textContent = count;
            // Re-trigger animation each tick
            countdownNumber.style.animation = "none";
            void countdownNumber.offsetHeight; // force reflow
            countdownNumber.style.animation = "";
            count--;
            setTimeout(tick, 1000);
        } else {
            countdownNumber.textContent = "GO!";
            countdownNumber.style.animation = "none";
            void countdownNumber.offsetHeight;
            countdownNumber.style.animation = "";
            setTimeout(() => {
                countdownOverlay.hidden = true;
                raceInput.disabled = false;
                raceInput.placeholder = "Start typing…";
                raceInput.focus();
                raceStarted = true;
                startTime = Date.now();
            }, 800);
        }
    }

    tick();
}

// --- Handle typing ---
raceInput.addEventListener("input", () => {
    if (!raceStarted || finished) return;

    const typed = raceInput.value;

    // Update character colors in the display
    for (let i = 0; i < passage.length; i++) {
        const span = document.getElementById(`char-${i}`);
        span.className = ""; // reset classes

        if (i < typed.length) {
            span.classList.add(typed[i] === passage[i] ? "correct" : "wrong");
        } else if (i === typed.length) {
            span.classList.add("current");
        }
    }

    // Find the length of the correct prefix
    let correctChars = 0;
    for (let i = 0; i < typed.length && i < passage.length; i++) {
        if (typed[i] === passage[i]) {
            correctChars++;
        } else {
            break;
        }
    }

    const progress = Math.round((correctChars / passage.length) * 100);
    progressPctDisplay.textContent = progress;
    wpmDisplay.textContent = calcWPM(correctChars);
    updatePlayerBar(username, progress);

    socket.emit("playerProgress", { tournamentId, progress });

    // Check if fully typed correctly
    if (typed === passage) {
        finished = true;
        raceInput.disabled = true;
        socket.emit("playerFinished", { tournamentId });
        showFinish("You finished! 🎉");
    }
});

// --- Result banner ---
function showFinish(msg) {
    finishMessage.textContent = msg;
    finishMessage.hidden = false;
}

// --- Incoming events from server ---
socket.on("updateProgress", (data) => {
    updatePlayerBar(data.username, data.progress);
});

socket.on("raceFinished", (data) => {
    if (data.winner === username) {
        // This player was the first to finish — they already see "You finished!"
        // No need to overwrite; the banner is already shown.
    } else if (!finished) {
        // This player hasn't finished yet — someone else won
        showFinish(`${data.winner} won the race! 🏆`);
        raceInput.disabled = true;
    } else {
        // This player also finished but wasn't first
        showFinish(`${data.winner} won the race! 🏆 (You finished too)`);
    }
});

// --- Initialise with localStorage data if available, otherwise wait for raceData ---
if (passage && storedPlayers.length > 0) {
    buildPassageDisplay(passage);
    buildPlayerProgress(storedPlayers);
    startCountdown();
}
// If data is missing (e.g. direct navigation), redirect back to lobby
else if (!tournamentId) {
    window.location.href = "/lobby.html";
}
// else wait for "raceData" event from server, then call startCountdown
socket.on("raceData", (data) => {
    // Only start countdown if we haven't already (guard against duplicate events)
    if (!raceStarted && passageDisplay.children.length === 0) {
        passage = data.passage;
        buildPassageDisplay(passage);
        buildPlayerProgress(data.players);
        startCountdown();
    }
});
