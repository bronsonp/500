// hardcode
process.env.AWS_REGION = "ap-southeast-2"
process.env.GAMES_TABLE = "500_games"
process.env.CONNECTIONS_TABLE = "500_connections"

Database = require('../database');
Game = require('../game');

async function loadAndPrint(gameID) {
    var g = await Database.loadGame(gameID);
    console.log(JSON.stringify(Game.serialiseGame(g)));
}

loadAndPrint("06990682-e58f-4059-94e6-fe182f135250")
.then(()=>console.log("ok"))
.catch((e)=>console.error(e))

