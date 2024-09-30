// Select all DOM els
const opponentBox = document.querySelector('.modal__opponent');
const symbolsBox = document.querySelector('.modal__symbol-box');
const difficultyBox = document.querySelector('.modal__difficulty-box');
const headerTitle = document.querySelector('.header__turn');
const overEl = document.querySelector('.over');

const modal1 = document.querySelector('.modal__1st-step');
const modal2 = document.querySelector('.modal__2nd-step');
const modalBot = document.querySelector('.modal__bot');
const modalPerson = document.querySelector('.modal__person');

const header = document.querySelector('.header');
const headers = document.querySelectorAll('.header__score');
const scoreEls = header.querySelectorAll('.header__val');
const container = document.querySelector('.container');
const boardEl = document.querySelector('.board');
const cells = boardEl.querySelectorAll('.board__cell');

const returnBtn = document.querySelector('.btn-return');
const submit1 = document.getElementById('submit-1');
const submit2 = document.getElementById('submit-2');
const contBtn = overEl.querySelector('.continue__btn');

// Modal DOM Manipulation
const btnSwitch = (elName, e) => {
  const btn = e.target.closest(`.modal__${elName}`);
  if (!btn) return;

  btn.classList.add(`modal__${elName}-active`);
  [btn.nextElementSibling, btn.previousElementSibling].forEach((sibling) => {
    if (sibling) sibling.classList.remove(`modal__${elName}-active`);
  });
};

opponentBox.addEventListener('click', btnSwitch.bind(null, 'btn'));
symbolsBox.addEventListener('click', btnSwitch.bind(null, 'symbol'));
difficultyBox.addEventListener('click', btnSwitch.bind(null, 'btn'));

// Retreiving Data after Submit
let player1, player2, vsType;
let currentPlayer;
let gameOver;
let score = [0, 0];

submit1.addEventListener('click', () => {
  const opponent = opponentBox
    .querySelector('.modal__btn-active')
    .querySelector('span').textContent;
  const sign = symbolsBox.querySelector('.modal__symbol-active').textContent.toUpperCase();
  const name = document.querySelector('.modal__input').value;

  player1 = Player(name, sign);

  // Update DOM
  if (opponent === 'Bot') {
    document.querySelector('.modal__bot').hidden = false;
    vsType = 'bot';
  } else if (opponent === 'Person') {
    document.querySelector('.modal__person').hidden = false;
    vsType = 'person';
  } else return;

  modal1.hidden = true;
  modal2.hidden = false;
});

submit2.addEventListener('click', () => {
  const symbol = player1.symbol === 'X' ? 'O' : 'X';

  if (vsType === 'bot') {
    const difficulty = difficultyBox.querySelector('.modal__btn-active').textContent;
    player2 = Ai('Bot', symbol, 'easy');
  } else {
    const name = document.getElementById('name2').value;
    player2 = Player(name, symbol);
  }

  // Update Dom
  modal2.hidden = true;
  container.hidden = false;
  header.hidden = false;
  returnBtn.style.display = 'flex';

  headers[0].querySelector('.header__symbol').textContent = player1.symbol;
  headers[1].querySelector('.header__symbol').textContent = player2.symbol;
  headers[0].querySelector('.header__player').textContent = `${player1.name}:`;
  headers[1].querySelector('.header__player').textContent = `${player2.name}:`;

  Gamelogic.firstMove();
});

//////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////

// 1- Game-Board
const GameBoard = (() => {
  let board = Array(9).fill('');

  const getBoard = () => board;

  const resetBoard = () => {
    board = Array(9).fill('');
  };

  const setMove = (i, symbol) => {
    if (!board[i]) {
      board[i] = symbol;
    }
  };

  return { getBoard, resetBoard, setMove };
})();

// 2- Player/Bot -Constructors
const Player = (name, symbol) => {
  return { name, symbol };
};

const Ai = (name, symbol, difficulty) => {
  let aiMove;

  const setAiMove = () => {
    if (difficulty === 'easy') {
      aiMove = async function () {
        // Collect the indexes of empty cells
        const emptyIndexes = GameBoard.getBoard()
          .map((symbol, i) => (!symbol ? i : null))
          .filter((val) => val !== null);

        // Pick a random index of the prev arr
        const randomIndex = emptyIndexes[Math.floor(emptyIndexes.length * Math.random())];

        await Gamelogic.sleep(700);
        // Update DOM
        const cell = boardEl.querySelector(`.board__cell[data-index="${randomIndex}"]`);
        DomHandler.updateCell(cell);

        // Update internal Data
        Gamelogic.playMove(randomIndex);
      };
    }
  };
  setAiMove();

  return { name, symbol, difficulty, aiMove };
};

// 3- DOM handling
const DomHandler = (() => {
  const updateHeader = () => {
    headerTitle.textContent =
      currentPlayer.name.toLowerCase() === 'you' ? 'Your turn' : `${currentPlayer.name}'s turn`;
  };

  const updateCell = (cell) => {
    cell.querySelector('p').textContent = currentPlayer.symbol;
    cell.classList.add('non-hover');
  };

  const toggleHeaders = () => {
    headers.forEach((header) => header.classList.toggle('header__score-active'));
  };

  const showOver = async (result) => {
    await Gamelogic.sleep(700);
    overEl.hidden = false;

    if (result === 'Tie') {
      overEl.querySelector('.over__text').textContent = `It's a draw!`;
    } else if (result === player1) {
      overEl.querySelector('.over__text').textContent =
        player1.name.toLowerCase() === 'you' ? 'You won!' : `${player1.name} won!`;
      score[0] = ++score[0];
    } else if (result === player2) {
      overEl.querySelector('.over__text').textContent = `${player2.name} won!`;
      score[1] = ++score[1];
    }
  };

  const updateScores = () => {
    scoreEls.forEach((el, i) => (el.textContent = score[i]));
  };

  const emptyCells = () => {
    cells.forEach((cell) => {
      cell.querySelector('p').textContent = '';
      cell.classList.remove('non-hover');
    });
  };

  const resetHeaders = () => {
    headers.forEach((header) => {
      header.classList.remove('header__score-active');
    });
  };

  return {
    updateHeader,
    updateCell,
    toggleHeaders,
    showOver,
    emptyCells,
    resetHeaders,
    updateScores,
  };
})();

// 4- Game-Logic
const Gamelogic = (() => {
  const sleep = (ms) => {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  };

  const winningCombos = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  const firstMove = function () {
    gameOver = false;
    // Generate random first turn
    const indexPl = Math.floor(Math.random() * 2);

    headers[indexPl].classList.add('header__score-active');
    currentPlayer = indexPl === 0 ? player1 : player2;

    DomHandler.updateHeader();

    if (currentPlayer === player2 && currentPlayer.difficulty) {
      player2.aiMove();
    }
  };

  const clickHandler = (e) => {
    const cell = e.target.closest('.board__cell');
    if (
      !cell ||
      currentPlayer.difficulty ||
      gameOver ||
      GameBoard.getBoard()[cell.dataset.index]
    )
      return;

    DomHandler.updateCell(cell);
    Gamelogic.playMove(cell.dataset.index);

    if (!gameOver && player2.difficulty) player2.aiMove();
  };

  const switchPlayer = () => {
    console.log('switeched');
    currentPlayer = currentPlayer === player1 ? player2 : player1;
  };

  const playMove = (index) => {
    GameBoard.setMove(index, currentPlayer.symbol);
    const winner = checkWinner();

    if (!winner) {
      switchPlayer();
      DomHandler.toggleHeaders();
      DomHandler.updateHeader();
      return;
    }

    DomHandler.showOver(winner);
  };

  const checkWinner = () => {
    const board = GameBoard.getBoard();

    for (const combo of winningCombos) {
      const [a, b, c] = combo;

      // Check if not empty then if same symbol
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        gameOver = true;
        return currentPlayer;
      }
    }
    // Checks if no empty spot is left
    if (!board.includes('')) {
      gameOver = true;
      return 'Tie';
    }

    return null;
  };

  const resetGame = () => {
    gameOver = true;
    GameBoard.resetBoard();
    DomHandler.emptyCells();
    DomHandler.resetHeaders();
    score = [0, 0];
    DomHandler.updateScores();
    currentPlayer = player1 = player2 = vsType = undefined;
    header.hidden = true;
    container.hidden = true;
    modal1.hidden = false;
    returnBtn.style.display = 'none';
  };

  const nextRound = () => {
    overEl.hidden = true;
    DomHandler.updateScores();
    GameBoard.resetBoard();
    DomHandler.emptyCells();
    DomHandler.resetHeaders();
    firstMove();
  };

  return { playMove, resetGame, checkWinner, sleep, firstMove, nextRound, clickHandler };
})();

boardEl.addEventListener('click', Gamelogic.clickHandler);
contBtn.addEventListener('click', Gamelogic.nextRound);
returnBtn.addEventListener('click', Gamelogic.resetGame);
