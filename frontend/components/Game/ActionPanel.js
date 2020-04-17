import React from 'react';
import { connect } from "react-redux";

import sendToServer from '../../redux/sendToServer'
import { removeCardFromPreview, acknowledgePreviousTrick, playCard } from '../../redux/game'
import { Actions, GameState, CardData, Game as GameEngine } from '../../api/game'

import styles from './game.module.css';

import Card, {cardToShortDescription} from './Card'

function ActionPreview(props) {
    // during bidding, don't take up space
    if (props.gameState == GameState.Bidding) {
        // .. unless we are still waiting on acknowledgement
        if (props.trickIDAcknowledged == props.trickID) {
            return null;
        }
    }

    // if we are reviewing the prevous trick, show some details
    if (props.trickIDAcknowledged < props.trickID) {
        var leader = props.playerNames[props.previousTrickPlayedBy[0]];
        var winner = props.playerNames[props.previousTrickWonBy];
        var winningCard = props.previousTrick[props.previousTrickPlayedBy.indexOf(props.previousTrickWonBy)];
        var message;
        if (leader == winner) {
            message = leader + " led and won with " + cardToShortDescription(winningCard) + ".";
        } else {
            message = winner + " won with " + cardToShortDescription(winningCard) + ".";
        }
        message = "In the last trick, " + message;

        var buttonMessage = "OK, move on to next trick";
        if (props.gameState == GameState.BeforeDealing) {
            buttonMessage = "OK, move on to next round";
        }

        return (
            <div className={styles.actionPreview}>
                <div className={styles.actionPreviewInstructions}>
                    <button 
                        onClick={() => props.acknowledgePreviousTrick()}
                        className="btn btn-success btn-block fadein">
                            {buttonMessage}
                    </button>
                </div>
                <div className={styles.actionPreviewCardContainer}>
                    {message}
                </div>
            </div>
        )
    }


    // Give instructions or provide a confirm button
    var instructions = null;
    var confirmation = null;
    var actionPreviewClass = "";
    var extraMessage = null;
    if (props.gameState == GameState.DiscardingKitty && props.turn) {
        actionPreviewClass = " " + styles.actionPreviewDiscarding;
        if (props.actionPreview.length != 3) {
            instructions = <div className="alert alert-dark">Select 3 cards from your hand to discard.</div>
        } else {
            var msg = {action: Actions.discardKitty, payload: props.actionPreview };
            confirmation = <button 
                onClick={() => props.sendToServer(msg)}
                className="btn btn-danger btn-block fadein">
                    Confirm (discard these 3 cards)
            </button>;
        }
    }
    var notrumps_joker_suit_select = null;
    if (props.gameState == GameState.Playing && props.turn) {
        actionPreviewClass = " " + styles.actionPreviewPlaying;
        if (props.actionPreview.length != 1) {
            instructions = <div className="alert alert-dark">Select a card from your hand to play.</div>
        } else {
            var playCardPayload = {card: props.actionPreview[0] };
            // is this card legal to play?
            if (GameEngine.isCardLegal(props.trick, props.actionPreview[0], props.yourHand, props.trumps, props.notrumps_joker_suit)) {
                if (props.trumps == "NT" && props.actionPreview[0] == "Joker" && props.trick.length == 0) {
                    notrumps_joker_suit_select = 
                        <div className={styles.jokerSuitSelector}>
                            <div>Select the suit that others must follow:</div>
                            <select
                                className="form-control"
                                onChange={(e) => playCardPayload["notrumps_joker_suit"] = e.target.value}>
                                    <option></option>
                                    <option value="H">Hearts</option>
                                    <option value="D">Diamonds</option>
                                    <option value="S">Spades</option>
                                    <option value="C">Clubs</option>

                            </select>
                        </div>
                }
                confirmation = <button 
                    onClick={() => props.playCard(playCardPayload)}
                    className="btn btn-success btn-block fadein">
                        Confirm (click here to play this card)
                    </button>
            } else {
                actionPreviewClass = " " + styles.actionPreviewError;
                extraMessage = <div className={styles.actionPanelExtraMessage}>Click the card to return it to your hand.</div>
                confirmation = <button 
                    className="btn btn-danger btn-block fadein">
                        Cannot play this card because it is not legal.
                    </button>
            }
        }
    }


    // Show selected cards
    return (
        <div className={styles.actionPreview + actionPreviewClass}>
            <div className={styles.actionPreviewInstructions}>
                {instructions}
                {confirmation}
            </div>
            <div className={styles.actionPreviewCardContainer}>
            {
                props.actionPreview.map((card, id) => {
                    return <Card card={card} key={id} onClick={(card) => props.removeCardFromPreview(card)} />
                })
            }
            {extraMessage}
            {notrumps_joker_suit_select}
            </div>
        </div>
    )
}


function mapStateToProps(state) {
    return {
        gameState: state.game.serverState.gameState,
        playerNames: state.game.playerNames,
        turn: state.game.serverState.turn == state.game.playerID,
        actionPreview: state.game.actionPreview,
        trick: state.game.serverState.trick,
        trickID: state.game.serverState.trickID,
        trickIDAcknowledged: state.game.trickIDAcknowledged,
        previousTrickWonBy: state.game.serverState.previousTrickWonBy,
        previousTrickPlayedBy: state.game.serverState.previousTrickPlayedBy,
        previousTrick: state.game.serverState.previousTrick,
        yourHand: state.game.serverState.yourHand,
        trumps: state.game.serverState.trumps,
        notrumps_joker_suit: state.game.serverState.notrumps_joker_suit,
    }
}

export default connect(
    mapStateToProps,
    {removeCardFromPreview, acknowledgePreviousTrick, sendToServer, playCard}
)(ActionPreview)

