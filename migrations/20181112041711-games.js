"use strict";

module.exports = {
    up: (queryInterface, Sequelize) => {
	return queryInterface.createTable("games", {
	    game_id: {
		type: Sequelize.INTEGER,
		primaryKey: true,
		autoIncrement: true
	    },
	    max_players: {
		type: Sequelize.INTEGER,
		allowNull: false
	    },
	    starting_player: {
		type: Sequelize.INTEGER,
		allowNull: true,
		defaultValue: null,
		references: {
		    model: "users",
		    key: "user_id"
		}
	    },
	    current_player: {
		type: Sequelize.INTEGER,
		allowNull: true,
		defaultValue: null,
		references: {
		    model: "users",
		    key: "user_id"
		}
	    },
	    winning_bid: {
	        type: Sequelize.INTEGER,
		defaultValue: 0,
	    },
	    winning_bidder: {
	        type: Sequelize.INTEGER,
		allowNull: true,
		defaultValue: null,
		references: {
		    model: "users",
		    key: "user_id"
		}
	    },
	    game_name: {
		type: Sequelize.STRING,
		allowNull: false
	    },
	    round_number: {
		type: Sequelize.INTEGER,
		allowNull: true
	    },
	    leading_suit: {
		type: Sequelize.INTEGER,
		defaultValue: null
	    },
	    trump_suit: {
		type: Sequelize.INTEGER,
		defaultValue: null
	    },
	    trump_shown: {
		type: Sequelize.BOOLEAN,
		defaultValue: null
	    },
	    game_stage: {
		type: Sequelize.STRING,
		allowNull: false,
		defaultValue: "BIDDING"
	    }
	});
    },

    down: (queryInterface, Sequelize) => {
      return queryInterface.dropTable("games");
    }
};
