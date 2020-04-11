import { connect } from "react-redux";

import { setPlayerID } from "../../redux/gameInfo";

import styles from "./ChoosePlayerForm.module.css"

function ChoosePlayerForm(props) {
    if (typeof props.playerID !== 'undefined') {
        // nothing to do
        return null;
    } else {
        // render a list to choose which player we are 
        return (
            <div className={styles.form}>
                <h2>Who are you?</h2>
                {
                    (props.playerNames.length == 0) ? 
                    <p>Downloading list of players ...</p> :
                    <p>The following players are registered to take part in this game.</p>
                }
                
                <div className={styles.buttonHolder}>
                {
                    props.playerNames.map((name,ID) => (
                        <button 
                            key={ID} 
                            className={"btn btn-outline-primary " + styles.playerButton} 
                            onClick={e => props.setPlayerID(ID)}
                            >

                            {name}
                        </button>
                    ))
                }
                </div>

            </div>

        )
    }
}

function mapStateToProps(state) {
    return {
        playerID: state.gameInfo.playerID,
        playerNames: state.gameInfo.playerNames,
    }
}

export default connect(
    mapStateToProps,
    {setPlayerID}
)(ChoosePlayerForm)

