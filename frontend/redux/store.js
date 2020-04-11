/**
 * Generates the redux store for application state
 */

import { createStore, applyMiddleware, compose } from "redux";
import reduxWebsocket from '@giantmachines/redux-websocket';
import rootReducer from "./reducers";
import wsAPIMiddleware from './wsAPIMiddleware';

// Create the middleware
const reduxWebsocketMiddleware = reduxWebsocket({
    reconnectOnClose: true,
    reconnectInterval: 2000
});


// Create the Redux store.
var enhancers = [applyMiddleware(
    reduxWebsocketMiddleware,
    wsAPIMiddleware
)];
if (typeof window !== 'undefined' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) {
    enhancers.push(window.__REDUX_DEVTOOLS_EXTENSION__());
}

export default createStore(
    rootReducer, 
    undefined,
    compose(...enhancers)
);
