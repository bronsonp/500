// hardcode
process.env.AWS_REGION = "ap-southeast-2"
process.env.GAMES_TABLE = "500_games"
process.env.CONNECTIONS_TABLE = "500_connections"

Database = require('../database');

async function loadAndPrint(gameID) {
    var g = await Database.loadGame(gameID);
    console.log(JSON.stringify(g.toDocument()));
}

loadAndPrint("a615c09d-9b18-47b2-8563-e3136dc9b8cc")
.then(()=>console.log("ok"))
.catch((e)=>console.error(e))

