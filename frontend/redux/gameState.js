import { createSlice } from '@reduxjs/toolkit'
import { CardData } from '../api/game';

const gameStateSlice = createSlice({
    name: 'gameState',
    initialState: {
        actionPreview: [],
        numberOfCardsInHand: [],
        yourHand: [],
        playersConnected: [],
        trumps: "",
        trick: [],
        trickID: -1,
        trickIDAcknowledged: -1,
        tricksWon: [],
        previousTrick: [],
        previousTrickPlayedBy: [],
        lastError: "",
        scoreboard: [],
        teamScores: [],
    },
    reducers: {
        setGameState: (state, action) => {
            Object.assign(state, action.payload);

            // if we received this message, we are connected
            state.connected = true;

            // clear any error message
            state.lastError = "";
            
            // are all players connected?
            state.allPlayersConnected = state.playersConnected.every(x => x);

            // delete anything in the action preview 
            // TODO should not do this if it's still our turn
            state.actionPreview = [];

            // if we have been refreshed into a game in progress, detect whether
            // waiting to acknowledge the previous trick is reasonable.
            if (state.trickIDAcknowledged == -1) {
                // if it's not the first trick in the game and no cards have been played yet, 
                // show the previous trick.
                if (state.trick.length == 0 && state.tricksWon.reduce((a,b) => a+b, 0) > 0) {
                    state.trickIDAcknowledged = state.trickID - 1;
                } else {
                    state.trickIDAcknowledged = state.trickID;
                }
            }

            // update the scoreboard
            state.teamScores = (state.playerNames.length == 4) ? [0,0] : [0,0,0];
            state.scoreboard.forEach(entry => {
                entry.teamScores.forEach((score, teamID) => state.teamScores[teamID] += score);
            })
        },
        setGameDisconnected: (state, action) => {
            state.connected = false;
        },
        addCardToPreview: (state, action) => {
            state.actionPreview.push(action.payload)
        },
        removeCardFromPreview: (state, action) => {
            state.actionPreview = state.actionPreview.filter(c => c != action.payload);
        },
        acknowledgePreviousTrick: (state, action) => {
            state.trickIDAcknowledged = state.trickID;
        },
        setError: (state, action) => {
            state.lastError = action.payload;
        }
    }
})

export const { 
    setGameState,
    setGameDisconnected,
    addCardToPreview,
    removeCardFromPreview,
    acknowledgePreviousTrick,
    setError
} = gameStateSlice.actions
  
export default gameStateSlice.reducer
