var AWS = require("aws-sdk");
var Game = require('./game');
var Database = require('./database');

AWS.config.update({
    region: process.env.AWS_REGION
});

var docClient = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});

function makeCORSheader(event) {
    // todo 
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': '*',
        'Access-Control-Allow-Headers': '*'
    }
}

exports.allowCORS = async(event, context) => {
    return {
        'statusCode': 200,
        'headers': makeCORSheader(event),
    }
}

exports.startGame = async (event, context) => {
    // Start a new game
    try {
        var body = JSON.parse(event.body);
        if (!body.hasOwnProperty('players')) {
            throw Error("Expected `players` field");
        }

         // Create a game and save it
         let g = Game.startGame(body.players);
         await Database.saveGame(g);

         // Done 
         return {
            'statusCode': 200,
            'body': JSON.stringify({
                'success': true,
                'gameID': g.gameID
            }),
            'headers': makeCORSheader(event)
         }
    } catch (error) {
        return {
            'statusCode': 400,
            'body': JSON.stringify({
                'success': false,
                'message': 'Invalid request' + error
            }),
            'headers': makeCORSheader(event)
        }
    }
};

exports.getGameInfo = async (event, context) => {
    try {
        // Get the game record from the database
        var g = await Database.loadGame(event.pathParameters.gameID);

        // Get the game info
        return {
            'statusCode': 200,
            'body': JSON.stringify({
                'success': true,
                'playerNames': g.playerNames
            }),
            'headers': makeCORSheader(event)
        }
    } catch (error) {
        return {
            'statusCode': 400,
            'body': JSON.stringify({
                'success': false,
                'message': 'Invalid request. ' + error
            }),
            'headers': makeCORSheader(event)
        }
    }
}

exports.onWebsocketConnect = async (event) => {
    // OK, allow connection 
    return { statusCode: 200, body: 'Connected.' };
};
  
exports.onWebsocketDisconnect = async (event) => {
    // set the websocket endpoint
    Database.apigwManagementApi.endpoint = event.requestContext.domainName + '/' + event.requestContext.stage;

    // Remove entries from database
    try {
        await Database.unregisterWebsocketToGame(event.requestContext.connectionId);
    } catch(e) {
        console.log("Failed to disconnect: " + e);
    }
    
    return { statusCode: 200, body: 'Disconnected.' };
}

exports.onWebsocketAction = async (event) => {
    // Example contents of the `event` param, since this seems to be poorly documented by AWS
    // {
    //     "requestContext": {
    //       "routeKey": "action",
    //       "messageId": "Kf2dGd9lywMCEng=",
    //       "eventType": "MESSAGE",
    //       "extendedRequestId": "Kf2dGGnuywMFdFA=",
    //       "requestTime": "05/Apr/2020:05:20:58 +0000",
    //       "messageDirection": "IN",
    //       "stage": "Prod",
    //       "connectedAt": 1586064048999,
    //       "requestTimeEpoch": 1586064058165,
    //       "identity": {
    //         "cognitoIdentityPoolId": null,
    //         "cognitoIdentityId": null,
    //         "principalOrgId": null,
    //         "cognitoAuthenticationType": null,
    //         "userArn": null,
    //         "userAgent": null,
    //         "accountId": null,
    //         "caller": null,
    //         "sourceIp": "122.109.158.61",
    //         "accessKey": null,
    //         "cognitoAuthenticationProvider": null,
    //         "user": null
    //       },
    //       "requestId": "Kf2dGGnuywMFdFA=",
    //       "domainName": "st9ayyxbo0.execute-api.ap-southeast-2.amazonaws.com",
    //       "connectionId": "Kf2bqd9WywMCEng=",
    //       "apiId": "st9ayyxbo0"
    //     },
    //     "body": "{\"message\": \"action\"}",
    //     "isBase64Encoded": false
    //   }

    // set the websocket endpoint
    Database.apigwManagementApi.endpoint = event.requestContext.domainName + '/' + event.requestContext.stage;

    let connectionId = event.requestContext.connectionId;
    
    try {
        
        // Parse the input
        let body = JSON.parse(event.body);

        // Handle registrations
        if (body.action == "register") {
            // Expect incoming data of the form:
            // {
            //     message: "action", // necessary for API Gateway routing
            //     action: "register",
            //     gameID: "xxx",
            //     playerID: 123
            // }
            await Database.registerWebsocketToGame(connectionId, body.gameID, body.playerID);
            return { statusCode: 200, body: "OK" };
        }

        // Other actions go to the game engine
        var gameID = await Database.getGameIDFromConnectionId(connectionId);
        var gameResponse;
        await Database.safeGameUpdate(gameID, game => {
            // find player ID
            var playerID = game.websockets.indexOf(connectionId);
            if (playerID == -1) {
                gameResponse = {
                    action: "error",
                    message: "Request failed: you are not registered to this game."
                }
                return { modified: false };
            }

            // run the game action
            gameResponse = game.processPlayerAction(playerID, body);
            if (gameResponse.accepted) {
                return {
                    modified: true,
                    log: gameResponse.log
                }
            } else {
                return {
                    modified: false
                }
            }
        })

        // Respond to the web socket
        await Database.sendToConnectedWebsocket(event, gameResponse);

        return { statusCode: 200, body: "OK" };
    } catch (error) {
        // Notify the connected client

        try {
            await Database.sendToConnectedWebsocket(event, {
                action: "error",
                message: "Request failed: " + error
            });
        } catch (e) {
            // ignore
        }

        console.log(error);
        return { statusCode: 500, body: "Request failed: " + error };
    }
    
};
