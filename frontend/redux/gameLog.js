import { createSlice } from '@reduxjs/toolkit'

const gameLogSlice = createSlice({
    name: 'gameLog',
    initialState: [],
    reducers: {
        addToLog: (state, action) => {
            action.payload.forEach(l => state.push(l));
            // TODO - remove cards played in previous tricks
        }
    }
})
  
export const { addToLog } = gameLogSlice.actions
  
export default gameLogSlice.reducer
