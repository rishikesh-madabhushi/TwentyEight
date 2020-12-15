const express = require("express");
const router = express.Router();
const isAuthenticated = require("../config/passport/isAuthenticated");
const io = require("../sockets");
const gameSocket = io.of("/game");
const Game = require("../db/game");

let user;
let game_id;
let nudge_timer;

router.get("/", isAuthenticated, (req, res, next) => {
  res.render("game", { title: "TwentyEight Game" });
});

router.get("/:game_id", isAuthenticated, (req, res) => {
  user = req.user;
  game_id = req.params.game_id;
  Game.checkGameExists(game_id).then(results => {
    if (results === undefined || results.length === 0) {
      res.redirect("/");
    } else {
      res.render("game", {
        user: user,
        game_id: game_id,
        title: "Game room " + game_id
      });
    }
  });
});

gameSocket.on("connection", socket => {
    if (game_id == null) {
	return;
    }
    socket.join(game_id);
    checkGameReady(game_id).then(results => {
	if (results === true) {
	    return prepareCards(game_id).then(() => {
		return Game.getUserNamesFromGame(game_id).then(username => {
		    gameSocket.to(game_id)
			.emit("LOAD PLAYERS", { game_players: username });

		    setTimeout(() => { return startGame(game_id);}, 500);
		});
	    });
	} else {
	    return Game.getUserNamesFromGame(game_id).then(username => {
		gameSocket.to(game_id).emit("LOAD PLAYERS",
					    { game_players: username });
		setTimeout(() => {
		    Game.maxPlayers(game_id).then(results => {
			const max_players = results[0].max_players;
			return Game.getPlayerCount(game_id)
			    .then(player_count => {
				if (player_count == max_players) {
				    return update(game_id);
				}
			    });
		    });
		}, 500);
	    });
	}
    });

    // game events
    socket.on("NUDGE NOTIFICATION", data => {
	nudge_timer = data.nudge_timer;
    });

    function sortCards(a, b) {
	var asuit = Game.getSuit(a.card_id);
	var bsuit = Game.getSuit(b.card_id);
	if (asuit != bsuit) {
	    return asuit - bsuit;
	}
	acard = Game.getCardValue(a.card_id);
	bcard = Game.getCardValue(b.card_id);
	return acard - bcard;
    };

    socket.on("GET PLAYER HAND", data => {
	const { user_id, game_id } = data;

	Game.getPlayerCards(user_id, game_id).then(player_hand => {
	    socket.emit("SEND PLAYER HAND",
			{ player_hand: player_hand.sort(sortCards)});
	});
    });

    socket.on("NUDGE TIMER OVER", data => {
	const game_id = data.game_id;
	const nudged_player = data.nudged_player;

	Game.getCurrentTurn(game_id).then(current_player => {
	    if (current_player.current_player == nudged_player) {
          Game.getUserId(nudged_player).then(current_player_id => {
              Game.giveTotalPointsToPlayer(
		  game_id,
		  current_player_id.user_id,
		  100
              ).then(() => {
		  update(game_id);
		  setTimeout(() => {
                      gameSocket.to(game_id).emit("GAME OVER",
						  { game_id: game_id });
                      Game.deleteGame(game_id);
		  }, 500);
              });
          });
	    }
	});
    });
  
    socket.on("MAKE BID", async data => {
	const { user_id, game_id, bid } = data;
	gamePlayers = await Game.getGamePlayers(game_id);

	turnQuery = await Game.getTurnSequenceForPlayer(user_id, game_id);
	let turnSequence = turnQuery[0].turn_sequence;
	const next_player_no = turnSequence % gamePlayers.length;
	let next_player = gamePlayers[next_player_no].user_id;

	results = await Game.getTopBid(game_id);
	let max_bidder = results.winning_bidder;
	if (bid == -1 && max_bidder == next_player) {
	    // We have done a full round of passes. Set the Game
	    // Stage to SET_TRUMP
	    await Game.setGameStage(game_id, "SET_TRUMP");
    	} else if (bid != -1) {
	    res = await Game.updateBid(user_id, game_id, bid);
	}
	Game.setCurrentPlayer(next_player, game_id).
	    then(() => { return update(game_id); });
    });

    socket.on("SET TRUMP", async data => {
	const { suit, game_id } = data
	console.log(suit)
	// TODO: Check that the user has cards of that suit

	await Promise.all([Game.setGameStage(game_id, "PLAY"),
			   Game.setTrumpSuit(game_id, suit)])
	return update(game_id);
    })

    socket.on("PLAY CARDS", async data => {
	let { user_id, game_id, passed_card: card_played } = data;
	card_played = parseInt(card_played);

	if (nudge_timer != undefined) {
	    gameSocket.emit("CANCEL NUDGE", nudge_timer);
	}

	let gamePlayers, currentPlayer;
	[gamePlayers, currentPlayer] = await Promise.all([
	    Game.getGamePlayers(game_id),
	    Game.getCurrentTurnId(game_id)]);

	if (currentPlayer != user_id) {
	    console.log("Played hand user not the same as current player");
	    return;
	}
        await Game.addPlayedCard(user_id, game_id, card_played);
	await update(game_id)

	promises = [];

	numberOfPlayedCards = await Game.getCardsInPlayCount(game_id);
	if (numberOfPlayedCards == 1) {
	    // First card has been played.
	    promises.push(Game.setLeadingSuit(game_id,
					      Game.getSuit(card_played)));
	}

	if (numberOfPlayedCards == gamePlayers.length) {
	    // Hand over
	    // Add a delay
	    await new Promise((resolve) => setTimeout(resolve, 3000));

	    let winning_player = await Game.allocatePointsForTurn(game_id);
            let cardsLeft = await Game.getCardsLeft(game_id);

            if (cardsLeft == 0) {
                // Display Winner of round
		// TODO: Need correct logic for TwentyEight
                promises.push(
		    Game.updateTotalScores(game_id).then(() => {
			resetGame(game_id, gamePlayers)
		    }));
	    } else {
                promises.push(Game.setCurrentPlayer(winning_player, game_id));
	    }
        } else {
	    next_user = getNextPlayer(user_id, gamePlayers);
	    promises.push(Game.setCurrentPlayer(next_user, game_id));
	}
	update(game_id).then(setTimeout(() => {
	    Promise.all(promises).then(() => {
		update(game_id) }); 
	}, 3000));
    })
});

// game logic related functions


function getNextPlayer(user_id, gamePlayers) {
    let next_index = 0;
    for (i = 0; i < gamePlayers.length; i++) {
	if (gamePlayers[i].user_id == user_id) {
	    next_index = i + 1;
	    if (next_index == gamePlayers.length) {
		next_index = 0;
	    }
	    break;
	}
    }
    return gamePlayers[next_index].user_id;
}

// Checks to see if the game needs to be set up. Returns true if so, which
// is a little confusing.
const checkGameReady = game_id => {
  return Game.checkGameStateExists(game_id).then(exists => {
    if (exists === false) {
      return Game.maxPlayers(game_id)
        .then(results => {
          const max_players = results[0].max_players;

          return Game.getPlayerCount(game_id).then(player_count => {
            // check if game room is full to start game
            return Promise.resolve(player_count == max_players);
          });
        })
        .catch(error => {
          console.log(error);
        });
    }
  });
};

const prepareCards = game_id => {
  return Game.initializeUserGameCards(game_id).then(() => {
    Game.dealCards(game_id);
    return Promise.resolve(game_id);
  });
};

async function update(game_id) {
    let game_stage; 
    let bid_state;
    let shared_player_info;
    [game_stage, bid_state, shared_player_info] = await Promise.all(
	[Game.getGameStage(game_id), Game.getTopBid(game_id),
	 Game.getSharedInformation(game_id)])
    var handsizeRequests = [];
    shared_player_info.forEach(spi => {
	handsizeRequests.push(
	    Game.getHandSize(spi.username, game_id).
		then(results => {
		    spi["card_count"] = results.card_count;
		}));
    });
    await Promise.all(handsizeRequests);
    return Game.getCurrentTurn(game_id).then(turn_information => {
	gameSocket.to(game_id).emit("UPDATE", {
	    shared_player_information: shared_player_info,
	    turn_information: turn_information,
	    game_stage: game_stage,
	    max_bid: bid_state.winning_bid
	});
    });
};


async function resetGame(game_id, gamePlayers) {
    let starting_player = await Game.getStartingPlayer(game_id);
    next_user = getNextPlayer(starting_player, gamePlayers);
    // Set starting player.
    await Promise.all[Game.dealCards(game_id),
		      Game.incrementRoundNumber(game_id),
		      Game.setStartingPlayer(game_id, next_user)];

    let game_players = await Game.getUserNamesFromGame(game_id);
    
    gameSocket.to(game_id).emit("LOAD PLAYERS", {
        game_players: game_players
    });
};


async function startGame(game_id) {
    return update(game_id);
};

module.exports = {
    router,
    update
};
