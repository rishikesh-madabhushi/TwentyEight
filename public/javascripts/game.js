const gameSocket = io("/game");

let numPlayers;
let leftPlayerOrder, topPlayerOrder, rightPlayerOrder, bottomPlayerOrder;
let leftPlayer, topPlayer, rightPlayer, bottomPlayer;
let playerNames;
let playersCards;
let currentPlayer;
let turnState;
let observer;
let selectedSingle = false;
let selectedFirst = false;
let selectedSecond = false;
let selectedThird = false;
let selectedSingleCard = "0";
let selectedMultiple = ["0", "0", "0"];
let gameOver = false;

gameSocket.on("LOAD PLAYERS", data => {
  playerNames = data.game_players;

  numPlayers = playerNames.length;

  bottomPlayer = null;

  for (let i = 0; i < numPlayers; i++) {
    if (username == playerNames[i].username) {
      bottomPlayerOrder = i;
      break;
    }
  }

  if (bottomPlayerOrder == null) {
    observer = true;
    bottomPlayerOrder = 0;
  } else {
    observer = false;
  }

  if (numPlayers == 4) {
    leftPlayerOrder = (bottomPlayerOrder + 1) % 4;
    topPlayerOrder = (bottomPlayerOrder + 2) % 4;
    rightPlayerOrder = (bottomPlayerOrder + 3) % 4;
  } else {
    topPlayerOrder = (bottomPlayerOrder + 1) % 2;
  }
});

gameSocket.on("UPDATE", data => {
  try {
    clearTimeout(timer);
  } catch (e) {}

  topPlayer = data.shared_player_information[topPlayerOrder];
  bottomPlayer = data.shared_player_information[bottomPlayerOrder];

  if (numPlayers == 4) {
    leftPlayer = data.shared_player_information[leftPlayerOrder];
    rightPlayer = data.shared_player_information[rightPlayerOrder];
  }
  currentPlayer = data.turn_information.current_player;
  if (observer) {
    turnState = "observer";
  } else if (currentPlayer == username) {
    turnState = "play";
  } else {
    turnState = "nudge";
  }

  selectedSingleCard = "0";
  selectedSingle = false;

  if (observer) {
    updateGameBoard();
  } else {
    gameSocket.emit("GET PLAYER HAND", { user_id: user_id, game_id: game_id });
  }
});

gameSocket.on("SEND PLAYER HAND", data => {
  playersCards = data.player_hand;

  updateGameBoard();
});

gameSocket.on("GAME OVER", data => {
  gameOver = true;
  const board = document.getElementsByClassName("game-box")[0];

  let scoreHtml =
    '<div class="container" >' +
    '    <div class="modal modal-dialog" id="game_over_window" role="dialog" style="border-radius: 15px; background-color: #086305; padding-left: 0; padding-right: 0;">' +
    '                <div class="modal-header">' +
    "                    <center>" +
    '                        <h4 class="modal-title">Game Over!</h4>' +
    "                    </center>" +
    "                </div>" +
    '                <div class="modal-body" style="color:#086305;background-color: #ffffff;">' +
    '                    <table class="table table-striped table-dark">' +
    "                        <thead>" +
    "                            <tr>" +
    '                                <th scope="col">Player\'s name</th>' +
    '                                <th scope="col">Score</th>' +
    "                            </tr>" +
    "                        </thead>" +
    "                        <tbody>" +
    "                            <tr>" +
    "                                <td>" +
    playerNames[bottomPlayerOrder].username +
    "</td>" +
    "                                <td>" +
    bottomPlayer.total_score +
    "</td>" +
    "                            </tr>" +
    "                            <tr>" +
    "                                <td>" +
    playerNames[topPlayerOrder].username +
    "</td>" +
    "                                <td>" +
    topPlayer.total_score +
    "</td>" +
    "                            </tr>";

  if (numPlayers == 4) {
    scoreHtml +=
      "                            <tr>" +
      "                                <td>" +
      playerNames[leftPlayerOrder].username +
      "</td>" +
      "                            <td>" +
      leftPlayer.total_score +
      "</td>" +
      "                            </tr>" +
      "                            <tr>" +
      "                                <td>" +
      playerNames[rightPlayerOrder].username +
      "</td>" +
      "                            <td>" +
      rightPlayer.total_score +
      "</td>" +
      "                            </tr>";
  }

  scoreHtml +=
    "                        </tbody>" +
    "                    </table>" +
    "                </div>" +
    '                <div class="modal-footer">' +
    '                  <a href="/lobby" style="color:#e9eb89">Return to lobby...</a>';
  "            </div>" + "</div>";

  let div = document.createElement("div");
  div.innerHTML = scoreHtml;

  board.appendChild(div);

  $("#game_over_window").modal();
});

// TODO: Put these in some utility location
const getSuit = (card) => {
	return Math.floor((card - 1) / 8);
};

const getCardValue = (card) => {
	let card_idx = (card - 1) % 8;
	if (card_idx != 0) {
	   return card_idx + 5;
	}
	return 0;
}

function updateGameBoard() {
  const board = document.getElementsByClassName("game-box")[0];
  let gameHtml = "";
  let z = 1;

  gameHtml +=
    '<div class = "top-player-info">' +
    "<p>" +
    playerNames[topPlayerOrder].username +
    "</p>" +
    '<div class = "player-score-box">' +
    '<p class = "player-round-score">Score this round: ' +
    topPlayer.current_round_score +
    "</p>" +
    '<p class = "player-total-score">Total score: ' +
    topPlayer.total_score +
    "</p>" +
    "</div></div>";
  let displacement = 540 - (26 - topPlayer.card_count) * 10;
  for (let i = 0; i < topPlayer.card_count; i++) {
    gameHtml +=
      '<div class= "top-player card-back" style="left: ' +
      displacement +
      "px; z-index: " +
      z +
      ';"></div>';
    z++;
    displacement -= 20;
  }
  if (topPlayer.card_in_play != null) {
    let suit = -getSuit(topPlayer.card_in_play) * 100;
    let face = -(getCardValue(topPlayer.card_in_play)) * 69;
    gameHtml +=
      '<div class = "top-player-to-mid card " style="background-position-y: ' +
      suit +
      "px; background-position-x: " +
      face +
      'px" id="' +
      topPlayer.card_in_play +
      '"></div>';
  }

  let buttonString = "";
  if (turnState == "play") {
    buttonString = 'onclick="selectSingleCard(this.id)"';
    gameHtml +=
      '<button class="game-button btn btn-primary" id="single-button" onclick="playButton()" disabled>Play</button>';
    gameHtml +=
      '<div class = "alert-box"><p>Your turn to play a card.</p></div>';
  } else if (!observer) {
    buttonString = "";
    gameHtml +=
      '<button class="game-button btn btn-primary" id="nudge-button" onclick="nudgeButton()">Nudge</button>';
    gameHtml +=
      '<div class = "alert-box"><p>' +
      currentPlayer +
      "'s turn to play a card.</p></div>";
  } else {
    gameHtml +=
      '<div class = "alert-box"><p>' +
      currentPlayer +
      "'s turn to play a card.</p></div>";
    gameHtml += '<div class = "alert-box"></div>';
  }

  gameHtml +=
    '<div class = "player-info">' +
    '<div class = "player-score-box">' +
    '<p class = "player-round-score">Score this round: ' +
    bottomPlayer.current_round_score +
    "</p>" +
    '<p class = "player-total-score">Total score: ' +
    bottomPlayer.total_score +
    "</p>" +
    "</div>" +
    "<p>" +
    playerNames[bottomPlayerOrder].username +
    "</p>" +
    "</div>";

  if (observer) {
    displacement = 170 + (13 - bottomPlayer.card_count) * 10;
    for (let i = 0; i < bottomPlayer.card_count; i++) {
      gameHtml +=
        '<div class= "bottom-player-observer card-back" style="left: ' +
        displacement +
        "px; z-index: " +
        z +
        ';"></div>';
      z++;
      displacement += 20;
    }
  } else {
    displacement = 170 + (13 - playersCards.length) * 10;
    for (let i = 0; i < playersCards.length; i++) {
      let suit = -getSuit(playersCards[i].card_id) * 100;
      let face = -(getCardValue(playersCards[i].card_id)) * 69;
      gameHtml +=
        '<div class= "bottom-player" style="left: ' +
        displacement +
        "px; z-index: " +
        z +
        "; background-position-y: " +
        suit +
        "px; background-position-x: " +
        face +
        'px" ' +
        buttonString +
        ' id="' +
        playersCards[i].card_id +
        '"></div>';
      z++;
      displacement += 20;
    }
  }

  if (bottomPlayer.card_in_play != null) {
    let suit = -getSuit(bottomPlayer.card_in_play) * 100;
    let face = -(getCardValue(bottomPlayer.card_in_play)) * 69;
    gameHtml +=
      '<div class = "bottom-player-to-mid card " style="background-position-y: ' +
      suit +
      "px; background-position-x: " +
      face +
      'px" id="' +
      bottomPlayer.card_in_play +
      '"></div>';
  }

  if (numPlayers == 4) {
    updateBoardFourPlayers(gameHtml);
  } else {
    board.innerHTML = gameHtml;
  }
}

function updateBoardFourPlayers(gameHtml) {
  const board = document.getElementsByClassName("game-box")[0];
  let z = 30;

  gameHtml +=
    '<div class = "left-player-info">' +
    '<div class = "player-score-box">' +
    '<p class = "player-round-score">Score this round: ' +
    leftPlayer.current_round_score +
    "</p>" +
    '<p class = "player-total-score">Total score: ' +
    leftPlayer.total_score +
    "</p>" +
    "</div>" +
    "<p>" +
    playerNames[leftPlayerOrder].username +
    "</p>" +
    "</div>";
  let displacement = 150 + (13 - leftPlayer.card_count) * 10;
  for (let i = 0; i < leftPlayer.card_count; i++) {
    gameHtml +=
      '<div class= "left-player card-back" style="top: ' +
      displacement +
      "px; z-index: " +
      z +
      ';"></div>';
    z++;
    displacement += 20;
  }
  if (leftPlayer.card_in_play != null) {
    let suit = -getSuit(leftPlayer.card_in_play) * 100;
    let face = -(getCardValue(leftPlayer.card_in_play)) * 69;
    gameHtml +=
      '<div class = "left-player-to-mid card " style="background-position-y: ' +
      suit +
      "px; background-position-x: " +
      face +
      'px" id="' +
      leftPlayer.card_in_play +
      '"></div>';
  }

  gameHtml +=
    '<div class = "right-player-info">' +
    '<div class = "player-score-box">' +
    '<p class = "player-round-score">Score this round: ' +
    rightPlayer.current_round_score +
    "</p>" +
    '<p class = "player-total-score">Total score: ' +
    rightPlayer.total_score +
    "</p>" +
    "</div>" +
    "<p>" +
    playerNames[rightPlayerOrder].username +
    "</p>" +
    "</div>";
  displacement = 390 - (13 - rightPlayer.card_count) * 10;
  for (let i = 0; i < rightPlayer.card_count; i++) {
    gameHtml +=
      '<div class= "right-player card-back" style="top: ' +
      displacement +
      "px; z-index: " +
      z +
      ';"></div>';
    z++;
    displacement -= 20;
  }
  if (rightPlayer.card_in_play != null) {
    let suit = -getSuit(rightPlayer.card_in_play) * 100;
    let face = -(getCardValue(rightPlayer.card_in_play)) * 69;
    gameHtml +=
      '<div class = "right-player-to-mid card " style="background-position-y: ' +
      suit +
      "px; background-position-x: " +
      face +
      'px" id="' +
      rightPlayer.card_in_play +
      '"></div>';
  }

  board.innerHTML = gameHtml;
}

function selectCard(id) {
  const div = document.getElementById(id);
  div.style.top = "440px";
}

function resetCard(id) {
  const div = document.getElementById(id);
  div.style.top = "480px";
}

function selectSingleCard(id) {
  const alertBox = document.getElementsByClassName("alert-box")[0];
  if (selectedSingle != "0") {
    if (selectedSingleCard == id) {
      resetCard(selectedSingleCard);
      selectedSingleCard = "0";
      selectedSingle = false;
    } else {
      resetCard(selectedSingleCard);
      selectedSingleCard = id;
      selectCard(id);
    }
  } else {
    selectedSingleCard = id;
    selectCard(id);
    selectedSingle = true;
  }
  let btn = document.getElementById("single-button");
  if (selectedSingle && !gameOver) {
    buttonDisableLogic(); //btn.disabled = false;
  } else {
    alertBox.innerHTML = "";
    btn.disabled = true;
  }
}

function passBid() {
  console.log("Passing on bid");
  let bid_msg = document.getElementById("bid-msg");
  bid_msg.innerHTML +=
      "<p><strong>" + username + ": </strong> PASSED.</p>";
}

function buttonDisableLogic() {
  const alertBox = document.getElementsByClassName("alert-box")[0];

  let selectedCard = parseInt(selectedSingleCard);
  let selectedSuit = getSuit(selectedCard);

  let btn = document.getElementById("single-button");

  let handSizeTotal =
    parseInt(topPlayer.card_count) + parseInt(bottomPlayer.card_count);
  if (numPlayers == 4) {
    handSizeTotal +=
      parseInt(leftPlayer.card_count) + parseInt(rightPlayer.card_count);
  }

  let leadCard = 0;

  if (numPlayers == 4) {
    if (rightPlayer.card_in_play != null) {
      leadCard = parseInt(rightPlayer.card_in_play);
    }
    if (topPlayer.card_in_play != null) {
      leadCard = parseInt(topPlayer.card_in_play);
    }
    if (leftPlayer.card_in_play != null) {
      leadCard = parseInt(leftPlayer.card_in_play);
    }
  } else {
    if (topPlayer.card_in_play != null) {
      leadCard = parseInt(topPlayer.card_in_play);
    }
  }

  if (leadCard != 0 && getSuit(leadCard) != selectedSuit) {
    let leadSuit = getSuit(leadCard);
    let playableCard = false;
    for (let i = 0; i < playersCards.length; i++) {
      	if (leadSuit == getSuit(playersCards[i].card_id)) {
        	playableCard = true;
      	}
    }
    if (playableCard) {
      	alertBox.innerHTML = "<p>Your card must match the leading suit.</p>";
      	btn.disabled = true;
    } else {
      	alertBox.innerHTML = "";
      	btn.disabled = false;
    }
  } else {
  	alertBox.innerHTML = "";
    btn.disabled = false;
  }
}

function playButton() {
  //send one card to the server
  gameSocket.emit("PLAY CARDS", {
    user_id: user_id,
    game_id: game_id,
    passed_card: selectedSingleCard
  });

  resetCard(selectedSingleCard);
  selectedSingleCard = "0";
  selectedSingle = false;
  let btn = document.getElementById("single-button");
  btn.disabled = true;
}

function nudgeButton() {
  let btn = document.getElementById("nudge-button");
  btn.disabled = true;

  let nudgedNote =
      "<b>(System)</b> " +
      currentPlayer +
      " has been nudged and has 30 seconds to play a card or they will forfeit!";

  chatSocket.emit("NUDGE NOTIFICATION", {
    room_id: room.value,
    nudged_player: nudgedNote
  });

  let timer = setTimeout(nudgeFinal, 30000);

  gameSocket.emit("NUDGE NOTIFICATION", {
    room_id: room.value,
    nudge_timer: timer
  });
}

gameSocket.on("CANCEL NUDGE", timer => {
  clearTimeout(timer);
});

function nudgeFinal() {
  gameSocket.emit("NUDGE TIMER OVER", {
    game_id: game_id,
    nudged_player: currentPlayer
  });
}
