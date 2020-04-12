import { connect } from "react-redux";
import sendToServer from '../../redux/sendToServer'
import { Actions, GameState, CardData } from '../../../backend/src/game'
import styles from './game.module.css';

function Bids(props) {
    if (props.showBids) {
        var firstBetter = props.playerNames[props.firstBetter];
        return (
            <div className={styles.bids}>
                <div className="alert alert-primary"><strong>{firstBetter}</strong> bids first.</div>
                <p>
                    Talk to your friends and decide who wins the bidding.
                </p>
                <p>
                    If you are the winner of the bid, click the appropriate button below to tell the computer. 
                    You will then receive the cards in the kitty.
                </p>
                <table className="table-dark table-bordered table-hovered">
                    <thead>
                        <tr>
                            <th scope="col">Bid</th>
                            <th scope="col">Points</th>
                            <th scope="col">I win these</th>
                        </tr>
                    </thead>
                    <tbody>
                    {
                        CardData[props.playerNames.length].all_bids.map((bids, id) => {
                            const winMessage = {
                                "action": Actions.winBet,
                                "payload": [bids.tricksWagered, bids.trumps]
                            };
                            return (
                                <tr key={id}>
                                    <td>{bids.name}</td>
                                    <td>{bids.worth}</td>
                                    <td>
                                        <button 
                                            onClick={() => props.sendToServer(winMessage)}
                                            className="btn btn-block btn-secondary">
                                                I won the bid of {bids.name}
                                        </button>
                                    </td>
                                </tr> 
                            );
                        })
                    }
                    </tbody>
                </table>
            </div>
        )
    } else {
        return null;
    }
}

function mapStateToProps(state) {
    return {
        showBids: state.gameState.gameState == GameState.Bidding,
        playerNames: state.gameState.playerNames,
        firstBetter: state.gameState.firstBetter,
    }
}

export default connect(
    mapStateToProps,
    {sendToServer}
)(Bids)
