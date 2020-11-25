const db = require("../../db");

const {
  CREATE_GAME_QUERY,
  CREATE_GAME_PLAYER_QUERY,
  GET_CURRENT_GAMES_QUERY,
  CHECK_GAME_QUERY,
  CHECK_GAME_EXISTS_QUERY,
  PLAYER_COUNT_QUERY,
  OBSERVE_GAME_QUERY,
  JOIN_GAME_QUERY,
  DELETE_GAME_QUERY,
  VERIFY_IN_GAME_QUERY,
  MAX_PLAYERS_QUERY,
  INIT_CARDS_QUERY,
  GET_USERS_QUERY,
  GET_CARDS_QUERY,
  SET_CARD_OWNER_QUERY,
  CHECK_GAME_STATE_QUERY,
  SORT_BY_TURN_QUERY,
  SHARED_INFO_QUERY,
  GET_HAND_SIZE_QUERY,
  JOIN_CARDS_IN_PLAY_QUERY,
  GET_GAME_PLAYERS_QUERY,
  GET_PLAYER_CARDS_QUERY,
  TURN_QUERY,
  GET_CURRENT_TURN_QUERY,
  GET_CARD_QUERY,
  GET_USER_GAME_CARD_QUERY,
  GET_CURRENT_RND_SCORE,
  SET_CURRENT_PLAYER_QUERY,
  GET_STARTING_PLAYER_QUERY,
  PLAY_CARD_QUERY,
  GET_PLAYER_TURN_SEQUENCE,
  CARDS_LEFT_QUERY,
  CARDS_IN_PLAY_QUERY,
  UPDATE_CARDS_IN_PLAY_QUERY,
  UPDATE_POINTS,
  CARDS_COUNT_QUERY,
  GET_LEAD_SUIT_QUERY,
  SET_LEAD_SUIT_QUERY,
  GET_ROUND_SCORES,
  UPDATE_SCORES_QUERY,
  UPDATE_SCORES_QUERY2,
  INCREMENT_ROUND_QUERY,
  GET_USER_ID,
  NUDGE_QUERY,
  TOTAL_POINTS_QUERY,
  GET_MAX_SCORE_QUERY,
  RESET_POINTS_QUERY,
  VERIFY_PLAYER_QUERY
} = require("./queries");

const createGame = (max_players, user_id, game_name) => {
  return db.query(CREATE_GAME_QUERY, [max_players, game_name, 1]);
};

const createInitialGamePlayer = (user_id, game_id) => {
  return db.none(CREATE_GAME_PLAYER_QUERY, [user_id, game_id, 0, 0, 1]);
};

const getCurrentGames = () => {
  return db.query(GET_CURRENT_GAMES_QUERY);
};

const checkGameExists = game_id => {
  return db.query(CHECK_GAME_EXISTS_QUERY, [game_id]);
};

const getPlayerCount = game_id => {
  return db
    .query(PLAYER_COUNT_QUERY, [game_id])
    .then(results => {
      return results[0].player_count;
    })
    .catch(error => {
      console.log(error);
    });
};

const observeGame = (user_id, game_id) => {
  return db.none(OBSERVE_GAME_QUERY, [user_id, game_id]);
};

const joinGame = (user_id, game_id) => {
  getPlayerCount(game_id)
    .then(player_count => {
      return db.none(JOIN_GAME_QUERY, [
        user_id,
        game_id,
        0,
        0,
        parseInt(player_count) + 1
      ]);
    })
    .catch(error => {
      console.log(error);
    });
};

const deleteGame = game_id => {
  return db.none(DELETE_GAME_QUERY, [game_id]);
};

const verifyInGame = (user_id, game_id) => {
  return db
    .query(VERIFY_IN_GAME_QUERY, [user_id, game_id])
    .then(results => {
      return results[0].in_game;
    })
    .catch(error => {
      console.log(error);
    });
};

const maxPlayers = game_id => {
  return db.query(MAX_PLAYERS_QUERY, [game_id]);
};

const initializeUserGameCards = game_id => {
  return db.none(INIT_CARDS_QUERY, [game_id]);
};

const getUserNamesFromGame = game_id => {
  return db.query(GET_USERS_QUERY, [game_id]);
};

const getAllCardsFromGame = game_id => {
  return db.query(GET_CARDS_QUERY, [game_id]);
};

const dealCards = game_id => {
  const player_array = [];
  getUserIDSortedByTurnSequence(game_id).then(results => {
    let number_players = results.length;
    for (index = 0; index < results.length; index++) {
      player_array.push(results[index].user_id);
    }
    getAllCardsFromGame(game_id).then(results => {
      let index;
      const cardsLeft = [];

      for (index = 0; index < results.length; index++) {
        cardsLeft.push(results[index].card_id);
      }

      for (index = 0; index < results.length; index++) {
        let randomValue = Math.floor(Math.random() * cardsLeft.length);
        let card_assigned = cardsLeft[randomValue];
        cardsLeft.splice(randomValue, 1);
        setOwnerOfCard(
          card_assigned,
          player_array[index % number_players],
          game_id
        );
      }
    });
  });
};

const setOwnerOfCard = (card_id, user_id, game_id) => {
  return db.none(SET_CARD_OWNER_QUERY, [user_id, card_id, game_id]);
};

const checkGameStateExists = game_id => {
  return db
    .query(CHECK_GAME_STATE_QUERY, [game_id])
    .then(results => {
      return !(results === undefined || results.length === 0);
    })
    .catch(error => {
      console.log(error);
    });
};

const getUserIDSortedByTurnSequence = game_id => {
  return db.query(SORT_BY_TURN_QUERY, [game_id]);
};

const getSharedInformation = game_id => {
  return db.query(SHARED_INFO_QUERY, [game_id]);
};

const getHandSize = (username, game_id) => {
  return db.one(GET_HAND_SIZE_QUERY, [username, game_id]);
};

const joinCardsInPlay = (user_id, game_id) => {
  return db.none(JOIN_CARDS_IN_PLAY_QUERY, [user_id, game_id]);
};

const getGamePlayers = game_id => {
  return db.query(GET_GAME_PLAYERS_QUERY, [game_id]);
};

const getPlayerCards = (user_id, game_id) => {
  return db.query(GET_PLAYER_CARDS_QUERY, [user_id, game_id]);
};

const getCurrentTurn = game_id => {
  return db
    .query(TURN_QUERY, [game_id])
    .then(results => {
      if (results.length == 0) {
        return Promise.resolve({ current_player: null });
      } else {
        return results;
      }
    })
    .catch(error => {
      console.log(error);
    });
};

const getCurrentTurnId = game_id => {
  return db.query(GET_CURRENT_TURN_QUERY, [game_id]);
};

const retrieveOwnedCard = (user_id, game_id, card_id) => {
  return db.one(GET_CARD_QUERY, [card_id, user_id, game_id]);
};

const verifyUserHasCards = (user_id, game_id, [card1, card2, card3]) => {
  return db
    .query(GET_USER_GAME_CARD_QUERY, [user_id, game_id, card1])
    .then(results => {
      if (results === undefined || results.length === 0) return false;
      else {
        return db
          .query(GET_USER_GAME_CARD_QUERY, [user_id, game_id, card2])
          .then(results => {
            if (results === undefined || results.length === 0) return false;
            else {
              return db
                .query(GET_USER_GAME_CARD_QUERY, [user_id, game_id, card3])
                .then(results => {
                  if (results === undefined || results.length === 0)
                    return false;
                  else return true;
                })
                .catch(error => {
                  console.log(error);
                });
            }
          })
          .catch(error => {
            console.log(error);
          });
      }
    })
    .catch(error => {
      console.log(error);
    });
};

const getCurrentRoundNumber = game_id => {
  return db.query(GET_CURRENT_RND_SCORE, [game_id]);
};

const setCurrentPlayer = (user_id, game_id) => {
  return db.none(SET_CURRENT_PLAYER_QUERY, [user_id, game_id]);
};

const getStartingPlayer = game_id => {
  return db.query(GET_STARTING_PLAYER_QUERY, [game_id, 2]);
};

const addPlayedCard = (user_id, game_id, card_id) => {
  return db
    .none(PLAY_CARD_QUERY, [card_id, user_id, game_id])
    .then(() => {
      return setOwnerOfCard(card_id, null, game_id);
    })
    .catch(error => {
      console.log(error);
    });
};

const getTurnSequenceForPlayer = (user_id, game_id) => {
  return db.query(GET_PLAYER_TURN_SEQUENCE, [user_id, game_id]);
};

const getCardsLeft = game_id => {
  return db.query(CARDS_LEFT_QUERY, [game_id]);
};

const getCardsInPlay = game_id => {
  return db.query(CARDS_IN_PLAY_QUERY, [game_id]);
};

//0 Club
//1 Diamond
//2 Heart
//3 Spade
const checkPlayerTakingCards = game_id => {
  //get cards
  return getCardsInPlay(game_id).then(cardsInPlay => {
    return getLeadingSuit(game_id).then(results => {
      let lead_suit = results[0].leading_suit;

      let max_value = 0;
      let player_taking_hand;
      let points_on_table = 0;

      for (let index = 0; index < cardsInPlay.length; index++) {
        let current_card = cardsInPlay[index].card_id;
        let current_suit = getSuit(current_card);
        let card_val = (current_card - 1) % 8;
        if (card_val === 0) {
          value = 1.5; // Ace
        } else if (card_val === 5) {
          value = 3; // Jack
        } else if (card_val === 4) {
          value = 1; // Ten
        } else if (card_val === 3) {
          value = 2; // Nine
        } else if (card_val === 7) {
          value = 0.5; // King
        } else if (card_val === 6) {
          value = 0.4; // Queen
        } else if (card_val === 2) {
          value = 0.3; // Eight
        } else if (card_val === 1) {
          value = 0.2; // Seven
        }
        points_on_table += Math.floor(value);
              
        if (current_suit == lead_suit) {
          if (value > max_value) {
            max_value = value;
            player_taking_hand = cardsInPlay[index].user_id;
          }
        }
      }
      return Promise.resolve([
        {
          player_taking_hand: player_taking_hand,
          points_on_table: points_on_table
        }
      ]);
    });
  });
};

const allocatePointsForTurn = game_id => {
  return checkPlayerTakingCards(game_id).then(results => {
    let points_on_table = results[0].points_on_table;
    let player_taking_hand = results[0].player_taking_hand;
    return givePointsToPlayer(
      game_id,
      player_taking_hand,
      points_on_table
    ).then(() => {
      return db.none(UPDATE_CARDS_IN_PLAY_QUERY, [game_id]).then(() => {
        return setLeadingSuit(game_id, null).then(() => {
          return Promise.resolve(player_taking_hand);
        });
      });
    });
  });
};

const givePointsToPlayer = (game_id, user_id, points) => {
  return db.none(UPDATE_POINTS, [points, game_id, user_id]);
};

const getCardsInPlayCount = game_id => {
  return db.query(CARDS_COUNT_QUERY, [game_id]);
};

const getLeadingSuit = game_id => {
  return db.query(GET_LEAD_SUIT_QUERY, [game_id]);
};

const setLeadingSuit = (game_id, lead_suit) => {
  return db.none(SET_LEAD_SUIT_QUERY, [lead_suit, game_id]);
};

const updateTotalScores = game_id => {
  return db.query(GET_ROUND_SCORES, [game_id]).then(player_scores => {
    let player_who_shot_the_moon;

    for (let i = 0; i < player_scores.length; i++) {
      let { user_id, current_round_score } = player_scores[i];
      if (current_round_score == 26) {
        player_who_shot_the_moon = user_id;
        break;
      }
    }

    if (player_who_shot_the_moon === undefined) {
      return db.none(UPDATE_SCORES_QUERY, [game_id]).then(() => {
        return resetRoundScore(game_id);
      });
    } else {
      for (let i = 0; i < player_scores.length; i++) {
        let { user_id } = player_scores[i];

        if (user_id != player_who_shot_the_moon) {
          return db.none(UPDATE_SCORES_QUERY2, [game_id, user_id]).then(() => {
            return resetRoundScore(game_id);
          });
        }
      }
    }
  });
};

const incrementRoundNumber = game_id => {
  return db.none(INCREMENT_ROUND_QUERY, [game_id]);
};

const getUserId = user_name => {
  return db.one(GET_USER_ID, [user_name]);
};

const nudgePassPhase = game_id => {
  return db.none(NUDGE_QUERY, [game_id]);
};

const giveTotalPointsToPlayer = (game_id, user_id, points) => {
  return db.none(TOTAL_POINTS_QUERY, [points, game_id, user_id]);
};

const getMaximumScore = game_id => {
  return db.query(GET_MAX_SCORE_QUERY, [game_id]);
};

const isGamePlayer = (user_id, game_id) => {
  return db.query(VERIFY_PLAYER_QUERY, [user_id, game_id]);
};

const getSuit = (card) => {
	return Math.floor((card - 1) / 8);
};

const resetRoundScore = game_id => {
  return db.none(RESET_POINTS_QUERY, [game_id]);
};

module.exports = {
  createGame,
  createInitialGamePlayer,
  getCurrentGames,
  observeGame,
  joinGame,
  deleteGame,
  verifyInGame,
  getPlayerCards,
  getUserNamesFromGame,
  dealCards,
  initializeUserGameCards,
  getPlayerCount,
  maxPlayers,
  getGamePlayers,
  checkGameStateExists,
  getSharedInformation,
  joinCardsInPlay,
  getCurrentTurn,
  setOwnerOfCard,
  getCurrentTurnId,
  retrieveOwnedCard,
  verifyUserHasCards,
  getCurrentRoundNumber,
  setCurrentPlayer,
  getStartingPlayer,
  addPlayedCard,
  getTurnSequenceForPlayer,
  getCardsLeft,
  allocatePointsForTurn,
  getCardsInPlayCount,
  getLeadingSuit,
  setLeadingSuit,
  updateTotalScores,
  incrementRoundNumber,
  getUserId,
  nudgePassPhase,
  giveTotalPointsToPlayer,
  getHandSize,
  getMaximumScore,
  checkGameExists,
  isGamePlayer,
  getSuit
};
