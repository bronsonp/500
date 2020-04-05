export default function MainLayout(props) {
    return (
        <>
            <div className="TopLevelContainer">
                <div className="MainContainer">
                    { props.children }        
                </div>
            </div>

            <div className="TopLevelFooter">
                <p>Produced by Bronson Philippa while on Covid19 isolation.</p>
                <p>Good luck, have fun!</p>
            </div>
        </>
    );
}
