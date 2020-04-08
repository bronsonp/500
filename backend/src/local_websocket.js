// hardcode
process.env.AWS_REGION = "ap-southeast-2"
process.env.GAMES_TABLE = "500_games"
process.env.CONNECTIONS_TABLE = "500_connections"
process.env.WEBSOCKET_ENDPOINT = 'st9ayyxbo0.execute-api.ap-southeast-2.amazonaws.com/Prod'
process.env.MOCK_WEBSOCKETS = "1"


var handlers = require('./handlers');
var Database = require('./database')

var event = 
    {
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
          "connectionId": "KgEFtdtjSwMCGGg=",
          "apiId": "st9ayyxbo0"
        },
        "body": JSON.stringify({
            "message": "action",
            "action": "register",
            "gameID": "ae83b2b7-c409-47f3-8e0c-fe5ce8d41040",
            "playerID": 2
        }),
        "isBase64Encoded": false
};

handlers.onWebsocketAction(event)
.then(r => console.log(r));
