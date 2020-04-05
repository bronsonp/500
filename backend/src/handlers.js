var AWS = require("aws-sdk");
var Game = require('./game');

AWS.config.update({
    region: process.env.AWS_REGION
});

var docClient = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});

function makeResponse(statusCode, message) {
    return {
        'statusCode': statusCode,
        'body': JSON.stringify({
            'message': message
        })
    }
}

exports.allowCORS = async(event, context) => {
    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': '*',
            'Access-Control-Allow-Headers': '*'
        }
    }
}

exports.startGame = async (event, context) => {
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
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': '*',
                'Access-Control-Allow-Headers': '*'
            }
        }
    } catch (error) {
        return makeResponse(400, error);
    }
};

exports.getGameInfo = async (event, context) => {
    try {
        const response = await docClient.get({
            TableName: process.env.GAMES_TABLE,
            Key: {'gameID': event.pathParameters.gameID}
        }).promise();

        if (!response.hasOwnProperty('Item')) {
            return {
                'statusCode': 404,
                'body': JSON.stringify({
                    'message': 'Invalid gameID'
                }),
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': '*',
                    'Access-Control-Allow-Headers': '*'
                }
            }
        }

        const game = response.Item;
        
        return {
            'statusCode': 200,
            'body': JSON.stringify({
                'playerNames': game.playerNames
            }),
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': '*',
                'Access-Control-Allow-Headers': '*'
            }
        }
    } catch (error) {
        return {
            'statusCode': 400,
            'body': JSON.stringify({
                'message': 'Unable to communicate with server',
                'response': error
            }),
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': '*',
                'Access-Control-Allow-Headers': '*'
            }
        }
    }

}

exports.onConnect = async (event) => {
    const putParams = {
      TableName: process.env.CONNECTIONS_TABLE,
      Item: {
        connectionId: event.requestContext.connectionId,
      }
    };

    console.log(event);
  
    // try {
    //   await ddb.put(putParams).promise();
    // } catch (err) {
    //   return { statusCode: 500, body: 'Failed to connect: ' + JSON.stringify(err) };
    // }
  
    return { statusCode: 200, body: 'Connected.' };
  };
  
