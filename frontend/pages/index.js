/**
 * Render the main index page.
 *
 * This is basically a shell that just loads either the start game form.
 *
 */

import MainLayout from '../components/Layout';
import StartGameForm from '../components/StartGameForm'

export default function MainPage(props) {
    return (
        <MainLayout>
            <h1>Game of 500</h1>

            <p>
                This website allows you to play the game of 500 over the Internet. 
                It is assumed that you have a video call open with the friends that 
                you're playing with.
            </p>

            <StartGameForm />
        </MainLayout>
    );
}
