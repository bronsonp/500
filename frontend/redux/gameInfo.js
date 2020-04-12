import { createSlice } from '@reduxjs/toolkit'
import { CardData } from '../api/game'

const gameInfoSlice = createSlice({
    name: 'gameInfo',
    initialState: {
        gameID: undefined,
        playerID: undefined,
        playerNames: [],
        teamNames: [],
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
        }
    }
})
  
export const { setGameID, setPlayerID, setPlayerNames } = gameInfoSlice.actions
  
export default gameInfoSlice.reducer
