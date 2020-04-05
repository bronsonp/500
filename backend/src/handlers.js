var AWS = require("aws-sdk");
var Game = require('./game');

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
        'headers': makeCORSheader(event)
    }
}

exports.startGame = async (event, context) => {

    function makeResponse(statusCode, message) {
        return {
            'statusCode': statusCode,
            'body': JSON.stringify({
                'message': message
            }),
            'headers': makeCORSheader(event)
        }
    }

    // Parse input
    var body;
    var response;
    try {
        body = JSON.parse(event.body);
    } catch (err) {
        return makeResponse(400, 'Unable to parse JSON payload');
    }
    // Check for players
    if (!body.hasOwnProperty('players')) {
        return makeResponse(400, 'Expected `players` field');
    }

    try {
        // Create a game
        let g = Game.startGame(body.players);

        // Save it to DynamoDB
        const response = await docClient.put({
            TableName: process.env.GAMES_TABLE,
            Item: g.toDocument()
        }).promise();

        // prepare return data
        let payload = {
            "gameID": g.gameID
        }

        return {
            'statusCode': 200,
            'body': JSON.stringify(payload),
            'headers': makeCORSheader(event)
        }
    } catch (error) {
        return makeResponse(400, error);
    }
};

exports.getGameInfo = async (event, context) => {
    try {
        // Get the game record from the database
        const response = await docClient.get({
            TableName: process.env.GAMES_TABLE,
            Key: {'gameID': event.pathParameters.gameID}
        }).promise();

        // Check if it was found in the database
        if (!response.hasOwnProperty('Item')) {
            return {
                'statusCode': 404,
                'body': JSON.stringify({
                    'message': 'Invalid gameID'
                }),
                'headers': makeCORSheader(event)
            }
        }

        // Return the player names
        return {
            'statusCode': 200,
            'body': JSON.stringify({
                'playerNames': response.Item.playerNames
            }),
            'headers': makeCORSheader(event)
        }
    } catch (error) {
        return {
            'statusCode': 400,
            'body': JSON.stringify({
                'message': 'Unable to communicate with server',
                'response': error
            }),
            'headers': makeCORSheader(event)
        }
    }
}

exports.onWebsocketConnect = async (event) => {
    const putParams = {
      TableName: process.env.CONNECTIONS_TABLE,
      Item: {
        connectionId: event.requestContext.connectionId,
      }
    };

    try {
      await docClient.put(putParams).promise();
    } catch (err) {
        console.log('Failed to store connection: ' + JSON.stringify(err) )
      return { statusCode: 500, body: 'Failed to connect: ' + JSON.stringify(err) };
    }
  
    return { statusCode: 200, body: 'Connected.' };
};
  
exports.onWebsocketDisconnect = async (event) => {
    const deleteParams = {
        TableName: process.env.CONNECTIONS_TABLE,
        Key: {
          connectionId: event.requestContext.connectionId
        }
      };
    
      try {
        await docClient.delete(deleteParams).promise();
      } catch (err) {
        return { statusCode: 500, body: 'Failed to disconnect: ' + JSON.stringify(err) };
      }
    
      return { statusCode: 200, body: 'Disconnected.' };
}

exports.onWebsocketAction = async (event) => {
    let connectionData;
    
    try {
        connectionData = await docClient.scan({ TableName: process.env.CONNECTIONS_TABLE, ProjectionExpression: 'connectionId' }).promise();
    } catch (e) {
        console.log('Failed to read database.' + JSON.stringify(e));
        return { statusCode: 500, body: e.stack };
    }
    
    const apigwManagementApi = new AWS.ApiGatewayManagementApi({
        apiVersion: '2018-11-29',
        endpoint: event.requestContext.domainName + '/' + event.requestContext.stage
    });
    
    const postData = JSON.parse(event.body).data;
    
    const postCalls = connectionData.Items.map(async ({ connectionId }) => {

        try {
            await apigwManagementApi.postToConnection({ ConnectionId: connectionId, Data: postData }).promise();
        } catch (e) {
            if (e.statusCode === 410) {
                console.log(`Found stale connection, deleting ${connectionId}`);
                await docClient.delete({ TableName: CONNECTIONS_TABLE, Key: { connectionId } }).promise();
            } else {
                console.log('Failed to send to connections. ' + JSON.stringify(e));
                throw e;
            }
        }
    });
    
    try {
        await Promise.all(postCalls);
    } catch (e) {
        console.log('Failed to resolve promises.' + JSON.stringify(e));
        return { statusCode: 500, body: e.stack };
    }
    
    return { statusCode: 200, body: 'Data sent.' };
};
