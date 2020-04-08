const assert = require('assert').strict;

// hardcode
process.env.AWS_REGION = "ap-southeast-2"
process.env.GAMES_TABLE = "500_games"
process.env.CONNECTIONS_TABLE = "500_connections"
process.env.WEBSOCKET_ENDPOINT = 'st9ayyxbo0.execute-api.ap-southeast-2.amazonaws.com/Prod'
process.env.MOCK_WEBSOCKET = "1"

var Game = require('../game');
var Database = require('../database');
var handlers = require('../handlers');

// mock up the websocket API 
Database.apigwManagementApi = {
    statusCode: 200,
    postToConnection: function(x) {
        var sc = this.statusCode;
        var p = new Promise((resolve, reject) => {
            var {ConnectionId, Data} = x;
            console.log("Mock websocket: To:`" + ConnectionId + "`");
            console.log(JSON.stringify(Data, null, 2));

            if (sc == 200) {
                resolve({statusCode: sc});
            } else {
                reject({statusCode: sc});
            }
        })
        return {
            promise: () => p
        }
    },
}

var mockEvent = {
    "requestContext": {
        "routeKey": "action",
        "messageId": "Kf2dGd9lywMCEng=",
        "eventType": "MESSAGE",
        "extendedRequestId": "Kf2dGGnuywMFdFA=",
        "requestTime": "05/Apr/2020:05:20:58 +0000",
        "messageDirection": "IN",
        "stage": "Prod",
        "connectedAt": 1586064048999,
        "requestTimeEpoch": 1586064058165,
        "identity": {
            "cognitoIdentityPoolId": null,
            "cognitoIdentityId": null,
            "principalOrgId": null,
            "cognitoAuthenticationType": null,
            "userArn": null,
            "userAgent": null,
            "accountId": null,
            "caller": null,
            "sourceIp": "122.109.158.61",
            "accessKey": null,
            "cognitoAuthenticationProvider": null,
            "user": null
        },
        "requestId": "Kf2dGGnuywMFdFA=",
        "domainName": "st9ayyxbo0.execute-api.ap-southeast-2.amazonaws.com",
        "connectionId": "Kf2bqd9WywMCEng=",
        "apiId": "st9ayyxbo0"
    },
    "body": "", // to be filled in below
    "isBase64Encoded": false
}


async function testWebsockets() {
    // create a game
    var g = Game.startGame(["P1", "P2", "P3", "P4"]);
    await Database.saveGame(g);
    console.log("Created game: " + g.gameID);

    // connect a client (mock web socket)
    mockEvent.requestContext.connectionId = 'Mock_WS_0';
    mockEvent.body = "";
    await handlers.onWebsocketConnect(mockEvent);

    // register a game 
    mockEvent.body = JSON.stringify({
        "message": "action",
        "action": "register",
        "gameID": g.gameID,
        "playerID": 0
    })
    await handlers.onWebsocketAction(mockEvent);
    
    // connect another
    mockEvent.requestContext.connectionId = 'Mock_WS_1';
    mockEvent.body = "";
    await handlers.onWebsocketConnect(mockEvent);

    // register a game 
    mockEvent.body = JSON.stringify({
        "message": "action",
        "action": "register",
        "gameID": g.gameID,
        "playerID": 1
    })
    await handlers.onWebsocketAction(mockEvent);

    // check the registration
    var returnedGameID = await Database.getGameIDFromConnectionId(mockEvent.requestContext.connectionId);
    assert(returnedGameID == g.gameID);

    // disconnect the first one
    mockEvent.requestContext.connectionId = 'Mock_WS_0';
    mockEvent.body = "";
    await handlers.onWebsocketDisconnect(mockEvent);

    // pretend websockets are dropped
    Database.apigwManagementApi.statusCode = 410
    // register a game 
    mockEvent.body = JSON.stringify({
        "message": "action",
        "action": "register",
        "gameID": g.gameID,
        "playerID": 0
    })
    await handlers.onWebsocketAction(mockEvent);

    // delete it
    await Database.deleteGame(g.gameID);
    console.log("Deleted game");
}


// For interactive debugging
testWebsockets()
.then(() => console.log("done"))
.catch(console.error);

