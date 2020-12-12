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
	    // Stage to PLAY
	    Game.setGameStage(game_id, "PLAY")
	    let res = await Promise.all[
		Game.setGameStage(game_id, "PLAY"),
		Game.getStartingPlayer(game_id)];
	    next_player = res[1];
    	} else if (bid != -1) {
	    res = await Game.updateBid(user_id, game_id, bid);
	}
	Game.setCurrentPlayer(next_player, game_id).
	    then(() => { return update(game_id); });
    });


    socket.on("PLAY CARDS", data => {
	let { user_id, game_id, passed_card: card_played } = data;
	card_played = parseInt(card_played);

	if (nudge_timer != undefined) {
	    gameSocket.emit("CANCEL NUDGE", nudge_timer);
	}

	Game.getGamePlayers(game_id).then(gamePlayers => {
	    Game.getTurnSequenceForPlayer(user_id, game_id).then(turnQuery => {
		let turnSequence = turnQuery[0].turn_sequence;

		Game.getCurrentTurnId(game_id).then(results => {
		    if (results[0].current_player != user_id) return;
		    Game.retrieveOwnedCard(user_id, game_id, card_played).then(
			results => {
			    if (results.length === 0) return;
			    Game.getLeadingSuit(game_id).then(results => {
				let lead_suit = results[0].leading_suit;
				if (lead_suit == null) {
				    Game.setLeadingSuit(
					game_id,
					Game.getSuit(card_played));
				}
			    });

              setTimeout(() => {
                Game.addPlayedCard(user_id, game_id, card_played).then(() => {
                  update(game_id).then(() => {
                    Game.getCardsInPlayCount(game_id).then(results => {
                      let numberOfPlayedCards = results[0].count;

                      if (numberOfPlayedCards == gamePlayers.length) {
                        Game.allocatePointsForTurn(game_id).then(
                          winning_player => {
                            Game.getCardsLeft(game_id).then(results => {
                              let cardsLeft = results[0].cards_left;

                              if (cardsLeft == 0) {
                                // Display Winner of round
                                // Big delay and then deal cards again for next round
                                Game.updateTotalScores(game_id).then(() => {
                                  Game.getMaximumScore(game_id).then(
                                    results => {
                                      let maximumScore =
                                        results[0].maximum_score;
                                      if (maximumScore >= 100) {
                                        update(game_id);
                                        setTimeout(() => {
                                          gameSocket
                                            .to(game_id)
                                            .emit("GAME OVER", {
                                              game_id: game_id
                                            });
                                          Game.deleteGame(game_id);
                                        }, 500);
                                      } else {
                                        Game.incrementRoundNumber(game_id).then(
                                          () => {
                                            Game.setCurrentPlayer(
                                              null,
                                              game_id
                                            ).then(() => {
                                              setTimeout(() => {
                                                Game.dealCards(game_id);
                                                setTimeout(() => {
                                                  Game.getUserNamesFromGame(
                                                    game_id
                                                  ).then(game_players => {
                                                    gameSocket
                                                      .to(game_id)
                                                      .emit("LOAD PLAYERS", {
                                                        game_players: game_players
                                                      });
                                                    setTimeout(() => {
                                                      update(game_id);
                                                    }, 500);
                                                  });
                                                }, 500);
                                              }, 2000);
                                            });
                                          }
                                        );
                                      }
                                    }
                                  );
                                });
                              } else {
                                Game.setCurrentPlayer(
                                  winning_player,
                                  game_id
                                ).then(() => {
                                  setTimeout(() => {
                                    return update(game_id);
                                  }, 3000);
                                });
                              }
                            });
                          }
                        );
                      } else {
                        let next_player = turnSequence % gamePlayers.length;

                        Game.setCurrentPlayer(
                          gamePlayers[next_player].user_id,
                          game_id
                        ).then(() => {
                          setTimeout(() => {
                            return update(game_id);
                          }, 100);
                        });
                      }
                    });
                  });
                });
              }, 100);
            }
          );
        });
      });
    });
  });
});

// game logic related functions

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

const update = game_id => {
    let game_stage;
    Game.getGameStage(game_id).
	then(results =>
	     {game_stage = results[0].game_stage;});
    let max_bid;
    return Game.getTopBid(game_id).
	then(results =>
	     {max_bid = results.winning_bid;}).then(() => {
		 Game.getSharedInformation(game_id).
	then(shared_player_information => {
	    for (let index = 0; index < shared_player_information.length;
		 index++) {
		Game.getHandSize(
		    shared_player_information[index].username,
		    game_id).then(results => {
			shared_player_information[index]["card_count"] =
			    results.card_count;
		    });
	    }
	    setTimeout(() => {
		return Game.getCurrentTurn(game_id).then(turn_information => {
		    gameSocket.to(game_id).emit("UPDATE", {
			shared_player_information: shared_player_information,
			turn_information: turn_information,
			game_stage: game_stage,
			max_bid: max_bid
		    });
		    return Promise.resolve(shared_player_information);
		});
	    }, 100);
	})
	     });
};

const startGame = game_id => {
    starting_player = Game.getStartingPlayer(game_id)
    Game.setCurrentPlayer(starting_player, game_id).then(() => {
        return update(game_id);
    });
};

module.exports = {
    router,
    update
};
