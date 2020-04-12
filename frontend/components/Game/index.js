import React from 'react'
import { connect } from "react-redux"

import ActionPanel from './ActionPanel'
import Bids from './Bids'
import Card from './Card'
import CurrentBid from './CurrentBid'
import GameStateHeading from './GameStateHeading'
import GameTable from './GameTable'
import Log from './Log'
import PlayersHand from './PlayersHand'
import Scoreboard from './Scoreboard'
import ShuffleButton from './ShuffleButton'

function Game(props) {
    var error = null;
    if (props.lastError.length > 0) {
        error = <div className="alert alert-danger" role="alert">{props.lastError}</div>
    }

    return (
        <>
            <GameStateHeading />
            { error }
            <CurrentBid />

            <GameTable />
            <ShuffleButton />

            <ActionPanel /> 
            <PlayersHand /> 

            <Bids />

            <Scoreboard />
            
            
        </>
    );
}


function mapStateToProps(state) {
    return {
        lastError: state.gameState.lastError,
    }
}

export default connect(
    mapStateToProps,
    {}
)(Game)

