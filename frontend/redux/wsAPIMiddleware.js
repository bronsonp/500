import { send } from '@giantmachines/redux-websocket';

import { addToLog } from './gameLog';
import { setGameState, setGameDisconnected, setError } from './gameState';

const wsAPIMiddleware = (store) => (next) => (action) => {
    switch(action.type) {
        case 'gameInfo/setPlayerID':
        case 'REDUX_WEBSOCKET::RECONNECTED':
            // process the action first 
            next(action);
            
            // if we have both a playerID and a gameID, register with the server
            var newState = store.getState();
            if (typeof newState.gameInfo.playerID != 'undefined' && typeof newState.gameInfo.gameID != 'undefined') {
                store.dispatch(send({
                    "message": "action",
                    "action": "register",
                    "gameID": newState.gameInfo.gameID,
                    "playerID": newState.gameInfo.playerID
                }))
            }

            break;

        case 'REDUX_WEBSOCKET::CLOSED':
            // process the action first 
            next(action);
            
            // dispatch that we are not connected
            store.dispatch(setGameDisconnected());
            break;

        case 'REDUX_WEBSOCKET::MESSAGE':
            // process the action
            next(action);

            // parse the payload sent by the server
            const data = JSON.parse(action.payload.message);
            // console.log("Incoming websocket message:");
            // console.log(data);
            
            // Are there log messages?
            if (data.hasOwnProperty('log') && data.log.length > 0) {
                store.dispatch(addToLog(data.log));
            }

            // Handle each type of message that we expect
            if (data.action == "gameUpdate") {
                store.dispatch(setGameState(data.gameStatus));
            } else if (data.action == "gameActionResponse") {
                if (!data.accepted) {
                    store.dispatch(setError(data.message));
                }
            } else if (data.action == "error") {
                store.dispatch(setError(data.message));
                // todo, for now just put into the log
                store.dispatch(addToLog([data]));
            } 

            break;

        default:
            // process the action
            next(action);
    }
  }
   
  export default wsAPIMiddleware;
  