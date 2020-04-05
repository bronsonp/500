//export const createGameURL = "http://localhost:3001/start";
export const createGameURL = "https://v85fk86gxa.execute-api.ap-southeast-2.amazonaws.com/Prod/start";

export function getGameInfoURL(gameID) {
    // return "http://localhost:3001/game/" + gameID;
    return "https://v85fk86gxa.execute-api.ap-southeast-2.amazonaws.com/Prod/game/" + gameID;
}
