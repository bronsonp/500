var AWS = require("aws-sdk");

var Game = require('../game');

AWS.config.update({
    region: process.env.AWS_REGION
});

var docClient = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});

// stored in exports so that it can be mocked up in test scripts
exports.apigwManagementApi = new AWS.ApiGatewayManagementApi({
    apiVersion: '2018-11-29'
});

// Load a game from the database
exports.loadGame = async function (gameID) {
    var response = await docClient.get({
        TableName: process.env.GAMES_TABLE,
        Key: {'gameID': gameID}
    }).promise();

    // Check if this game was found
    if (!response.hasOwnProperty('Item')) {
        throw Error("No such GameID");
    }

    // Create game instance
    return Game.deserialiseGame(response.Item);
}

// Save a game to the database
exports.saveGame = async function (game) {
    await docClient.put({
        TableName: process.env.GAMES_TABLE,
        Item: game.toDocument()
    }).promise();
}

// Delete a game
exports.deleteGame = async function (gameID) {
    await docClient.delete({
        TableName: process.env.GAMES_TABLE,
        Key: {"gameID": gameID}
    }).promise();
}

// Load a game, call the update function, then save. The updateFunction returns
// an object:
//    {
//        modified: true/false, // if the game was modified
//        log: [{..}]  // status info that gets sent to clients 
//    }
// If `modified` is true, then the game state will be saved to the database.
//
// If there was a concurrent update (by another thread), safely reject the
// contradicting update at the database. In that case, reload the game and
// re-run the update function. Therefore the update function must be free of
// side effects.
//
// If there was an update and the parameter broadcastUpdate is true, broadcast
// game state to all connected players.
//
// Returns true if there was a change to the game state, or false otherwise.
exports.safeGameUpdate = async function (gameID, updateFunction, broadcastUpdate=true) {
    // Try 3 times
    for (var i = 0; i < 3; i++) {
        var g = await exports.loadGame(gameID);
        var {modified, log} = updateFunction(g);
        if (!modified) {
            // no update, we are done
            return false;
        }

        // otherwise, increment version number
        var oldVersion = g.version;
        g.version += 1;

        // attempt to save to the database
        try {
            await docClient.put({
                TableName: process.env.GAMES_TABLE,
                Item: g.toDocument(),
                ConditionExpression: "version = :v",
                ExpressionAttributeValues:{
                    ":v": oldVersion
                },
            })
            .promise();

            // send an update to connected players
            if (broadcastUpdate) {
                // Prepare a message for all PlayerID values
                var promises = g.websockets
                    .map((connectionId, playerID) => [connectionId, playerID])
                    .filter(([connectionId, playerID]) => connectionId != '-')
                    .map(async ([connectionId, playerID]) => {
                        try {
                            await exports.apigwManagementApi.postToConnection({
                                ConnectionId: connectionId,
                                Data: JSON.stringify({
                                    "action": "gameUpdate",
                                    "gameStatus": g.getGameStatus(playerID),
                                    "log": log
                                })
                            }).promise()
                        } catch (e) {
                            if (e.statusCode === 410) {
                                // websocket is disconnected
                                console.log("Removing stale connection: " + connectionId);
                                await exports.unregisterWebsocketToGame(connectionId, g.gameID);
                            } else {
                                // some other error
                                throw(e);
                            }
                        }
                    })
                await Promise.all(promises)
            }
            
            // done
            return true;
        } catch (e) {
            if (e.code == 'ConditionalCheckFailedException') {
                // retry the update
                continue;
            } else {
                // some other error, abort
                throw e;
            }
        }
    }
    throw Error('Unable to commit update.');
}

exports.sendToConnectedWebsocket = async function (event, payload) {
    // post the message
    await exports.apigwManagementApi.postToConnection({
        ConnectionId: event.requestContext.connectionId,
        Data: JSON.stringify(payload)
    }).promise()
}

exports.registerWebsocketToGame = async function (connectionId, gameID, playerID) {
    async function doRegistrationWithChecks(connectionId, gameID, playerID) {
        // Try game update; will throw if the player is already connected

        await exports.safeGameUpdate(gameID, (g) => {
            // Check that this connectionId is not already used
            if (g.websockets.indexOf(connectionId) != -1) {
                throw Error('You are already registered. Cannot register twice.');
            }

            // Check that this playerID is not already taken
            if (g.websockets[playerID] != '-') {
                // This player is already connected.
                var e = new Error('This player is already connected. Simultaneous connections are prohibited.')
                e.name = 'PlayerAlreadyConnectedError';
                e.otherWebsocket = g.websockets[playerID];
                throw e;
            }

            // Register the connection
            g.websockets[playerID] = connectionId;

            // Commit to database
            return {
                modified: true,
                log: [{
                    playerID,
                    action: "connected"
                }]
            };
        })
    }

    // Do the game update to register the user
    try {
        await doRegistrationWithChecks(connectionId, gameID, playerID);
    } catch (e1) {
        var otherSocketStillAlive = false;
        if (e1.name == 'PlayerAlreadyConnectedError') {
            // Check whether the previous socket is still live
            try {
                await exports.apigwManagementApi.postToConnection({
                    ConnectionId: e1.otherWebsocket,
                    Data: JSON.stringify({
                        "action": "keepAlive"
                    })
                }).promise()

                // Player is still here
                otherSocketStillAlive = true;
            } catch (e2) {
                if (e2.statusCode === 410) {
                    // Previous websocket was disconnected
                    console.log("Removing stale connection: " + e1.otherWebsocket);
                    
                    // Delete old socket from connections table 
                    await exports.unregisterWebsocketToGame(e1.otherWebsocket, gameID);

                    // Try again
                    await doRegistrationWithChecks(connectionId, gameID, playerID);
                } else {
                    // some other error
                    throw(e2);
                }
            }

            if (otherSocketStillAlive) {
                throw e1;
            }
        } else {
            // some other error, pass it on
            throw e1;
        }
    }

    // Store in the connections table too
    await docClient.put({
        TableName: process.env.CONNECTIONS_TABLE,
        Item: {
          connectionId: connectionId,
          gameID: gameID
        }
    }).promise();
}

exports.getGameIDFromConnectionId = async function (connectionId) {
    var response = await docClient.get({
        TableName: process.env.CONNECTIONS_TABLE,
        Key: {'connectionId': connectionId}
    }).promise();

    // Check if this connection was found
    if (!response.hasOwnProperty('Item')) {
        throw Error("Invalid connectionId");
    }

    // Else done 
    return response.Item.gameID;
}

exports.unregisterWebsocketToGame = async function (connectionId, gameID) {
    // Find the game ID if needed
    if (typeof gameID == 'undefined') {
        var response = await docClient.get({
            TableName: process.env.CONNECTIONS_TABLE,
            Key: {'connectionId': connectionId}
        }).promise();

        // Check if this connection was found
        if (!response.hasOwnProperty('Item')) {
            // Not in the database .. just ignore (could be a disconnect before registration)
            return {
                modified: false
            };
        }
        gameID = response.Item.gameID;
    }

    // Remove it from the game
    await exports.safeGameUpdate(gameID, (g) => {
        // find the playerID
        var playerID = g.websockets.indexOf(connectionId);
        if (playerID == -1) {
            // player was not registered here, just ignore
            return {
                modified: false
            }
        }

        // disconnect them
        g.websockets[playerID] = '-';
        return {
            modified: true,
            log: [{
                playerID: playerID,
                action: "disconnected"
            }]
        };
    });

    // Delete from connections table 
    await docClient.delete({
        TableName: process.env.CONNECTIONS_TABLE,
        Key: {"connectionId": connectionId}
    }).promise();
}

