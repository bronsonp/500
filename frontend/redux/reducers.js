import { combineReducers } from 'redux';
import { createReducer } from '@reduxjs/toolkit'

import gameInfoReducer from './gameInfoSlice'

export default combineReducers({
  gameInfo: gameInfoReducer
})
