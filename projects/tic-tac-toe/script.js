const cells = document.querySelectorAll('.cell');
const statusText = document.getElementById('status');
const restartBtn = document.getElementById('restart');
const newBtn = document.getElementById('newGame');

let currentPlayer = 'X';
let gameActive = true;
let gameState = ['', '', '', '', '', '', '', '', ''];

const winningConditions = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

function handleCellClick(e) {
    const cell = e.target;
    const index = cell.getAttribute('data-index');

    if (gameState[index] !== '' || !gameActive) {
        return;
    }

    updateCell(cell, index);
    checkResult();
}

function updateCell(cell, index) {
    gameState[index] = currentPlayer;
    cell.textContent = currentPlayer;
    cell.classList.add('taken', currentPlayer.toLowerCase());
}

function checkResult() {
    let roundWon = false;
    let winningCells = [];

    for (let i = 0; i < winningConditions.length; i++) {
        const condition = winningConditions[i];
        const a = gameState[condition[0]];
        const b = gameState[condition[1]];
        const c = gameState[condition[2]];

        if (a === '' || b === '' || c === '') {
            continue;
        }

        if (a === b && b === c) {
            roundWon = true;
            winningCells = condition;
            break;
        }
    }

    if (roundWon) {
        statusText.textContent = `Player ${currentPlayer} Wins! 🎉`;
        gameActive = false;
        highlightWinningCells(winningCells);
        return;
    }

    if (!gameState.includes('')) {
        statusText.textContent = "It's a Draw! 🤝";
        gameActive = false;
        return;
    }

    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    statusText.textContent = `Player ${currentPlayer}'s Turn`;
}

function highlightWinningCells(cells) {
    cells.forEach(index => {
        document.querySelector(`[data-index="${index}"]`).classList.add('winner');
    });
}

function newGame() {
    currentPlayer = 'X';
    gameActive = true;
    gameState = ['', '', '', '', '', '', '', '', ''];
    statusText.textContent = `Player ${currentPlayer}'s Turn`;

    cells.forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('taken', 'x', 'o', 'winner');
    });
}

function resetGame() {
    gameState = ['', '', '', '', '', '', '', '', ''];
    gameActive = true; // allow play again

    cells.forEach(cell => {
        cell.textContent = '';
        cell.classList.remove('taken', 'x', 'o', 'winner');
    });

    statusText.textContent = `Game reset. Player ${currentPlayer}'s Turn`;
}

cells.forEach(cell => cell.addEventListener('click', handleCellClick));

restartBtn.addEventListener('click', resetGame);   // quick abort
newBtn.addEventListener('click', newGame);          // fresh start

