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
            <StartGameForm />
        </MainLayout>
    );
}
