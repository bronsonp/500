import { connect } from "react-redux"

import { addCardToPreview } from '../../redux/gameState'
import { CardData } from '../../../backend/src/game'

import styles from './game.module.css'

import Card from './Card'

function PlayersHand(props) {
    if (typeof props.yourHand == 'undefined') {
        return null;
    }

    const numberOfPlayers = props.playerNames.length;

    // get the cards in the player's hand
    var cards = props.yourHand.slice()

    // remove any that are shown in the preview area
    cards = cards.filter(c => {
        return (-1 == props.actionPreview.indexOf(c));
    })
    
    const trumps = (props.trumps == "" ? "NT" : props.trumps)
    const cardSortOrder = CardData[numberOfPlayers].all_trumps[trumps].card_order;
    cards.sort((a,b) => {
        var a_idx = cardSortOrder.indexOf(a);
        var b_idx = cardSortOrder.indexOf(b);
        if (a_idx < b_idx) {
            return -1;
        } else if (a_idx > b_idx) {
            return 1;
        } else {
            return 0;
        }
    })

    // render the cards
    return (
        <>
            <h2>Your hand:</h2>
            
            <div className={styles.cardContainer}>
                {
                    cards.map((card, id) => {
                        return <Card 
                            onClick={(card) => {if (props.turn) {props.addCardToPreview(card)}}}
                            card={card} 
                            key={id} />
                    })
                }
            </div>
        </>
    );
}

function mapStateToProps(state) {
    return {
        playerNames: state.gameInfo.playerNames,
        yourHand: state.gameState.yourHand,
        trumps: state.gameState.trumps,
        actionPreview: state.gameState.actionPreview,
        turn: state.gameState.turn == state.gameInfo.playerID,
    }
}

export default connect(
    mapStateToProps,
    {addCardToPreview}
)(PlayersHand)
