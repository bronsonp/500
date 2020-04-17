import Head from 'next/head'

export default function MainLayout(props) {
    return (
        <>
            <Head>
                <title>500</title>
            </Head>
            <div className="TopLevelContainer">
                <div className="MainContainer">
                    { props.children }        
                </div>
            </div>

            <div className="TopLevelFooter">
                <p><a href="/">Click here to set up a new game.</a></p>
                <p>Produced by Bronson Philippa while on Covid19 isolation.</p>
                <p>Good luck, have fun!</p>
            </div>
        </>
    );
}
