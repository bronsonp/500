import { combineReducers } from 'redux';

import gameInfoReducer from './gameInfo'
import gameStateReducer from './gameState'
import gameLogReducer from './gameLog'

export default combineReducers({
  gameInfo: gameInfoReducer,
  gameState: gameStateReducer,
  gameLog: gameLogReducer,
})
