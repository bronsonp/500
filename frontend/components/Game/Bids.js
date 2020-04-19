import React from "react";
import { connect } from "react-redux";
import sendToServer from '../../redux/sendToServer'
import { Actions, GameState, CardData, worthOfBid, betToString } from '../../api/game'
import styles from './game.module.css';
import { playerAction } from '../../redux/game'

function BidButton(props) {
    var bidName = betToString(props.bid);
    var worth = worthOfBid(props.bid);
    var btnClass = (worth <= props.worthOfLastBid) ? "btn " + styles.red_no_hover : "btn btn-secondary";
    return (
        <>
            <button
                onClick={() => props.selectBid(props.bid)}
                className={btnClass}>Bid {bidName}
            </button>
            <span className={styles.bidSelectorPointLabel}>
                { (worth <= props.worthOfLastBid) 
                    ? "🚫 only " + worth.toString() + " points; does not outbid previous bid" 
                    : worth.toString() + " points" 
                }
            </span>
        </>
    );
}

function BidSelector(props) {

    if (props.bid != null) {
        return (
            <div className={styles.bidSelectorContainer}>
                <button 
                    className="btn btn-secondary" 
                    onClick={() => props.selectBid(null)}>
                        No, I changed my mind. I want to make a different bid. 
                </button>
            </div>
        )
    } else if (props.selectedNumberOfTricks == null) {
        var misereBet = [0, "NT"];
        return (
            <div className={styles.bidSelectorContainer}>
                <div className={styles.bidSelectorButtonContainer}>
                    <button 
                        className="btn btn-secondary" 
                        onClick={() => props.selectBid([])}>
                            I want to pass
                    </button>
                    <span> </span>
                    {
                        [6, 7, 8, 9, 10].map(numTricks => {
                            return (
                                <>
                                    <button 
                                        key={numTricks} 
                                        onClick={() => props.selectNumberOfTricks(numTricks)}
                                        className="btn btn-secondary">Bid {numTricks} of something ...
                                    </button>
                                    <span>{worthOfBid([numTricks, "S"])} - {worthOfBid([numTricks, "NT"])} points</span>
                                </>
                            )
                        })
                    }
                    <BidButton bid={misereBet} selectBid={props.selectBid} worthOfLastBid={props.worthOfLastBid} />
                </div>
            </div>
        )
    } else {
        return (
            <div className={styles.bidSelectorContainer}>
                <div className={styles.bidSelectorButtonContainer}>
                    {
                        ["S", "C", "D", "H", "NT"].map(trumps => {
                            var bid = [props.selectedNumberOfTricks, trumps];
                            return <BidButton key={trumps} bid={bid} selectBid={props.selectBid} worthOfLastBid={props.worthOfLastBid} />
                        })
                    }
                </div>
                <button 
                    className="btn btn-secondary" 
                    onClick={() => props.selectNumberOfTricks(null)}>
                        Actually, I changed my mind. I want to bid a different number.
                </button>
            </div>
        )
    }
}

class Bids extends React.Component {
    constructor(props) {
        super(props);
        this.state = { 
            bid: null, 
            selectedNumberOfTricks: null 
        };
    }

    render() {
        if (!this.props.showBids) {
            return null;
        }

        if (this.props.bettingPassed == null || this.props.bettingPassed[this.props.playerID]) {
            return null;
        }

        // Get the number of points of the previous bid
        var worthOfLastBid = 0;
        var lastBid = [];
        var extraBidText = " (Scroll down to see the cards that you have been dealt.)";
        if (this.props.bettingHistory.length > 0) {
            lastBid = this.props.bettingHistory[this.props.bettingHistory.length - 1].bet;
            worthOfLastBid = worthOfBid(lastBid);
            extraBidText = "If you wanted to bid higher, you would need to beat " + betToString(lastBid) + ", which is worth " + worthOfLastBid.toString() + " points.";
        }

        var actionPreviewClass = styles.actionPreviewPlaying;

        var button = null;
        if (this.state.bid == null) {
            if (this.props.ourTurn) {
                button = <div className="alert alert-dark">Select a bid from the options below. {extraBidText}</div>
            } else {
                button = <div className="alert alert-dark">It's not your turn yet, but you can get ready by selecting a bid from the options below. {extraBidText}</div>
            }
        } else {


            // Special handling of passing
            if (this.state.bid.length == 0) {
                if (this.props.ourTurn) {
                    button = <button 
                        onClick={() => this.props.playerAction({action: Actions.makeBet, payload: this.state.bid})}
                        className="btn btn-success btn-block fadein">
                            Yes, click here to confirm that I pass.
                    </button>
                } else {
                    button = <button 
                        className="btn btn-secondary btn-block fadein">
                        When it's your turn, click here to pass.
                    </button>
                }
            } else {
                var bidAsText = betToString(this.state.bid);

                // Disallow bids that don't have enough points
                var worthOfThisBid = worthOfBid(this.state.bid);
                if (worthOfThisBid <= worthOfLastBid) {
                    button = <button 
                        className="btn btn-danger btn-block fadein">
                        Cannot bet {bidAsText} because it does not outbid the previous bid of {betToString(lastBid)}.
                    </button>
                } else {
                    // If it's our turn, allow bids to be submitted
                    if (this.props.ourTurn) {
                        button = <button 
                            onClick={() => {
                                this.setState({bid: null, selectedNumberOfTricks: null});
                                this.props.playerAction({action: Actions.makeBet, payload: this.state.bid});
                            }}
                            className="btn btn-success btn-block fadein">
                                Yes, click here to submit a bid of {bidAsText} for {worthOfThisBid} points.
                            </button>
                    } else {
                        button = <button 
                            className="btn btn-secondary btn-block fadein">
                                When it's your turn, click here to submit a bid of {bidAsText} for {worthOfThisBid} points.
                            </button>
                    }
                }
            }
        }

        // Render these components
        return (
            <div className={styles.actionPreview + actionPreviewClass}>
                <div className={styles.actionPreviewInstructions}>
                    {button}
                </div>
                <BidSelector 
                    selectBid={(bid) => this.setState({bid: bid})}
                    selectNumberOfTricks={(n) => this.setState({selectedNumberOfTricks: n})}
                    bid={this.state.bid}
                    worthOfLastBid={worthOfLastBid}
                    selectedNumberOfTricks={this.state.selectedNumberOfTricks} />
            </div>
        )
    }
}

function mapStateToProps(state) {
    return {
        showBids: state.game.serverState.gameState == GameState.Bidding && (state.game.trickIDAcknowledged == state.game.serverState.trickID) ,
        playerNames: state.game.playerNames,
        firstBetter: state.game.serverState.firstBetter,
        bettingPassed: state.game.serverState.bettingPassed,
        playerID: state.game.playerID,
        ourTurn: state.game.serverState.turn == state.game.playerID,
        bettingHistory: state.game.serverState.bettingHistory,
    }
}

export default connect(
    mapStateToProps,
    {playerAction}
)(Bids)
