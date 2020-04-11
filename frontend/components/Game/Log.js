import { connect } from "react-redux";

import styles from './game.module.css';

function Log(props) {
    return (
        <div className={styles.log}>
            <h4>Game history</h4>
            <div>Eventually I will make a pretty display of this information, but for now, here are the messages being sent by the server:</div>
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

