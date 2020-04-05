/**
 * Generates the redux store for application state
 */

import { createStore } from "redux";
import rootReducer from "./reducers";

const debugHook = (typeof window !== 'undefined' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ && window.__REDUX_DEVTOOLS_EXTENSION__()) || undefined
export default createStore(rootReducer, undefined, debugHook);
