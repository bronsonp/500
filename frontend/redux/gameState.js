import { createSlice } from '@reduxjs/toolkit'

const gameStateSlice = createSlice({
    name: 'gameState',
    initialState: {
        actionPreview: [],
        numberOfCardsInHand: [],
        yourHand: [],
        playersConnected: [],
        trumps: "",
    },
    reducers: {
        setGameState: (state, action) => {
            Object.assign(state, action.payload);

            // if we received this message, we are connected
            state.connected = true;
            
            // are all players connected?
            state.allPlayersConnected = state.playersConnected.every(x => x);

            // delete anything in the action preview
            state.actionPreview = [];
        },
        setGameDisconnected: (state, action) => {
            state.connected = false;
        },
        addCardToPreview: (state, action) => {
            state.actionPreview.push(action.payload)
        },
        removeCardFromPreview: (state, action) => {
            state.actionPreview = state.actionPreview.filter(c => c != action.payload);
        }
    }
})

export const { setGameState, setGameDisconnected, addCardToPreview, removeCardFromPreview } = gameStateSlice.actions
  
export default gameStateSlice.reducer
