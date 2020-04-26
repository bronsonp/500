import React from 'react';
import { connect } from "react-redux";

import sendToServer from '../../redux/sendToServer'
import { removeCardFromPreview, acknowledgePreviousTrick, playerAction } from '../../redux/game'
import { Actions, GameState, CardData, isCardLegal } from '../../api/game'

import styles from './game.module.css';

import Card, {cardToShortDescription} from './Card'

function ActionPreview(props) {
    // during bidding, don't take up space
    if (props.serverState.gameState == GameState.Bidding) {
        // .. unless we are still waiting on acknowledgement
        if (props.trickIDAcknowledged == props.serverState.trickID) {
            return null;
        }
    }

    // if we are reviewing the prevous trick, show some details
    if (props.trickIDAcknowledged < props.serverState.trickID) {
        var leader = props.playerNames[props.serverState.previousTrickPlayedBy[0]];
        var winner = props.playerNames[props.serverState.previousTrickWonBy];
        var winningCard = props.serverState.previousTrick[props.serverState.previousTrickPlayedBy.indexOf(props.serverState.previousTrickWonBy)];
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

    // Depending upon the game state, display an instruction, a button to execute an action,
    // and some card(s).
    var instructions = null;
    var confirmation = null;
    var actionPreviewClass = "";
    var extraMessage = null;

    // is it our turn?
    const isOurTurn = props.serverState.turn == props.playerID;

    // Discarding kitty phase of the game
    if (props.serverState.gameState == GameState.DiscardingKitty && isOurTurn) {
        actionPreviewClass = " " + styles.actionPreviewDiscarding;
        if (props.actionPreview.length != 3) {
            instructions = <div className="alert alert-dark">Select 3 cards from your hand to discard.</div>
        } else {
            var actionPayload = {action: Actions.discardKitty, payload: props.actionPreview };
            confirmation = <button 
                onClick={() => props.playerAction(actionPayload)}
                className="btn btn-danger btn-block fadein">
                    Confirm (discard these 3 cards)
            </button>;
        }
    }
    
    // Playing phase of the game
    else if (props.serverState.gameState == GameState.Playing && isOurTurn) {
        actionPreviewClass = " " + styles.actionPreviewPlaying;
        if (props.actionPreview.length != 1) {
            instructions = <div className="alert alert-dark">Select a card from your hand to play.</div>
        } else {
            var actionPayload = {action: Actions.playCard, payload: props.actionPreview[0] };
            // is this card legal to play?
            if (isCardLegal(props.serverState, props.playerID, props.actionPreview[0])) {
                if (props.serverState.trumps == "NT" && props.actionPreview[0] == "Joker" && props.serverState.trick.length == 0) {
                    extraMessage = 
                        <div className={styles.jokerSuitSelector}>
                            <div>Select the suit that others must follow:</div>
                            <select
                                className="form-control"
                                onChange={(e) => actionPayload["notrumps_joker_suit"] = e.target.value}>
                                    <option></option>
                                    <option value="H">Hearts</option>
                                    <option value="D">Diamonds</option>
                                    <option value="S">Spades</option>
                                    <option value="C">Clubs</option>

                            </select>
                        </div>
                }
                confirmation = <button 
                    onClick={() => props.playerAction(actionPayload)}
                    className="btn btn-success btn-block fadein">
                        Confirm (click here to play this card)
                    </button>
            } else {
                actionPreviewClass = " " + styles.actionPreviewError;
                extraMessage = <div className={styles.actionPanelExtraMessage}>Click the card to return it to your hand.</div>
                confirmation = <button 
                    className="btn btn-danger btn-block fadein">
                        Cannot play this card because it is not legal. You must follow suit.
                    </button>
            }
        }
    }


    // Render these components
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
            </div>
        </div>
    )
}


function mapStateToProps(state) {
    return {
        serverState: state.game.serverState,
        playerID: state.game.playerID,
        playerNames: state.game.playerNames,
        actionPreview: state.game.actionPreview,
        trickIDAcknowledged: state.game.trickIDAcknowledged,
    }
}

export default connect(
    mapStateToProps,
    {removeCardFromPreview, acknowledgePreviousTrick, sendToServer, playerAction}
)(ActionPreview)

