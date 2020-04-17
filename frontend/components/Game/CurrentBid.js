import { connect } from "react-redux";

import { GameState } from '../../api/game'

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
        gameState: state.game.serverState.gameState,
        tricksWagered: state.game.serverState.tricksWagered,
        trumps: state.game.serverState.trumps,
        playerWinningBid: state.game.playerNames[state.game.serverState.playerWinningBid],
        bidWinnerIsUs: state.game.playerID == state.game.serverState.playerWinningBid
    }
}

export default connect(
    mapStateToProps,
    {}
)(CurrentBid)
