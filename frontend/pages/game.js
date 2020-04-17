/**
 * Render the game display.
 *
 * This is basically a shell that just loads either the start game form.
 *
 */

import React from "react";
import { connect } from "react-redux";
import axios from "axios";

// Components
import MainLayout from '../components/Layout';
import ChoosePlayerForm from '../components/ChoosePlayerForm';
import Game from '../components/Game';

// Internal API
import { setGameID, setPlayerNames } from "../redux/game";
import { getGameInfoURL } from "../api/endpoints";

function LinkBack(props) {
    if (props.enabled) {
        return (
            <div className="alert alert-primary">
                <a href="/">Click here</a> to start a new game.
            </div>
        );
    } else {
        return null;
    }
}

function Warning(props) {
    if (props.message.length > 0) {
        return (
            <div className="alert alert-warning">
                { props.message }
            </div>
        );
    } else {
        return null;
    }
}

class GamePage extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            showLinkBack: false,
            warning: ""
        }
        this.axiosCancelToken = undefined;
    }

    componentDidMount() {
        // look for a gameID in the URL
        const matches = RegExp('ID=([A-Za-z0-9\-]+)').exec(window.location.search);
        if (matches) {
            // found one
            const gameID = matches[1];
            this.props.setGameID(gameID);

            // query the player names
            this.axiosCancelToken = axios.CancelToken.source();
            axios.get(getGameInfoURL(gameID), {
                cancelToken: this.axiosCancelToken.token
            })
            .then(response => {
                this.axiosCancelToken = undefined;
                if (response.status == 200) {
                    // TODO implement this setter
                    this.props.setPlayerNames(response.data.playerNames);
                } else {
                    this.setState({warning: "Cannot find that game.", showLinkBack: true});
                }
            })
            .catch(error => {
                if (axios.isCancel(error)) {
                    // request was cancelled, do nothing
                    return;
                }
                this.setState({warning: "Cannot find that game: " + error, showLinkBack: true});
            })

        } else {
            // no game ID; give the user a link back to the home page
            this.setState({showLinkBack: true});
        }
    }

    componentWillUnmount() {
        if (this.axiosCancelToken !== undefined) {
            this.axiosCancelToken.cancel(); 
            this.axiosCancelToken = undefined;
        }
    }

    render() {
        const canShowGame = typeof this.props.playerID !== 'undefined'
            && typeof this.props.playerNames !== 'undefined';
        return (
            <MainLayout>
                <Warning message={this.state.warning} />
                <LinkBack enabled={this.state.showLinkBack} />

                {
                    (canShowGame) ? <Game /> : <ChoosePlayerForm />
                }

            </MainLayout>
        );
    }
}

function mapStateToProps(state) {
    return {
        playerID: state.game.playerID,
        playerNames: state.game.playerNames
    }
}

export default connect(
    mapStateToProps,
    {setGameID, setPlayerNames}
)(GamePage)
