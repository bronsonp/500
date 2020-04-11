import { createSlice } from '@reduxjs/toolkit'

const gameInfoSlice = createSlice({
    name: 'gameInfo',
    initialState: {
        gameID: undefined,
        playerID: undefined,
        playerNames: []
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
        }
    }
})
  
export const { setGameID, setPlayerID, setPlayerNames } = gameInfoSlice.actions
  
export default gameInfoSlice.reducer
