import { combineReducers } from 'redux';

import gameReducer from './game'
import gameLogReducer from './gameLog'

export default combineReducers({
  game: gameReducer,
  gameLog: gameLogReducer,
})
