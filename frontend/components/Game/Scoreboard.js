import { connect } from "react-redux";

import styles from './game.module.css';

import Card from './Card'
import { CardData } from '../../api/game';

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


function Scoreboard(props) {
    var historyOfTricks = null;
    var cd = CardData[props.playerNames.length.toString()];
    var cumulativeScore = props.playerNames.map(x => 0);

    if (props.scoreboard.length > 0) {
        historyOfTricks =
            <>
                <h2>History of tricks:</h2>

                {
                    props.scoreboard.map((entry, round) => {
                        var teamID = cd.teams[entry.playerWinningBid];
                        var isWin = entry.teamScores[teamID] > 0;
                        return (
                            <div className={styles.historyOfTricks}>
                                <h3><span className={styles.historyIcon}>{ isWin ? "👌 " : "❌ " }</span>
                                Round {round+1}: {props.playerNames[entry.playerWinningBid]} wagered {wagerToString(entry.tricksWagered, entry.trumps)}
                                </h3>
                                
                                <ul>
                                {
                                    entry.teamScores.map((score, id) => {
                                        cumulativeScore[id] += score;
                                        return <li key={id}>
                                            {props.teamNames[id].join(' and ')}: 
                                            {score>0 ? " +" : " "}{score} points for a total score of {cumulativeScore[id]}.</li>
                                    })
                                }
                                </ul>
                            </div>
                        );
                    })
                }
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
        scoreboard: state.game.serverState.scoreboard,
        teamScores: state.game.teamScores,
        playerNames: state.game.playerNames,
        teamNames: state.game.teamNames,
    }
}

export default connect(
    mapStateToProps,
    {}
)(Scoreboard)
