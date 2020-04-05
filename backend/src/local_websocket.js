// hardcode
process.env.AWS_REGION = "ap-southeast-2"
process.env.GAMES_TABLE = "500_games"
process.env.CONNECTIONS_TABLE = "500_connections"

var handlers = require('./handlers');

const WebSocket = require('ws');
const url = require('url');

// Create websocket server
const wss = new WebSocket.Server({port: 3001});

// Store the sockets 
var sockets = [];

wss.on('connection', (socket, request) => {
    let gameID = url.parse(request.url).pathname.replace('/', '');
    let socketID = sockets.push(socket) - 1;


    
    socket.on('message', (message) => {
        console.log('received: %s', message);
    })

    socket.on('close', () => {
        console.log('GameID: ')
    })
});

