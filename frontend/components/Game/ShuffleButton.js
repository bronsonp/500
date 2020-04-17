import { connect } from "react-redux"
import sendToServer from '../../redux/sendToServer'
import { Actions, GameState } from '../../api/game';

import styles from './game.module.css'

function ShuffleButton(props) {
    if (props.show) {
        return (
            <button 
                onClick={() => props.sendToServer({action: Actions.shuffle})}
                className={styles.shuffleButton + " btn btn-primary"}>
                    Shuffle cards
            </button>
        );
    } else {
        return null;
    }
}

function mapStateToProps(state) {
    return {
        show: state.game.serverState.gameState == GameState.BeforeDealing 
            && state.game.allPlayersConnected
            && (state.game.trickIDAcknowledged == state.game.serverState.trickID)
    }
}

export default connect(
    mapStateToProps,
    {sendToServer}
)(ShuffleButton)
