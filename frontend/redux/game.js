import { createSlice } from '@reduxjs/toolkit'
import { CardData, processPlayerAction } from '../api/game';

const gameSlice = createSlice({
    name: 'game',
    initialState: {
        gameID: undefined,
        playerID: undefined,
        playerNames: [],
        teamNames: [],
        actionPreview: [],
        trickIDAcknowledged: -1,
        lastError: "",
        sendingToServer: false,    
        teamScores: [],
        connected: false,
        allPlayersConnected: false,
        serverState: {
            numberOfCardsInHand: [],
            playersConnected: [],
            trumps: "",
            trick: [],
            trickID: -1,
            tricksWon: [],
            previousTrick: [],
            previousTrickPlayedBy: [],
            scoreboard: [],
            bettingPassed: null,
        }
    },
    reducers: {
        setGameID: (state, action) => {
            state.gameID = action.payload
        },
        setPlayerID: (state, action) => {
            state.playerID = action.payload
        },
        setPlayerNames: (state, action) => {
            state.playerNames = action.payload

            state.teamNames = [];
            for (var teamID = 0; teamID < (state.playerNames.length)/2; teamID++) {
                var names = [];
                for (let [p, t] of Object.entries(CardData[state.playerNames.length].teams)) {
                    if (t == teamID) {
                        names.push(state.playerNames[p]);
                    }
                }
                state.teamNames.push(names);
            }
        },
        setGameState: (state, action) => {
            // Update server state
            state.serverState = action.payload;

            // if we received this message, we are connected
            state.connected = true;

            // we are not waiting on the server 
            state.sendingToServer = false;

            // clear any error message
            state.lastError = "";
            
            // are all players connected?
            state.allPlayersConnected = state.serverState.playersConnected.every(x => x);

            // delete anything in the action preview 
            // TODO should not do this if it's still our turn
            state.actionPreview = [];

            // if we have been refreshed into a game in progress, detect whether
            // waiting to acknowledge the previous trick is reasonable.
            if (state.trickIDAcknowledged == -1) {
                // if it's not the first trick in the game and no cards have been played yet, 
                // show the previous trick.
                if (state.serverState.trick.length == 0 && state.serverState.tricksWon.reduce((a,b) => a+b, 0) > 0) {
                    state.trickIDAcknowledged = state.serverState.trickID - 1;
                } else {
                    state.trickIDAcknowledged = state.serverState.trickID;
                }
            }

            // update the scoreboard
            state.teamScores = (state.serverState.playerNames.length == 4) ? [0,0] : [0,0,0];
            state.serverState.scoreboard.forEach(entry => {
                entry.teamScores.forEach((score, teamID) => state.teamScores[teamID] += score);
            })
        },
        setGameDisconnected: (state, action) => {
            state.connected = false;
        },
        addCardToPreview: (state, action) => {
            state.actionPreview.push(action.payload)
            state.lastError = "";
        },
        removeCardFromPreview: (state, action) => {
            state.actionPreview = state.actionPreview.filter(c => c != action.payload);
            state.lastError = "";
        },
        acknowledgePreviousTrick: (state, action) => {
            state.trickIDAcknowledged = state.serverState.trickID;
        },
        setError: (state, action) => {
            state.lastError = action.payload;
        },
        playerAction: (state, action) => {
            // The network transmission will be handled by the wsAPIMiddleware, so we only
            // need to locally mutate the state.

            // This will modify state.game.serverState
            var response = processPlayerAction(state.serverState, state.playerID, action.payload);
            
            // Handle the response
            if (response.action == "gameActionResponse") {
                if (!response.accepted) {
                    state.lastError = response.message;
                }
            }
            
            // Indicate that we are still waiting on the server response
            state.sendingToServer = true;

            // Clear current state
            state.actionPreview = [];

            // update the scoreboard
            state.teamScores = (state.serverState.playerNames.length == 4) ? [0,0] : [0,0,0];
            state.serverState.scoreboard.forEach(entry => {
                entry.teamScores.forEach((score, teamID) => state.teamScores[teamID] += score);
            })
        }
    }
})

export const { 
    setGameID,
    setPlayerID,
    setPlayerNames,
    setGameState,
    setGameDisconnected,
    addCardToPreview,
    removeCardFromPreview,
    acknowledgePreviousTrick,
    setError,
    playerAction,
} = gameSlice.actions
  
export default gameSlice.reducer
