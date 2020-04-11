import React from 'react'
import { connect } from "react-redux"

import sendToServer from '../../redux/sendToServer'
import { addCardToPreview, removeCardFromPreview } from '../../redux/gameState'
import { Actions, GameState, CardData, Game as GameEngine } from '../../../backend/src/game'

import styles from './game.module.css'

import ActionPanel from './ActionPanel'
import Card from './Card'
import CurrentBid from './CurrentBid'
import GameStateHeading from './GameStateHeading'
import GameTable from './GameTable'
import Log from './Log'
import PlayersHand from './PlayersHand'

function ShuffleButton(props) {
    var gs = props.gameState;
    if (gs.gameState == 'BeforeDealing' && gs.allPlayersConnected) {
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


function Bids(props) {
    if (props.gameState.gameState == GameState.Bidding) {
        return (
            <div className={styles.bids}>
                <div className="alert alert-primary"><strong>{props.gameState.playerNames[props.gameState.firstBetter]}</strong> bids first.</div>
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
                        props.gameEngine.all_bids.map((bids, id) => {
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
                                            class="btn btn-block btn-secondary">
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


class Game extends React.Component {
    constructor(props) {
        super(props);
        this.gameEngine = new GameEngine(this.props.playerNames);
        this.gameEngine.gameID = this.props.gameID;
    }

    render() {
        return (
            <>
                <GameStateHeading />
                <CurrentBid />

                <GameTable />
                <ShuffleButton gameState={this.props.gameState} sendToServer={this.props.sendToServer} />

                <Bids gameEngine={this.gameEngine} gameState={this.props.gameState} sendToServer={this.props.sendToServer} />

                <ActionPanel /> 
                <PlayersHand /> 
                
                <Log />
            </>
        );
    }
}

function mapStateToProps(state) {
    return {
        playerID: state.gameInfo.playerID,
        playerNames: state.gameInfo.playerNames,
        gameID: state.gameInfo.gameID,
        gameState: state.gameState
    }
}

export default connect(
    mapStateToProps,
    {sendToServer, addCardToPreview, removeCardFromPreview}
)(Game)

