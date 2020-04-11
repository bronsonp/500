import { send } from '@giantmachines/redux-websocket';

// generate an action that sends to the server
export default function sendToServer(msg) {
    msg["message"] = "action"; // hardcode this bit
    return send(msg);
}
