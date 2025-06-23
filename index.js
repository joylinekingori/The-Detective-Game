let playersData = [];

const isGamePage = window.location.pathname.includes("game.html");
const isSetupPage = window.location.pathname.includes("setup.html");


if (isSetupPage) {
  const AVATAR_OPTIONS = [
    "😎", "🤖", "🦊", "🐼", "🐸", "🐵", "🦁", "🐱", "🦉", "🐧", "🐶", "🧑‍🚀"
  ];
  let currentAvatarPlayer = 0;

  window.startGame = function() {
    const player1 = document.getElementById('player1').value.trim();
    const player2 = document.getElementById('player2').value.trim();
    const player3 = document.getElementById('player3').value.trim();
    const player4 = document.getElementById('player4').value.trim();
    if (!player1 || !player2) {
      alert("Please enter at least two player names.");
      return;
    }
    playersData = [player1, player2, player3, player4]
      .filter(name => name !== "")
      .map(name => ({ name, avatar: null }));
    currentAvatarPlayer = 0;
    showAvatarModal();
  };

  function showAvatarModal() {
    document.getElementById('avatarModal').style.display = 'flex';
    document.getElementById('avatar-confirm-btn').disabled = true;
    const choicesContainer = document.getElementById('avatar-choices');
    choicesContainer.innerHTML = '';
    document.querySelector('#avatarModal .modal-content h2').innerText =
      `Choose an avatar, ${playersData[currentAvatarPlayer].name}`;

    AVATAR_OPTIONS.forEach(emoji => {
      const div = document.createElement('div');
      div.className = 'avatar-choice';
      div.innerText = emoji;
      div.onclick = () => {
        document.querySelectorAll('.avatar-choice').forEach(c => c.classList.remove('selected'));
        div.classList.add('selected');
        document.getElementById('avatar-confirm-btn').disabled = false;
        document.getElementById('avatarModal').dataset.selectedAvatar = emoji;
      };
      choicesContainer.appendChild(div);
    });
  }

  document.getElementById('avatar-confirm-btn').onclick = () => {
    const avatar = document.getElementById('avatarModal').dataset.selectedAvatar;
    playersData[currentAvatarPlayer].avatar = avatar;

    currentAvatarPlayer++;
    if (currentAvatarPlayer < playersData.length) {
      showAvatarModal();
    } else {
      document.getElementById('avatarModal').style.display = 'none';
      localStorage.setItem("playersData", JSON.stringify(playersData));
      window.location.href = "game.html";
    }
  };
}

if (isGamePage) {

  const NUM_SPACES = 20;
  const spaceTypes = ['talk', 'word', 'dna', 'mystery'];

  playersData = JSON.parse(localStorage.getItem("playersData")) ||
    [{name: "Player 1", avatar: "😎"}, {name: "Player 2", avatar: "🤖"}];
  if (!playersData || !Array.isArray(playersData) || playersData.length < 2) {
    alert("No players found! Please set up players first.");
    window.location.href = "setup.html";
  }
  const players = playersData.map(p => p.name);
  let playerPositions = new Array(players.length).fill(0);
  let currentPlayer = 0;
  let playerScores = new Array(players.length).fill(0);
  const board = document.getElementById("spaces");
  const playerTokens = document.getElementById("player-tokens");
  const angleStep = (2 * Math.PI) / NUM_SPACES;


  for (let i = 0; i < NUM_SPACES; i++) {
    const type = spaceTypes[i % spaceTypes.length];
    const angle = i * angleStep;
    const x = 220 + 200 * Math.cos(angle);
    const y = 220 + 200 * Math.sin(angle);

    const space = document.createElement("div");
    space.classList.add("space", type);
    space.style.left = `${x}px`;
    space.style.top = `${y}px`;
    space.innerText = i + 1;
    board.appendChild(space);
  }


  function updateTokens() {
    playerTokens.innerHTML = "";
    playerPositions.forEach((pos, idx) => {
      const angle = pos * angleStep;
      const x = 220 + 200 * Math.cos(angle);
      const y = 220 + 200 * Math.sin(angle);

      const token = document.createElement("div");
      token.classList.add("token", `token-${idx}`);

      if (idx === currentPlayer) token.classList.add('current');
      token.style.left = `${x + 10}px`;
      token.style.top = `${y + 10}px`;
      token.innerText = playersData[idx].avatar || "❓";
      playerTokens.appendChild(token);
    });
  }

  function updateSidebar() {
    document.getElementById("current-player").innerText = `${playersData[currentPlayer].avatar} ${players[currentPlayer]}`;
    const scores = players.map((p, i) => (
      `<p><strong>${playersData[i].avatar} ${p}</strong>: Position ${playerPositions[i] + 1} | Score: ${playerScores[i]}</p>`
    )).join("");
    document.getElementById("player-scores").innerHTML = scores;
  }

  window.rollDice = function() {
    if (document.querySelector(".roll-btn").disabled) return; 


    const diceAudio = document.getElementById("dice-roll-sound");
    if (diceAudio) {
      diceAudio.currentTime = 0;
      diceAudio.play();
    }

    const roll = Math.floor(Math.random() * 6) + 1;
    playerPositions[currentPlayer] = (playerPositions[currentPlayer] + roll) % NUM_SPACES;
    updateTokens();

    const landedSpaceType = spaceTypes[playerPositions[currentPlayer] % spaceTypes.length];
    setTimeout(() => {
      if (landedSpaceType === 'word') showWordSearchGame();
      else if (landedSpaceType === 'talk') showTalkItOutGame();
      else if (landedSpaceType === 'dna') showDNAGame();
      else if (landedSpaceType === 'mystery') showMysteryEvent();
    }, 500);
  };


  function showMysteryEvent() {
    const events = [
      { text: "You found a shortcut! Move forward 2 spaces.", action: () => movePlayer(2) },
      { text: "Oops! Caught in a trap, move back 2 spaces.", action: () => movePlayer(-2) },
      { text: "Lucky day! Gain 2 points.", action: () => { playerScores[currentPlayer] += 2; updateSidebar(); } },
      { text: "Unlucky! Lose a point.", action: () => { playerScores[currentPlayer] = Math.max(0, playerScores[currentPlayer] - 1); updateSidebar(); } },
      { text: "Mystery solved! Take another turn.", action: () => {  } },
      { text: "Trade places with the leader!", action: () => tradeWithLeader() }
    ];
    const event = events[Math.floor(Math.random() * events.length)];
    alert("❓ Mystery Space! " + event.text);
    event.action();
    updateTokens();
    updateSidebar();

    if (event.text === "Mystery solved! Take another turn.") {

      return;
    }
    checkForWinner();
  }

  function movePlayer(amount) {
    playerPositions[currentPlayer] = (playerPositions[currentPlayer] + amount + NUM_SPACES) % NUM_SPACES;
  }
  function tradeWithLeader() {
    let maxScore = Math.max(...playerScores);
    let leaderIndex = playerScores.indexOf(maxScore);
    if (leaderIndex !== currentPlayer) {
      [playerPositions[currentPlayer], playerPositions[leaderIndex]] =
        [playerPositions[leaderIndex], playerPositions[currentPlayer]];
    }
  }

  function checkForWinner() {
    const winnerIndex = playerScores.findIndex(score => score >= 5);
    if (winnerIndex !== -1) {
      setTimeout(() => {
        playWinSound();
        alert(`🎉 ${players[winnerIndex]} wins the game with 5 points!`);
        disableGame();
      }, 500);
    } else {

      currentPlayer = (currentPlayer + 1) % players.length;
      updateSidebar();
    }
  }

  function disableGame() {
    document.querySelector(".roll-btn").disabled = true;
    document.querySelector(".roll-btn").innerText = "Game Over 🎉";
  }

  const WORDS = ["CODE", "GAME", "JAVA", "BUG", "DATA"];
  let foundWords = [];
  let selectedCells = [];
  let isMouseDown = false;
  let wordTimer = null;
  let wordTimeLeft = 30;

  function showWordSearchGame() {
    document.getElementById("wordModal").style.display = "flex";
    generateWordGrid();
    foundWords = [];
    updateWordList();
    startWordTimer();
  }

  function startWordTimer() {
    wordTimeLeft = 30;
    updateWordList();
    if (wordTimer) clearInterval(wordTimer);
    wordTimer = setInterval(() => {
      wordTimeLeft--;
      updateWordList();
      if (wordTimeLeft <= 0) {
        clearInterval(wordTimer);
        alert("⏰ Time's up!");
        closeWordSearch();
        checkForWinner();
      }
    }, 1000);
  }

  function updateWordList() {
    const wordList = document.getElementById("word-list");
    wordList.innerHTML = `<strong>Find these words (Time left: ${wordTimeLeft}s):</strong><br>` +
      WORDS.map(word =>
        `<span class="${foundWords.includes(word) ? 'found-word' : ''}">${word}</span>`
      ).join(", ");
  }

  function closeWordSearch() {
    document.getElementById("wordModal").style.display = "none";
    if (wordTimer) clearInterval(wordTimer);
  }

  function generateWordGrid() {
    const grid = document.getElementById("word-grid");
    grid.innerHTML = "";
    const gridSize = 36;
    const gridWidth = 6;
    let cells = Array(gridSize).fill(null);


    WORDS.forEach(word => {
      let placed = false;
      for (let attempts = 0; attempts < 100 && !placed; attempts++) {
        const row = Math.floor(Math.random() * gridWidth);
        const maxStart = gridWidth - word.length;
        const col = Math.floor(Math.random() * (maxStart + 1));
        const start = row * gridWidth + col;
        let canPlace = true;
        for (let i = 0; i < word.length; i++) {
          if (cells[start + i] !== null) {
            canPlace = false;
            break;
          }
        }
        if (canPlace) {
          for (let i = 0; i < word.length; i++) {
            cells[start + i] = word[i];
          }
          placed = true;
        }
      }
    });

    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (let i = 0; i < gridSize; i++) {
      if (cells[i] === null) {
        cells[i] = letters[Math.floor(Math.random() * letters.length)];
      }
    }

    for (let i = 0; i < gridSize; i++) {
      const cell = document.createElement("div");
      cell.innerText = cells[i];
      cell.classList.add("cell");
      cell.dataset.index = i;

      cell.addEventListener("mousedown", (e) => {
        if (e.button !== 0) return;
        isMouseDown = true;
        clearSelected();
        cell.classList.add("selected");
        selectedCells = [cell];
      });
      cell.addEventListener("mouseenter", (e) => {
        if (isMouseDown) {
          cell.classList.add("selected");
          if (!selectedCells.includes(cell)) {
            selectedCells.push(cell);
          }
        }
      });
      cell.addEventListener("mouseup", () => {
        if (isMouseDown) {
          isMouseDown = false;
          checkSelectedWord();
        }
      });

      grid.appendChild(cell);
    }

    document.addEventListener("mouseup", () => {
      if (isMouseDown) {
        isMouseDown = false;
        checkSelectedWord();
      }
    });
  }

  function checkSelectedWord() {
    const selected = selectedCells.map(cell => cell.innerText).join("");
    if (WORDS.includes(selected) && !foundWords.includes(selected)) {
      alert(`✅ You found: ${selected}`);
      foundWords.push(selected);
      playerScores[currentPlayer]++;
      updateSidebar();
      updateWordList();
      clearSelected();
      if (foundWords.length === WORDS.length) {
        closeWordSearch();
        checkForWinner();
      }
    } else {
      clearSelected();
    }
  }

  function clearSelected() {
    document.querySelectorAll("#word-grid .selected").forEach(cell => {
      cell.classList.remove("selected");
    });
    selectedCells = [];
  }

  function playWinSound() {
    const audio = document.getElementById("win-sound");
    if (audio) {
      audio.currentTime = 0;
      audio.play();
    }
  }


  const TALK_KEYWORDS = [
    "Umbrella", "Pencil", "Airplane", "School", "Mountain", "Spider", "Clock", "Guitar", "TV", "Keyboard", "Light"
  ];

  function showTalkItOutGame() {
    const keyword = TALK_KEYWORDS[Math.floor(Math.random() * TALK_KEYWORDS.length)];
    document.getElementById("talk-keyword").innerText = keyword;
    document.getElementById("talkModal").style.display = "flex";


    let timeLeft = 30;
    document.getElementById("talk-timer").innerText = timeLeft;

    const countdown = setInterval(() => {
      timeLeft--;
      document.getElementById("talk-timer").innerText = timeLeft;
      if (timeLeft <= 0) {
        clearInterval(countdown);
        alert("⏰ Time's up!");
        closeTalkModal();
      }
    }, 1000);

    window.talkCountdown = countdown;
  }

  function closeTalkModal() {
    document.getElementById("talkModal").style.display = "none";
    clearInterval(window.talkCountdown);
    playerScores[currentPlayer]++;
    updateSidebar();
    checkForWinner();
  }

  const DNA_QUESTIONS = [
    {
      question: "Which base pairs with Adenine in DNA?",
      options: ["Thymine", "Uracil", "Cytosine", "Guanine"],
      answer: "Thymine"
    },
    {
      question: "Which base replaces Thymine in RNA?",
      options: ["Adenine", "Uracil", "Cytosine", "Guanine"],
      answer: "Uracil"
    },
    {
      question: "DNA is made up of how many strands?",
      options: ["1", "2", "3", "4"],
      answer: "2"
    },
    {
      question: "Which of these is not a DNA base?",
      options: ["Adenine", "Uracil", "Cytosine", "Guanine"],
      answer: "Uracil"
    }
  ];

  function showDNAGame() {
    document.getElementById("dnaModal").style.display = "flex";

    const q = DNA_QUESTIONS[Math.floor(Math.random() * DNA_QUESTIONS.length)];
    document.getElementById("dna-question").innerText = q.question;

    const optionsContainer = document.getElementById("dna-options");
    optionsContainer.innerHTML = "";

    q.options.forEach(option => {
      const btn = document.createElement("button");
      btn.innerText = option;
      btn.onclick = () => {
        if (option === q.answer) {
          alert("✅ Correct!");
          playerScores[currentPlayer]++;
        } else {
          alert("❌ Incorrect! The answer was: " + q.answer);
        }
        updateSidebar();
        closeDNAModal();
        checkForWinner();
      };
      optionsContainer.appendChild(btn);
    });
  }

  function closeDNAModal() {
    document.getElementById("dnaModal").style.display = "none";
  }



   function setTheme(theme) {
  document.body.classList.remove('theme-detective', 'theme-candy', 'theme-classic');
  document.body.classList.add('theme-' + theme);
  localStorage.setItem('gameTheme', theme);


  document.querySelectorAll('.theme-switcher button').forEach(btn => {
    btn.classList.remove('active');
    if (btn.title.toLowerCase() === theme) btn.classList.add('active');
  });
}


const chatMessages = [];

function sendChat(event) {
  event.preventDefault();
  const input = document.getElementById('chat-input');
  const message = input.value.trim();
  if (!message) return;

  const player = playersData && playersData[currentPlayer] ? playersData[currentPlayer] : {name: "Player", avatar: "🧑"};
  chatMessages.push({
    user: player.name,
    avatar: player.avatar,
    msg: message,
    self: true 
  });
  renderChat();
  input.value = '';
  input.focus();
}

function renderChat() {
  const chatBox = document.getElementById('chat-messages');
  chatBox.innerHTML = chatMessages.map(msg =>
    `<div class="chat-message self">
      <span class="avatar">${msg.avatar}</span>
      <span><strong>${msg.user}:</strong> ${msg.msg}</span>
    </div>`
  ).join('');
  chatBox.scrollTop = chatBox.scrollHeight;
}
  

  window.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('gameTheme') || 'detective';
    setTheme(savedTheme);
  });

  window.sendReaction = function(emoji) {
    const popup = document.getElementById('reaction-popup');
    popup.innerText = emoji;
    popup.style.display = 'block';

    const currentToken = document.querySelector(`.token-${currentPlayer}`);
    if (currentToken) {
      const rect = currentToken.getBoundingClientRect();
      popup.style.left = `${rect.left + window.scrollX + 30}px`;
      popup.style.top = `${rect.top + window.scrollY - 30}px`;
    } else {
      popup.style.left = '30vw';
      popup.style.top = '45vh';
    }
    setTimeout(() => { popup.style.display = 'none'; }, 1500);
  };


  window.showTurnRecap = function(msg) {
    const recap = document.createElement('div');
    recap.className = 'turn-recap';
    recap.innerText = msg;
    document.body.appendChild(recap);
    setTimeout(() => recap.remove(), 1800);
  };

  updateTokens();
  updateSidebar();

  window.closeDNAModal = closeDNAModal;
  window.closeTalkModal = closeTalkModal;
  window.closeWordSearch = closeWordSearch;
}