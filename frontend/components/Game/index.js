import React from 'react';
import { connect } from "react-redux";

import { websocketURL } from '../../api/endpoints';

class Game extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            "socketState": "connecting"
        }
    }

    render() {
        return <p>Game here</p>;
    }

    openWebSocket() {
        // connect to the websocket
        this.websocket = new WebSocket(websocketURL);
        this.websocket.onmessage = (event) => {
            this.onWebsocketMessage(event);
        }
        this.websocket.onopen = (event) => {
            this.setState({socketState: "connected"});
            // register us to the websocket
            this.websocket.send(JSON.stringify({
                "message": "action",
                "action": "register",
                "gameID": this.props.gameID,
                "playerID": this.props.playerID
            }))
        }
        this.websocket.onclose = (event) => {
            this.setState({socketState: "connecting"});
            setInterval(() => this.openWebSocket, 500);
        }
    }

    componentDidMount() {
        this.openWebSocket();
    }

    componentWillUnmount() {
        // disconnect 
        this.websocket.close();
    }

    onWebsocketMessage(event) {
        console.log(event);
    }

}

function mapStateToProps(state) {
    return {
        playerID: state.gameInfo.playerID,
        playerNames: state.gameInfo.playerNames,
        gameID: state.gameInfo.gameID
    }
}

export default connect(
    mapStateToProps,
    {}
)(Game)

