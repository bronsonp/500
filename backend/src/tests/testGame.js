var Game = require('../game');
var assert = require('assert');

function makeTestGame(number_of_players) {
    var player_names = [];
    for (var i = 1; i <= number_of_players; i++) {
        player_names.push("Player" + i);
    }
    return Game.startGame(player_names);
}

function test_calcTrickWinner() {

    function checkTrickWinner(trick, trumps, winner) {
        // Create the game object with the correct number of players
        var g = makeTestGame(trick.length);
    
        // Set up the trick
        g.trumps = trumps;
        g.trick = trick;
        var apparent_winner = Game.calcTrickWinner(g);
        assert(apparent_winner == winner, 
            "Failed to calculate winner. Trick: [" + trick + "] with trump=" + trumps 
            + ". Calculated winner="+apparent_winner 
            + ". Actual winner="+winner);
    }

    // Case 1: joker wins
    checkTrickWinner(["Joker", "H10", "H5", "C5"], "H", 0);
    checkTrickWinner(["H10", "Joker", "H5", "C5"], "H", 1);

    // Case 2: highest trump card wins
    checkTrickWinner(["H6", "H10", "H5", "C5"], "H", 1);
    checkTrickWinner(["H6", "H10", "DJ", "C5"], "C", 3);

    // Case 3: left bower is the highest trump
    checkTrickWinner(["H6", "H10", "DJ", "C5"], "H", 2);

    // Case 4: high card of the led suit wins
    checkTrickWinner(["H6", "H10", "DJ", "C5"], "NT", 1);
    checkTrickWinner(["D6", "H10", "DJ", "C5"], "S", 2);

    // Case 5: right bower wins with it is the trump suit but not otherwise
    checkTrickWinner(["C6", "CA", "CJ", "C5"], "NT", 1);
    checkTrickWinner(["C6", "CA", "CJ", "C5"], "C", 2);
    checkTrickWinner(["C6", "CA", "CJ", "C5"], "D", 1);

    // Case 6: some six player tricks
    checkTrickWinner(["C6", "CA", "CJ", "C5", "D8", "S3"], "NT", 1);
    checkTrickWinner(["H10", "CA", "CJ", "Joker", "H5", "C5"], "H", 3);

    // Case 7: misere 
    var g = makeTestGame(4);
    g.trumps = "NT";
    g.tricksWagered = 0;
    g.playerWinningBid = 0;
    g.trick = ["C6", "C8", "#SKIP", "C5"];
    g.trickPlayedBy = [0, 1, 2, 3]
    assert(Game.calcTrickWinner(g) == 1);
    

    console.log("trick_winner() tests passed.");
}

function test_gameplay() {
    var g = makeTestGame(4);
    var r;

    // try to shuffle before players connect
    r = Game.processPlayerAction(g, 0, {action: Game.Actions.shuffle});
    assert(!r.accepted, "Cannot shuffle until players are connected.");

    // connect all players
    g.websockets = ["1", "2", "3", "4"];

    // shuffle the cards
    g.firstBetter = 0;
    r = Game.processPlayerAction(g, 3, {action: Game.Actions.shuffle});
    assert(r.accepted, "Should be able to shuffle");

    // reject bids out of order
    r = Game.processPlayerAction(g, 2, {action: Game.Actions.makeBet, payload: []});
    assert(!r.accepted, "Cannot bet out of order");

    // Check if everyone passes
    r = Game.processPlayerAction(g, 0, {action: Game.Actions.makeBet, payload: []}); // pass
    assert(r.accepted);
    r = Game.processPlayerAction(g, 1, {action: Game.Actions.makeBet, payload: []}); // pass
    assert(r.accepted);
    r = Game.processPlayerAction(g, 2, {action: Game.Actions.makeBet, payload: []}); // pass
    assert(r.accepted);
    r = Game.processPlayerAction(g, 3, {action: Game.Actions.makeBet, payload: []}); // pass
    assert(r.accepted);
    assert(g.gameState == Game.GameState.BeforeDealing);

    // shuffle the cards
    g.firstBetter = 0;
    r = Game.processPlayerAction(g, 3, {action: Game.Actions.shuffle});
    assert(r.accepted, "Should be able to shuffle");

    // let player 0 win the bidding
    r = Game.processPlayerAction(g, 0, {action: Game.Actions.makeBet, payload: [5, "S"]}); assert(!r.accepted);
    r = Game.processPlayerAction(g, 0, {action: Game.Actions.makeBet, payload: [7, "xx"]}); assert(!r.accepted);
    r = Game.processPlayerAction(g, 0, {action: Game.Actions.makeBet, payload: [6, "S"]}); assert(r.accepted);
    r = Game.processPlayerAction(g, 1, {action: Game.Actions.makeBet, payload: [6, "C"]}); assert(r.accepted);
    r = Game.processPlayerAction(g, 2, {action: Game.Actions.makeBet, payload: [6, "D"]}); assert(r.accepted);
    r = Game.processPlayerAction(g, 3, {action: Game.Actions.makeBet, payload: [6, "H"]}); assert(r.accepted);
    r = Game.processPlayerAction(g, 0, {action: Game.Actions.makeBet, payload: [6, "H"]}); 
    assert(!r.accepted, "Can't bet lower.");
    r = Game.processPlayerAction(g, 0, {action: Game.Actions.makeBet, payload: [7, "H"]}); assert(r.accepted);
    r = Game.processPlayerAction(g, 1, {action: Game.Actions.makeBet, payload: []}); assert(r.accepted);
    r = Game.processPlayerAction(g, 2, {action: Game.Actions.makeBet, payload: []}); assert(r.accepted);
    r = Game.processPlayerAction(g, 3, {action: Game.Actions.makeBet, payload: []}); 
    assert(r.accepted, "Should be able to win betting");
    assert(g.gameState == Game.GameState.DiscardingKitty, "Winner gets the kitty");
    assert(g.hands[0].length == 13, "Winner gets the kitty");
    assert(g.turn == 0, "Winner has their turn to play first");

    // Check no one else can play now
    r = Game.processPlayerAction(g, 1, {action: Game.Actions.playCard, payload: g.hands[1][0]});    
    assert(!r.accepted, "Can't play until kitty is discarded");

    r = Game.processPlayerAction(g, 0, {action: Game.Actions.playCard, payload: g.hands[1][0]});
    assert(!r.accepted, "Can't play until kitty is discarded");

    // Discard cards you don't have
    r = Game.processPlayerAction(g, 0, {action: Game.Actions.discardKitty, payload: [g.hands[1][0], g.hands[1][1], g.hands[1][2]]});
    assert(!r.accepted, "Should handle invalid discards");

    // Discard two of the same
    r = Game.processPlayerAction(g, 0, {action: Game.Actions.discardKitty, payload: [g.hands[0][0], g.hands[0][1], g.hands[0][1]]});
    assert(!r.accepted, "Should handle invalid discards");

    // Discard less than 3
    r = Game.processPlayerAction(g, 0, {action: Game.Actions.discardKitty, payload: [g.hands[0][0], g.hands[0][1]]});
    assert(!r.accepted, "Should handle invalid discards");

    // Test serialisation 
    var s = Game.serialiseGame(g);
    var g2 = Game.deserialiseGame(s);

    // Check serialisation works
    Object.keys(g).forEach(k => {
        if (JSON.stringify(g[k]) != JSON.stringify(g2[k])) {
            console.log("Serialisation might have failed for " + k);
            console.log("g:  " + g[k]);
            console.log("g2: " + g2[k])
        }
    })
    
    // Try a legal discard
    r = Game.processPlayerAction(g, 0, {action: Game.Actions.discardKitty, payload: [g.hands[0][0], g.hands[0][1], g.hands[0][2]]});
    assert(r.accepted, "Can discard");

    // Put the game into a known state
    g.hands = [
        ["HA", "HQ"],
        ["DA", "DQ"],
        ["SA", "SQ"],
        ["CA", "CQ"],
    ];
    g.turn = 2;
    g.playerWinningBid = 1;
    g.tricksWagered = 6;
    g.trumps = "H";
    s = Game.serialiseGame(g);

    // Play a hand
    r = Game.processPlayerAction(g, 2, {action: Game.Actions.playCard, payload: "SA"}); assert(r.accepted, "Can play"); 
    r = Game.processPlayerAction(g, 3, {action: Game.Actions.playCard, payload: "CA"}); assert(r.accepted, "Can play"); 
    r = Game.processPlayerAction(g, 0, {action: Game.Actions.playCard, payload: "HA"}); assert(r.accepted, "Can play"); 
    r = Game.processPlayerAction(g, 1, {action: Game.Actions.playCard, payload: "DA"}); assert(r.accepted, "Can play"); 

    r = Game.processPlayerAction(g, 0, {action: Game.Actions.playCard, payload: "HQ"}); assert(r.accepted, "Can play"); 
    r = Game.processPlayerAction(g, 1, {action: Game.Actions.playCard, payload: "DQ"}); assert(r.accepted, "Can play"); 
    r = Game.processPlayerAction(g, 2, {action: Game.Actions.playCard, payload: "SQ"}); assert(r.accepted, "Can play"); 
    r = Game.processPlayerAction(g, 3, {action: Game.Actions.playCard, payload: "CQ"}); assert(r.accepted, "Can play"); 
   
    // check the scoreboard
    var gs = Game.getGameInfoForPlayer(g, 0);
    assert(gs.scoreboard[0].teamScores[0] == 20, 'Scoring works');
    assert(gs.scoreboard[0].teamScores[1] == -100, 'Scoring works');

    // try misere
    g = Game.deserialiseGame(s);
    g.trumps = "NT";
    g.tricksWagered = 0;
    g.playerWinningBid = 1;
    g.turn = 2;

    // Play a hand
    r = Game.processPlayerAction(g, 2, {action: Game.Actions.playCard, payload: "SA"}); assert(r.accepted, "Can play"); 
    // player 3 does not play in misere
    r = Game.processPlayerAction(g, 0, {action: Game.Actions.playCard, payload: "HA"}); assert(r.accepted, "Can play"); 
    r = Game.processPlayerAction(g, 1, {action: Game.Actions.playCard, payload: "DA"}); assert(r.accepted, "Can play"); 

    r = Game.processPlayerAction(g, 2, {action: Game.Actions.playCard, payload: "SQ"}); assert(r.accepted, "Can play"); 
    // player 3 does not play in misere
    r = Game.processPlayerAction(g, 0, {action: Game.Actions.playCard, payload: "HQ"}); assert(r.accepted, "Can play"); 
    r = Game.processPlayerAction(g, 1, {action: Game.Actions.playCard, payload: "DQ"}); assert(r.accepted, "Can play"); 

    // check the scoreboard
    var gs = Game.getGameInfoForPlayer(g, 0);
    assert(gs.scoreboard[0].teamScores[0] == 0, 'Scoring works');
    assert(gs.scoreboard[0].teamScores[1] == 250, 'Scoring works');
        
    console.log("gameplay tests passed.");
}

exports.run_tests = function() {
    test_calcTrickWinner();
    test_gameplay();
}

// for local debugging
test_calcTrickWinner();
test_gameplay();
