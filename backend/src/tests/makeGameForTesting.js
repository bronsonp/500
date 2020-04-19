const assert = require('assert').strict;

// hardcode
process.env.AWS_REGION = "ap-southeast-2"
process.env.GAMES_TABLE = "500_games"
process.env.CONNECTIONS_TABLE = "500_connections"
process.env.WEBSOCKET_ENDPOINT = 'st9ayyxbo0.execute-api.ap-southeast-2.amazonaws.com/Prod'

var Game = require('../game');
var Database = require('../database');

// create a game
var g = Game.startGame(["P1", "P2", "P3", "P4", "P5", "P6"]);
g.gameID = "test";
Database.saveGame(g)
.then(() => console.log("ok"))
.catch(e => console.error(e))
