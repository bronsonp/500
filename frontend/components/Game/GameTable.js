import React from 'react';
import { connect } from "react-redux";

import { GameState } from '../../../backend/src/game'

import styles from './game.module.css';

import Card from './Card'

function PlayerAtTable(props) {
    const playerClass = (props.active ? styles.activePlayer : "") + " " + styles.gameTablePlayer;
    var numCards = "";
    if (typeof props.numCards !== 'undefined') {
        numCards = props.numCards.toString() + ((props.numCards==1) ? " card" : " cards");
    }
    var tricksWon = "";
    if (typeof props.tricksWon !== 'undefined') {
        if (props.tricksWon > 0) {
            tricksWon = props.tricksWon.toString() + ((props.tricksWon==1) ? " trick" : " tricks");
        }
    }


    return (
        <>
            <div className={playerClass}>
                <div className={styles.gameTablePlayerName}>
                    🧍 {props.name}
                    { (props.connected) ? <></> : <span title="not connected"> 📵</span> }
                </div>
                <div>{numCards}</div>
                <div>{tricksWon}</div>
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

    // choose the cards we are displaying
    var cards;
    var cardsPlayedBy;
    var activePlayer = props.turn;
    if (props.trickIDAcknowledged < props.trickID) {
        cards = props.previousTrick;
        cardsPlayedBy = props.previousTrickPlayedBy;
        activePlayer = props.previousTrickWonBy;
    } else {
        cards = props.trick;
        cardsPlayedBy = props.trickPlayedBy;
    }
    if (props.gameState == GameState.Bidding) {
        activePlayer = props.firstBetter;
    }

    return (
        <>
            <div className={tableClass}>
                {
                    order.map(playerID => {
                        var numCards = undefined;
                        if (props.numberOfCardsInHand.length > 0) {
                            numCards = props.numberOfCardsInHand[playerID];
                        }
                        var tricksWon = undefined;
                        if (props.tricksWon.length > 0) {
                            tricksWon = props.tricksWon[playerID];
                        }
                        var connected = false;
                        if (props.playersConnected.length > 0) {
                            connected = props.playersConnected[playerID];
                        }

                        return <PlayerAtTable 
                                    key={playerID} 
                                    name={props.playerNames[playerID]}
                                    active={playerID == activePlayer}
                                    numCards={numCards}
                                    tricksWon={tricksWon}
                                    connected={connected} />;
                    })
                }
                <div className={styles.gameTableCenter}>
                    {
                        cards.map((card, i) => {
                            var cardStyle = "";
                            var playedBy = cardsPlayedBy[i];
                            var tablePosition = order.indexOf(playedBy);
                            if (props.playerNames.length == 4) {
                                switch (tablePosition) {
                                    case 0: cardStyle = styles.south; break;
                                    case 1: cardStyle = styles.west; break;
                                    case 2: cardStyle = styles.north; break;
                                    case 3: cardStyle = styles.east; break;
                                }
                            } else {
                                
                            }
                            // set the z index in order of cards being played
                            cardStyle = cardStyle + " " + styles['cardZ' + i.toString()];

                            // animate the last placed card
                            if (i == props.trick.length-1) {
                                cardStyle = cardStyle + " fadein";
                            }
                            return <Card card={card} key={i} extraStyle={cardStyle} />
                        })
                    }
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
        tricksWon: state.gameState.tricksWon,
        trick: state.gameState.trick,
        trickPlayedBy: state.gameState.trickPlayedBy,
        gameState: state.gameState.gameState,
        firstBetter: state.gameState.firstBetter,
        trickID: state.gameState.trickID,
        trickIDAcknowledged: state.gameState.trickIDAcknowledged,
        previousTrick: state.gameState.previousTrick,
        previousTrickPlayedBy: state.gameState.previousTrickPlayedBy,
        previousTrickWonBy: state.gameState.previousTrickWonBy,
    }
}

export default connect(
    mapStateToProps,
    {}
)(GameTable)
