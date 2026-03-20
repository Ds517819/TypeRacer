

const numberOfPlayers = document.getElementById('numberOfPlayers');
const tournamentMakerButton = document.getElementById('tournamentMakerButton');

tournamentMakerButton.disabled = true

numberOfPlayers.addEventListener('input', () => {
    tournamentMakerButton.disabled = (numberOfPlayers.value === '') || (numberOfPlayers.value % 2 != 0)
})

console.log(tournamentMakerButton.disabled)