// Select all DOM els
const opponentBox = document.querySelector('.modal__opponent');
const symbolsBox = document.querySelector('.modal__symbol-box');
const difficultyBox = document.querySelector('.modal__difficulty-box');
const headerTitle = document.querySelector('.header__turn');
const overEl = document.querySelector('.over');
const overText = overEl.querySelector('.over__text');

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

  player1 = Player(name ? name : 'You', sign);

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
    player2 = Ai('Bot', symbol, difficulty);
  } else {
    const name = document.getElementById('name2').value;
    player2 = Player(name ? name : 'Player 2', symbol);
  }

  // Update Dom
  modal2.hidden = true;
  container.hidden = false;
  header.hidden = false;
  returnBtn.classList.remove('hidden');

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

  const indexGenerate = () => {
    const board = GameBoard.getBoard();

    // Collect the indexes of empty cells
    const emptyIndexes = board
      .map((cell, i) => (!cell ? i : null))
      .filter((val) => val !== null);

    // Pick a random index of the prev arr
    return emptyIndexes[Math.floor(Math.random() * emptyIndexes.length)];
  };

  const setAiMove = () => {
    if (difficulty === 'easy') {
      aiMove = async function () {
        const randomIndex = indexGenerate();
        await Gamelogic.sleep(700);
        // Update DOM
        const cell = boardEl.querySelector(`.board__cell[data-index="${randomIndex}"]`);
        DomHandler.updateCell(cell);

        // Update internal Data
        Gamelogic.playMove(randomIndex);
      };
    }

    if (difficulty === 'medium') {
      aiMove = async () => {
        const board = GameBoard.getBoard();
        let moveFound = undefined;

        attemptProhibitWinning = (symbol) => {
          for (const combo of Gamelogic.winningCombos) {
            const [a, b, c] = combo;

            // check if possible winnig move is possible
            if (board[a] === symbol && board[b] === symbol && !board[c]) {
              return c;
            } else if (board[a] === symbol && board[c] === symbol && !board[b]) {
              return b;
            } else if (board[b] === symbol && board[c] === symbol && !board[a]) {
              return a;
            }
          }
        };

        // Attempt winning
        moveFound = attemptProhibitWinning(player2.symbol);

        // Prohibit potential win
        if (moveFound === undefined) moveFound = attemptProhibitWinning(player1.symbol);

        // Generate a random Move
        if (moveFound === undefined) {
          moveFound = indexGenerate();
        }

        await Gamelogic.sleep(700);
        const cell = boardEl.querySelector(`.board__cell[data-index="${moveFound}"]`);
        DomHandler.updateCell(cell);
        Gamelogic.playMove(moveFound);
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
    modalBot.hidden = true;
    modalPerson.hidden = true;
    overEl.hidden = true;
    overText.textContent = '';
    modal1.hidden = false;
    returnBtn.classList.add('hidden');
  };

  const nextRound = () => {
    overEl.hidden = true;
    DomHandler.updateScores();
    GameBoard.resetBoard();
    DomHandler.emptyCells();
    DomHandler.resetHeaders();
    firstMove();
  };

  return {
    playMove,
    resetGame,
    checkWinner,
    sleep,
    firstMove,
    nextRound,
    clickHandler,
    winningCombos,
  };
})();

boardEl.addEventListener('click', Gamelogic.clickHandler);
contBtn.addEventListener('click', Gamelogic.nextRound);
returnBtn.addEventListener('click', Gamelogic.resetGame);
