import { createSlice } from '@reduxjs/toolkit'

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
    },
    reducers: {
        setGameState: (state, action) => {
            Object.assign(state, action.payload);

            // if we received this message, we are connected
            state.connected = true;
            
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
        }
    }
})

export const { 
    setGameState,
    setGameDisconnected,
    addCardToPreview,
    removeCardFromPreview,
    acknowledgePreviousTrick
} = gameStateSlice.actions
  
export default gameStateSlice.reducer
