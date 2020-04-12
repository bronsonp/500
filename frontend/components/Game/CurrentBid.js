import { connect } from "react-redux";

import { GameState } from '../../../backend/src/game'

import styles from './game.module.css';

const trumps = {
    "H": "hearts",
    "D": "diamonds",
    "C": "clubs",
    "S": "spades",
    "NT": "no trumps"
};

function CurrentBid(props) {   
    if (props.gameState == GameState.DiscardingKitty || props.gameState == GameState.Playing) {
        var bid;
        if (props.tricksWagered == 0 && props.trumps == "NT") {
            bid = "misère";
        } else {
            bid = props.tricksWagered.toString() + " " + trumps[props.trumps];
        }

        var name_is = props.bidWinnerIsUs ? "You are" : props.playerWinningBid + " is";
        
        return <div className={styles.currentBid}>{name_is} trying to win <strong>{bid}</strong>.</div>
    } else {
        return null;
    }
}

function mapStateToProps(state) {
    return {
        gameState: state.gameState.gameState,
        tricksWagered: state.gameState.tricksWagered,
        trumps: state.gameState.trumps,
        playerWinningBid: state.gameInfo.playerNames[state.gameState.playerWinningBid],
        bidWinnerIsUs: state.gameInfo.playerID == state.gameState.playerWinningBid
    }
}

export default connect(
    mapStateToProps,
    {}
)(CurrentBid)
