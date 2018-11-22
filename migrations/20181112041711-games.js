'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
      return queryInterface.createTable(
          'games',
          {
              game_id: {
                  type: Sequelize.INTEGER,
                  primaryKey: true,
                  autoIncrement: true
              },
              max_players: {
                  type: Sequelize.INTEGER,
                  allowNull: false,
              },
              current_player: {
                  type: Sequelize.INTEGER,
                  allowNull: false,
                  references: {
                      model: 'users',
                      key: 'user_id'
                  }
              },
              game_name: {
                  type: Sequelize.STRING,
                  allowNull: false
              }
          }
      );
  },

  down: (queryInterface, Sequelize) => {
      return queryInterface.dropTable('games');
  }
};