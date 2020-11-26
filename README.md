# TwentyEight Game
Rishikesh Madabhushi

based on version of Hearts by:
Rohan Patel, Jake Carter, Richard Robinson, Guanming Pan
https://github.com/rohan8594/Hearts-Game/

## Introduction

This is a real-time, multiplayer, online application to play the card game TwentyEight. The game supports 2 and 4 player game rooms.

## Features
Nothing really works yet, but the basic skeleton exists:
  - Need to add trump support
  - scoring
  - fixing bugs

- Registration (with encrypted passwords)
- Login / Logout (with sessions)
- Lobby page: contains a lobby chat, list of current games, options to create a game, join an already made game that is not full, observe a game, and rejoin a game.
- The application supports an arbitrary (infinite) number of concurrent games, and a given player can participate in multiple games (in different tabs).
- Game rooms have their own dedicated game chats.
- Game rooms also allow users to join in as observers to just watch the ongoing game.
- Game rooms also contain a nudge button that ends the game on a 30 second timer if no action is taken by an opposing player.
- Game state is persisted in the database. If a user closes a tab, and reconnects to the game, the game will be reloaded for that user.
- Game state is updated in real time in response to user events and interaction with the game using Socket.IO
- All the logic of the standard hearts game has been implemented and tested.

## How to compile and run

### Prerequisites

- Node.js installed
- PostgreSQL installed
- In Postgres, create a database `DATABASE_NAME`

### Clone repo

```
$ git clone https://github.com/rishikesh-madabhushi/TwentyEight.git
$ cd TwentyEight
```

### Create a .env file

```
$ touch .env
$ echo DATABASE_URL=postgres://`whoami`@localhost:5432/DATABASE_NAME >> .env
```

### Command line instructions

```
$ npm install
$ npm run db:migrate
$ npm run start:dev
```

The app will then be running locally, and can be accessed at:

`localhost:3000`

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):



<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!