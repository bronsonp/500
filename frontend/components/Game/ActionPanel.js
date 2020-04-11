import React from 'react';
import { connect } from "react-redux";

import sendToServer from '../../redux/sendToServer'
import { removeCardFromPreview } from '../../redux/gameState'
import { Actions, GameState, CardData, Game as GameEngine } from '../../../backend/src/game'

import styles from './game.module.css';

import Card from './Card'

function ActionPreview(props) {
    // show nothing if it's not our turn or there's no need to select cards 
    if (!props.turn && (props.gameState != GameState.DiscardingKitty || props.gameState != GameState.Playing)) {
        return <div className={styles.actionPreview}></div>;
    }

    // Give instructions or provide a confirm button
    var instructions = null;
    var confirmation = null;
    var actionPreviewClass = "";
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
    if (props.gameState == GameState.Playing && props.turn) {
        actionPreviewClass = " " + styles.actionPreviewPlaying;
        if (props.actionPreview.length != 1) {
            instructions = <div className="alert alert-dark">Select a card from your hand to play.</div>
        } else {
            var msg = {action: Actions.playCard, payload: props.actionPreview[0] };
            confirmation = <button 
                onClick={() => props.sendToServer(msg)}
                className="btn btn-success btn-block fadein">
                    Confirm (play this card)
            </button>;
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
            </div>
        </div>
    )
}


function mapStateToProps(state) {
    return {
        gameState: state.gameState.gameState,
        turn: state.gameState.turn == state.gameInfo.playerID,
        actionPreview: state.gameState.actionPreview,
    }
}

export default connect(
    mapStateToProps,
    {removeCardFromPreview, sendToServer}
)(ActionPreview)

