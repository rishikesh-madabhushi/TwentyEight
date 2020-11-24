"use strict";

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.bulkInsert(
      "cards",
      [
        { card_id: 1, card_value: 14, card_suit: "Clubs" },
        { card_id: 2, card_value: 7, card_suit: "Clubs" },
        { card_id: 3, card_value: 8, card_suit: "Clubs" },
        { card_id: 4, card_value: 9, card_suit: "Clubs" },
        { card_id: 5, card_value: 10, card_suit: "Clubs" },
        { card_id: 6, card_value: 11, card_suit: "Clubs" },
        { card_id: 7, card_value: 12, card_suit: "Clubs" },
        { card_id: 8, card_value: 13, card_suit: "Clubs" },
        { card_id: 9, card_value: 14, card_suit: "Diamonds" },
        { card_id: 10, card_value: 7, card_suit: "Diamonds" },
        { card_id: 11, card_value: 8, card_suit: "Diamonds" },
        { card_id: 12, card_value: 9, card_suit: "Diamonds" },
        { card_id: 13, card_value: 10, card_suit: "Diamonds" },
        { card_id: 14, card_value: 11, card_suit: "Diamonds" },
        { card_id: 15, card_value: 12, card_suit: "Diamonds" },
        { card_id: 16, card_value: 13, card_suit: "Diamonds" },
        { card_id: 17, card_value: 14, card_suit: "Hearts" },
        { card_id: 18, card_value: 7, card_suit: "Hearts" },
        { card_id: 19, card_value: 8, card_suit: "Hearts" },
        { card_id: 20, card_value: 9, card_suit: "Hearts" },
        { card_id: 21, card_value: 10, card_suit: "Hearts" },
        { card_id: 22, card_value: 11, card_suit: "Hearts" },
        { card_id: 23, card_value: 12, card_suit: "Hearts" },
        { card_id: 24, card_value: 13, card_suit: "Hearts" },
        { card_id: 25, card_value: 14, card_suit: "Spades" },
        { card_id: 26, card_value: 7, card_suit: "Spades" },
        { card_id: 27, card_value: 8, card_suit: "Spades" },
        { card_id: 28, card_value: 9, card_suit: "Spades" },
        { card_id: 29, card_value: 10, card_suit: "Spades" },
        { card_id: 30, card_value: 11, card_suit: "Spades" },
        { card_id: 31, card_value: 12, card_suit: "Spades" },
        { card_id: 32, card_value: 13, card_suit: "Spades" }
      ],
      {}
    );
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.bulkDelete("cards", {
      card_id: {
        $in: [
          1,
          2,
          3,
          4,
          5,
          6,
          7,
          8,
          9,
          10,
          11,
          12,
          13,
          14,
          15,
          16,
          17,
          18,
          19,
          20,
          21,
          22,
          23,
          24,
          25,
          26,
          27,
          28,
          29,
          30,
          31,
          32
        ]
      }
    });
  }
};
