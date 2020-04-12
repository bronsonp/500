import React from 'react';
import { connect } from "react-redux";

import { GameState } from '../../../backend/src/game'

import styles from './game.module.css';

function GameStateHeading(props) {
    if (!props.connected) {
        return <h1 className={styles.gameStateHeading}>Connecting to server ...</h1>;
    }

    if (props.gameState == GameState.BeforeDealing) {
        // could be because the previous round just finished
        if (props.trickIDAcknowledged < props.trickID) {
            return <h1 className={styles.gameStateHeading}>Round finished</h1>;
        }

        if (props.allPlayersConnected) {
            return <h1 className={styles.gameStateHeading}>Ready to deal</h1>;
        } else {
            return <h1 className={styles.gameStateHeading}>Waiting for players to connect</h1>;
        }
    }

    if (props.gameState == GameState.Bidding) {
        return (
            <>
                <h1 className={styles.gameStateHeading}>Bidding</h1>
            </>
        );
    }

    if (props.gameState == GameState.DiscardingKitty) {
        if (props.playerID == props.playerWinningBid) {
             return <h1 className={styles.gameStateHeading}>You must discard 3 cards.</h1>
        } else {
            return <h1 className={styles.gameStateHeading}>Waiting for {props.playerNames[props.playerWinningBid]} to discard 3 cards.</h1>
        }
    }
    
    if (props.gameState == GameState.Playing) {
        if (props.trickIDAcknowledged < props.trickID) {
            return <h1 className={styles.gameStateHeading}>Trick won by {props.playerNames[props.previousTrickWonBy]}</h1>
        }

        if (props.playerID == props.turn) {
             return <h1 className={styles.gameStateHeading}>Your turn</h1>
        } else {
            return <h1 className={styles.gameStateHeading}>{props.playerNames[props.turn]}'s turn</h1>
        }
    }

    if (props.gameState == GameState.Finished) {
        return <h1 className={styles.gameStateHeading}>Game over</h1>
    }

    return <h1 className={styles.gameStateHeading}>500</h1>;
}



function mapStateToProps(state) {
    return {
        playerID: state.gameInfo.playerID,
        playerNames: state.gameInfo.playerNames,
        gameState: state.gameState.gameState,
        connected: state.gameState.connected,
        turn: state.gameState.turn,
        allPlayersConnected: state.gameState.allPlayersConnected,
        playerWinningBid: state.gameState.playerWinningBid,
        trickID: state.gameState.trickID,
        trickIDAcknowledged: state.gameState.trickIDAcknowledged,
        previousTrickWonBy: state.gameState.previousTrickWonBy,
    }
}

export default connect(
    mapStateToProps,
    {}
)(GameStateHeading)

