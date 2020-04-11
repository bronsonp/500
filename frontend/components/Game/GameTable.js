import React from 'react';
import { connect } from "react-redux";

import { GameState } from '../../../backend/src/game'

import styles from './game.module.css';

function PlayerAtTable(props) {
    const playerClass = (props.active ? styles.activePlayer : "") + " " + styles.gameTablePlayer;
    var numCards = "";
    if (typeof props.numCards !== 'undefined') {
        numCards = props.numCards.toString() + ((props.numCards==1) ? " card" : " cards");
    }
    return (
        <>
            <div className={playerClass}>
                <div className={styles.gameTablePlayerName}>
                    🧍 {props.name}
                    { (props.connected) ? <></> : <span title="not connected"> 📵</span> }
                </div>
                <div>{numCards}</div>
            </div>
        </>
    );
}

function GameTable(props) {
    // check that we have player data in the gameState
    if (typeof props.playerNames == 'undefined') {
        return null;
    }

    // find the ordering of players starting from us and moving around the table
    var order = [];
    for (var i = 0; i < props.playerNames.length; i++) {
        order.push((i + props.playerID) % props.playerNames.length)
    }

    // render the table
    const tableClass = (props.playerNames.length == 4) 
        ? styles.gameTable + " " + styles.gameTable4Players
        : styles.gameTable + " " + styles.gameTable6Players;        
    return (
        <>
            <div className={tableClass}>
                {
                    order.map(playerID => {
                        var numCards = undefined;
                        if (props.numberOfCardsInHand.length > 0) {
                            numCards = props.numberOfCardsInHand[playerID];
                        }
                        var connected = false;
                        if (props.playersConnected.length > 0) {
                            connected = props.playersConnected[playerID];
                        }

                        return <PlayerAtTable 
                                    key={playerID} 
                                    name={props.playerNames[playerID]}
                                    active={playerID == props.turn}
                                    numCards={numCards}
                                    connected={connected} />;
                    })
                }
                <div className={styles.gameTableCenter}>
                    
                </div>
            </div>
        </>
    )
}


function mapStateToProps(state) {
    return {
        playerID: state.gameInfo.playerID,
        playerNames: state.gameInfo.playerNames,
        playersConnected: state.gameState.playersConnected,
        turn: state.gameState.turn,
        numberOfCardsInHand: state.gameState.numberOfCardsInHand,
    }
}

export default connect(
    mapStateToProps,
    {}
)(GameTable)
