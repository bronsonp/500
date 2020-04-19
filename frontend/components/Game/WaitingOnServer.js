import { connect } from "react-redux"
import styles from './game.module.css'

function WaitingOnServer(props) {
    if (props.waiting) {
        return (
            <div className={styles.waitingOnServer}>
                Sending message to server
            </div>
        );
    } else {
        return null;
    }
}

function mapStateToProps(state) {
    return {
        waiting: state.game.sendingToServer,
    }
}

export default connect(
    mapStateToProps,
    {}
)(WaitingOnServer)
