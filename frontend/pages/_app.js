/**
 * Application class that connects to the redux store. It is used to render all pages.
 */

// Library imports
import App from 'next/app'
import { Provider } from "react-redux";

// load the global CSS
import 'bootstrap/dist/css/bootstrap.min.css'
import './global.css'

// Our store of application state
import store from '../redux/store.js'

class MyApp extends App {
    render() {
        const { Component, pageProps } = this.props
        return (
            <Provider store={store}>
                <Component {...pageProps} />
            </Provider>
        )
    }
}

export default MyApp
