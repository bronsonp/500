import { connect } from "react-redux";

import styles from './game.module.css';

function Log(props) {
    return (
        <div className={styles.log}>
            <h4>Debugging information</h4>
            <div>Here are the messages from the server (to help me fix it in case something goes wrong)</div>

            {
                props.log.map((logEntry, id) => {
                    return <div key={id}>{JSON.stringify(logEntry)}</div>
                })
            }
        </div>
    )
}


function mapStateToProps(state) {
    return {
        log: state.gameLog,
    }
}

export default connect(
    mapStateToProps,
    {}
)(Log)

