import { connect } from "react-redux";

import styles from './game.module.css';

import Card from './Card'
import { CardData } from "../../../backend/src/game";

function wagerToString(tricksWagered, trumps) {
    // find this in the CardData
    // hardcode which entry to look at
    for (var bid of CardData['6'].all_bids) {
        if (bid.tricksWagered == tricksWagered && bid.trumps == trumps) {
            return bid.name;
        }
    }
    return tricksWagered.toString() + trumps;
}

function TrickHistory(props) {
    if (props.scoreboard.length == 0) {
        return null;
    } else {
        return (
            <>
                <h2>History of tricks:</h2>

                <table className="table table-bordered table-hovered">
                <thead>
                    <tr>
                        <td colspan="3"></td>
                        <th colspan={props.teamScores.length}>Outcome</th>
                    </tr>
                    <tr>
                        <th scope="col">Round</th>
                        <th scope="col">Wager</th>
                        <th scope="col">By</th>

                    </tr>
                </thead>
                <tbody>
                {
                    props.scoreboard.map((entry, round) => {
                        return (
                            <tr key={round}>
                                <td>{round+1}</td>
                                <td>{wagerToString(entry.tricksWagered, entry.trumps)}</td>
                                <td>{props.playerNames[entry.playerWinningBid]}</td>
                            </tr> 
                        );
                    })
                }
                </tbody>
            </table>
            </>
        )
    }
}

function Scoreboard(props) {

    
    var historyOfTricks = null;
    if (props.scoreboard.length > 0) {
        historyOfTricks =
            <>
                <h2>History of tricks:</h2>

                <table className="table table-bordered table-hovered">
                    <thead>
                        <tr>
                            <td colspan="3"></td>
                            <th colspan={props.teamScores.length}>Scores</th>
                        </tr>
                        <tr>
                            <th scope="col">Round</th>
                            <th scope="col">Wager</th>
                            <th scope="col">By</th>
                            {
                                props.teamNames.map((name, id) => {
                                    return <th scope="col" key={id}>{name.join(' & ')}</th>
                                })
                            }

                        </tr>
                    </thead>
                    <tbody>
                    {
                        props.scoreboard.map((entry, round) => {
                            return (
                                <tr key={round}>
                                    <td>{round+1}</td>
                                    <td>{wagerToString(entry.tricksWagered, entry.trumps)}</td>
                                    <td>{props.playerNames[entry.playerWinningBid]}</td>
                                    {
                                        entry.teamScores.map((score, id) => {
                                            return <td key={id}>{score}</td>
                                        })
                                    }
                                </tr> 
                            );
                        })
                    }
                    </tbody>
                </table>
            </>
    }
    
    
    return (
        <>
            <h2 className={styles.scoreboardHeading}>Scoreboard:</h2>

            <table className="table table-bordered table-hovered">
                <thead>
                    <tr>
                        <th scope="col">Team</th>
                        <th scope="col">Points</th>
                    </tr>
                </thead>
                <tbody>
                    {
                        props.teamScores.map((score, teamID) => {
                            return (
                                <tr key={teamID}>
                                    <td>{props.teamNames[teamID].join(' and ')}</td>
                                    <td>{score}</td>
                                </tr> 
                            );
                        })
                    }
                </tbody>
            </table>

            { historyOfTricks }
        </>
    )

}


function mapStateToProps(state) {
    return {
        scoreboard: state.gameState.scoreboard,
        teamScores: state.gameState.teamScores,
        playerNames: state.gameInfo.playerNames,
        teamNames: state.gameInfo.teamNames,
    }
}

export default connect(
    mapStateToProps,
    {}
)(Scoreboard)
