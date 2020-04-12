import React from 'react';
import axios from 'axios'

import styles from './startgameform.module.css';
import { createGameURL } from '../../api/endpoints';

class DropdownControl extends React.Component {
    constructor(props) {
        super(props);
        
        this.handleChange = this.handleChange.bind(this);
    }
    
    handleChange(event) {
        this.props.onChange(event.target.value);
    }
    
    render() {
        return (
            <div className="form-group row">
                <label className="col-md-3 col-form-label" htmlFor={this.props.id + "Selector"}>{this.props.label}</label>
                <div className="col-md">
                    <select
                        className="form-control"
                        id={this.props.id + "Selector"}
                        onChange={this.handleChange}
                        value={this.props.value}>
                        {
                            // Render each option
                            this.props.options.map((o,i) => {
                                const label = this.props.optionLabels ? this.props.optionLabels[i] : o;
                                return <option key={o} value={o}>{label}</option>
                            })
                        }
                    </select>
                </div>
            </div>
        );
    }
}

class InputBox extends React.Component {
    constructor(props) {
        super(props);
        
        this.handleChange = this.handleChange.bind(this);
    }
    
    handleChange(event) {
        this.props.onChange(event.target.value);
    }
    
    render() {
        return (
            <div className="form-group row">
                <label className="col-md-3 col-form-label" htmlFor={this.props.id + "Selector"}>{this.props.label}</label>
                <div className="col-md">
                    <input
                        className="form-control"
                        id={this.props.id + "Selector"}
                        onChange={this.handleChange}
                        value={this.props.value}>
                    </input>
                </div>
            </div>
        );
    }
}


class StartGameForm extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            "submitted": false,
            "warning": "",
            "numberOfPlayers": 4,
            "player1": "",
            "player2": "",
            "player3": "",
            "player4": "",
            "player5": "",
            "player6": "",
            "gameID": ""
        }
    }

    updatePlayerName(playerID, name) {
        this.setState({
            ["player" + playerID]: name
        })
    }

    canStartGame() {
        var canStart = 
            (this.state.player1.length > 0)
            && (this.state.player2.length > 0)
            && (this.state.player3.length > 0)
            && (this.state.player4.length > 0);
        if (this.state.numberOfPlayers == 6) {
            canStart = canStart 
            && (this.state.player5.length > 0)
            && (this.state.player6.length > 0);
        }
        return canStart;
    }

    startGameButton(event) {
        event.preventDefault();

        if (!this.canStartGame()) {
            this.setState({warning: "Name all players before starting game"});
            return;
        } else {
            this.setState({warning: ""});
        }

        // Submit to the server (in different order to get the teams set up)
        var players;
        if (this.state.numberOfPlayers == 4) {
            players = [
                this.state.player1,
                this.state.player3,
                this.state.player2,
                this.state.player4
            ];
        } else {
            players = [
                this.state.player1,
                this.state.player3,
                this.state.player5,
                this.state.player2,
                this.state.player4,
                this.state.player6,
            ];
        }
        
        this.setState({submitted: true});
        axios.post(createGameURL, {
            "players": players
        })
        .then(response => {
            if (response.status == 200) {
                this.setState({gameID: response.data.gameID});
            } else {
                this.setState({warning: "Failed to start game: " + JSON.stringify(response)});
            }
            console.log(response);
        })
        .catch(error => {
            this.setState({warning: "Failed to send request: " + error});
        })
    }

    renderNameForm() {
        // The render pathway we use when showing the form

        var teams;
        if (this.state.numberOfPlayers == 4) {
            teams = [[1,2],[3,4]];
        } else {
            teams = [[1,2],[3,4],[5,6]];
        }

        return (
            <>
            <h2>Game details</h2>
            <form className="StartGameForm" onSubmit={e => this.startGameButton(e)}>
                <DropdownControl 
                id="numberOfPlayers"
                label="Number of players:"
                value={this.state.numberOfPlayers}
                optionLabels={["4 player game", "6 player game"]}
                options={[4, 6]} 
                onChange={v => this.setState({"numberOfPlayers": v})} />

                <div>
                {
                    teams.map((players, teamID) => {
                        return (
                        <div className={styles.team} key={teamID}>
                            <h2>{"Team " + (teamID+1)}</h2>
                            {
                                players.map((playerID) => {
                                    return <InputBox 
                                        key={playerID}
                                        id={"player" + playerID} 
                                        value={this.state["player" + playerID]}
                                        label={"Name of player " + playerID + ":"}
                                        onChange={v => this.setState({["player"+playerID]: v})} />
                                })
                            }
                        </div>
                        )
                    })
                }
                </div>
                
                {
                    (this.state.warning.length > 0
                        ? <div className="alert alert-warning" role="alert">{this.state.warning}</div> 
                        : <></>)
                }

                <input 
                    type="submit" 
                    value="Start game"
                    className="btn btn-primary" 
                    onClick={e => this.startGameButton(e)} />
            </form>
            </>
        )
    }

    renderStartGameDetails() {
        // The render pathway we use when the game is ready to begin

        let warning = (this.state.warning.length > 0
            ? <div className="alert alert-warning" role="alert">{this.state.warning}</div> 
            : <></>)

        if (this.state.gameID.length == 0) {
            return (
                <>
                    <div>Setting up game ... </div>
                    { warning }
                </>
            )
        } else {
            let gameURL = window.location.protocol + "//" 
                + window.location.host 
                + "/game"
                + "?ID=" + this.state.gameID;

            return (
                <>
                    <h2 role="alert" className="alert alert-success">Game is ready to play</h2>
                    <div>Give the following link to your friends:</div>
                    <a href={gameURL}>{gameURL}</a>
                </>
            );
        }
    }

    render() {
        if (!this.state.submitted) {
            // Case 1: while names are being entered
            return this.renderNameForm();
        } else {
            // Case 2: while the start game links are being shown
            return this.renderStartGameDetails();
        }
    }
}

export default function MainPage(props) {
    return (
        <>
            
            <StartGameForm />
        </>
    )
}
