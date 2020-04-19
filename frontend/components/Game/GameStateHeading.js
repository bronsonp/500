import React from 'react';
import { connect } from "react-redux";

import { GameState } from '../../api/game'

import styles from './game.module.css';

function GameStateHeading(props) {
    if (!props.connected) {
        return <h1 className={styles.gameStateHeading}>Connecting to server ...</h1>;
    }
    
    // did the previous round just finish?
    if ((props.trickIDAcknowledged < props.trickID) 
         && (props.gameState == GameState.BeforeDealing || props.gameState == GameState.Bidding) ) 
    {
            return <h1 className={styles.gameStateHeading}>Round finished</h1>;
    }

    if (props.gameState == GameState.BeforeDealing) {
        if (props.allPlayersConnected) {
            return <h1 className={styles.gameStateHeading}>Ready to deal</h1>;
        } else {
            return <h1 className={styles.gameStateHeading}>Waiting for players to connect</h1>;
        }
    }

    if (props.gameState == GameState.Bidding) {
        return (
            <>
                <h1 className={styles.gameStateHeading}>Bidding: {props.playerNames[props.turn]}'s turn</h1>
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
        playerID: state.game.playerID,
        playerNames: state.game.playerNames,
        gameState: state.game.serverState.gameState,
        connected: state.game.connected,
        turn: state.game.serverState.turn,
        allPlayersConnected: state.game.allPlayersConnected,
        playerWinningBid: state.game.serverState.playerWinningBid,
        trickID: state.game.serverState.trickID,
        trickIDAcknowledged: state.game.trickIDAcknowledged,
        previousTrickWonBy: state.game.serverState.previousTrickWonBy,
    }
}

export default connect(
    mapStateToProps,
    {}
)(GameStateHeading)

