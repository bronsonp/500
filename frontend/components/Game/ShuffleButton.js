import { connect } from "react-redux"
import { Actions, GameState } from '../../api/game';
import { playerAction } from '../../redux/game'

import styles from './game.module.css'

function ShuffleButton(props) {
    if (props.show) {
        if (props.waiting) {
            return (
                <button 
                    className={styles.shuffleButton + " btn btn-secondary"}>
                        Shuffle request sent to server
                </button>
            );
        } else {
            return (
                <button 
                    onClick={() => props.playerAction({action: Actions.shuffle})}
                    className={styles.shuffleButton + " btn btn-primary"}>
                        Shuffle cards
                </button>
            );
        }
    } else {
        return null;
    }
}

function mapStateToProps(state) {
    const show = state.game.serverState.gameState == GameState.BeforeDealing 
        && state.game.allPlayersConnected
        && (state.game.trickIDAcknowledged == state.game.serverState.trickID);
    const waiting = show && state.game.sendingToServer;
    return {
        show,
        waiting,
    }
}

export default connect(
    mapStateToProps,
    {playerAction}
)(ShuffleButton)
