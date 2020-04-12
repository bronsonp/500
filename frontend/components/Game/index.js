import React from 'react'
import { connect } from "react-redux"

import sendToServer from '../../redux/sendToServer'
import { addCardToPreview, removeCardFromPreview } from '../../redux/gameState'
import { Actions, GameState, CardData, Game as GameEngine } from '../../../backend/src/game'

import styles from './game.module.css'

import ActionPanel from './ActionPanel'
import Bids from './Bids'
import Card from './Card'
import CurrentBid from './CurrentBid'
import GameStateHeading from './GameStateHeading'
import GameTable from './GameTable'
import Log from './Log'
import PlayersHand from './PlayersHand'

function ShuffleButton(props) {
    var gs = props.gameState;
    if (gs.gameState == 'BeforeDealing' && gs.allPlayersConnected) {
        return (
            <button 
                onClick={() => props.sendToServer({action: Actions.shuffle})}
                className={styles.shuffleButton + " btn btn-primary"}>
                    Shuffle cards
            </button>
        );
    } else {
        return null;
    }
}




class Game extends React.Component {
    constructor(props) {
        super(props);
        this.gameEngine = new GameEngine(this.props.playerNames);
        this.gameEngine.gameID = this.props.gameID;
    }

    render() {
        return (
            <>
                <GameStateHeading />
                <CurrentBid />

                <GameTable />
                <ShuffleButton gameState={this.props.gameState} sendToServer={this.props.sendToServer} />

                <ActionPanel /> 
                <PlayersHand /> 

                <Bids />
                
                <Log />
            </>
        );
    }
}

function mapStateToProps(state) {
    return {
        playerID: state.gameInfo.playerID,
        playerNames: state.gameInfo.playerNames,
        gameID: state.gameInfo.gameID,
        gameState: state.gameState
    }
}

export default connect(
    mapStateToProps,
    {sendToServer, addCardToPreview, removeCardFromPreview}
)(Game)

