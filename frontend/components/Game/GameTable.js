import React from 'react';
import { connect } from "react-redux";

import { GameState, CardData, betToString } from '../../api/game'

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
            numCards = numCards + ", ";
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
    var i;
    for (i = 0; i < props.playerNames.length; i++) {
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

    // during the bidding phase, display bids instead of cards
    var bids = [];
    if (props.gameState == GameState.Bidding && props.bettingPassed !== null) {
        // insert bids from each player
        props.bettingHistory.forEach(h => {
            bids[h.playerID] = betToString(h.bet);
        })

        // set which players have passed
        for (i = 0; i < props.playerNames.length; i++) {
            if (props.bettingPassed[i]) {
                bids[i] = "Passed";
            }
        }
    }

    
    // create a message for a joker that is led in a NT game
    var messageAboutLeadingJoker = null;
    if (props.trumps == "NT" && cards.length>0 && cards[0] == "Joker" && props.notrumps_joker_suit != '') {
        var suitName = CardData[6].all_suits[props.notrumps_joker_suit].name;
        messageAboutLeadingJoker = <div className="alert alert-primary">The leading joker's suit is {suitName}.</div>
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
                                switch (tablePosition) {
                                    case 0: cardStyle = styles.south; break;
                                    case 1: cardStyle = styles.southwest; break;
                                    case 2: cardStyle = styles.northwest; break;
                                    case 3: cardStyle = styles.north; break;
                                    case 4: cardStyle = styles.northeast; break;
                                    case 5: cardStyle = styles.southeast; break;
                                }
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
                    {
                        bids.map((bid, id) => {
                            var bidStyle = "";
                            var tablePosition = order.indexOf(id);
                            if (props.playerNames.length == 4) {
                                switch (tablePosition) {
                                    case 0: bidStyle = styles.south; break;
                                    case 1: bidStyle = styles.west; break;
                                    case 2: bidStyle = styles.north; break;
                                    case 3: bidStyle = styles.east; break;
                                }
                            } else {
                                switch (tablePosition) {
                                    case 0: bidStyle = styles.south; break;
                                    case 1: bidStyle = styles.southwest; break;
                                    case 2: bidStyle = styles.northwest; break;
                                    case 3: bidStyle = styles.north; break;
                                    case 4: bidStyle = styles.northeast; break;
                                    case 5: bidStyle = styles.southeast; break;
                                }
                            }
                            // set the z index in order of cards being played
                            bidStyle = bidStyle + " " + styles['cardZ' + i.toString()];

                            // animate the last placed card
                            if (i == props.trick.length-1) {
                                bidStyle = bidStyle + " fadein";
                            }

                            bidStyle = bidStyle + " " + styles.tableBet;
                            return <div key={id} className={bidStyle}>{bid}</div>
                        })
                    }
                </div>
            </div>

            {messageAboutLeadingJoker}
        </>
    )
}


function mapStateToProps(state) {
    return {
        playerID: state.game.playerID,
        playerNames: state.game.playerNames,
        playersConnected: state.game.serverState.playersConnected,
        turn: state.game.serverState.turn,
        numberOfCardsInHand: state.game.serverState.numberOfCardsInHand,
        tricksWon: state.game.serverState.tricksWon,
        trick: state.game.serverState.trick,
        trickPlayedBy: state.game.serverState.trickPlayedBy,
        gameState: state.game.serverState.gameState,
        firstBetter: state.game.serverState.firstBetter,
        trickID: state.game.serverState.trickID,
        trickIDAcknowledged: state.game.trickIDAcknowledged,
        previousTrick: state.game.serverState.previousTrick,
        previousTrickPlayedBy: state.game.serverState.previousTrickPlayedBy,
        previousTrickWonBy: state.game.serverState.previousTrickWonBy,
        notrumps_joker_suit: state.game.serverState.notrumps_joker_suit,
        trumps: state.game.serverState.trumps,
        bettingPassed: state.game.serverState.bettingPassed,
        bettingHistory: state.game.serverState.bettingHistory,
    }
}

export default connect(
    mapStateToProps,
    {}
)(GameTable)
