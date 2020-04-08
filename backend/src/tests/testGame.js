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
        var apparent_winner = g.calcTrickWinner(trick);
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

    console.log("trick_winner() tests passed.");
}

function test_gameplay() {
    var g = makeTestGame(4);
    var r;

    // try to shuffle before players connect
    r = g.processPlayerAction(0, {action: Game.Actions.shuffle});
    assert(!r.accepted, "Cannot shuffle until players are connected.");

    // connect all players
    g.websockets = ["1", "2", "3", "4"];

    // shuffle the cards
    r = g.processPlayerAction(3, {action: Game.Actions.shuffle});
    assert(r.accepted, "Should be able to shuffle");

    // Decide who wins the bidding
    r = g.processPlayerAction(0, {action: Game.Actions.winBet, payload: [10, "H"]});
    assert(r.accepted, "Should be able to win betting");

    // Check no one else can play now
    r = g.processPlayerAction(1, {action: Game.Actions.playCard, payload: g.hands[1][0]});    
    assert(!r.accepted, "Can't play until kitty is discarded");

    r = g.processPlayerAction(0, {action: Game.Actions.playCard, payload: g.hands[1][0]});
    assert(!r.accepted, "Can't play until kitty is discarded");

    // Discard cards you don't have
    r = g.processPlayerAction(0, {action: Game.Actions.discardKitty, payload: [g.hands[1][0], g.hands[1][1], g.hands[1][2]]});
    assert(!r.accepted, "Should handle invalid discards");

    // Discard two of the same
    r = g.processPlayerAction(0, {action: Game.Actions.discardKitty, payload: [g.hands[0][0], g.hands[0][1], g.hands[0][1]]});
    assert(!r.accepted, "Should handle invalid discards");

    // Discard less than 3
    r = g.processPlayerAction(0, {action: Game.Actions.discardKitty, payload: [g.hands[0][0], g.hands[0][1]]});
    assert(!r.accepted, "Should handle invalid discards");

    // Test serialisation 
    var s = g.toDocument();
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
    r = g.processPlayerAction(0, {action: Game.Actions.discardKitty, payload: [g.hands[0][0], g.hands[0][1], g.hands[0][2]]});
    assert(r.accepted, "Can discard");

    // Put the game into a known state
    g.hands = [
        ["HA", "HQ"],
        ["DA", "DQ"],
        ["SA", "SQ"],
        ["CA", "CQ"],
    ];
    g.turn = 2;

    // Play a hand
    r = g.processPlayerAction(2, {action: Game.Actions.playCard, payload: "SA"}); assert(r.accepted, "Can play"); 
    r = g.processPlayerAction(3, {action: Game.Actions.playCard, payload: "CA"}); assert(r.accepted, "Can play"); 
    r = g.processPlayerAction(0, {action: Game.Actions.playCard, payload: "HA"}); assert(r.accepted, "Can play"); 
    r = g.processPlayerAction(1, {action: Game.Actions.playCard, payload: "DA"}); assert(r.accepted, "Can play"); 

    r = g.processPlayerAction(0, {action: Game.Actions.playCard, payload: "HQ"}); assert(r.accepted, "Can play"); 
    r = g.processPlayerAction(1, {action: Game.Actions.playCard, payload: "DQ"}); assert(r.accepted, "Can play"); 
    r = g.processPlayerAction(2, {action: Game.Actions.playCard, payload: "SQ"}); assert(r.accepted, "Can play"); 
    r = g.processPlayerAction(3, {action: Game.Actions.playCard, payload: "CQ"}); assert(r.accepted, "Can play"); 
   
    
    console.log(JSON.stringify(r, null, 2));
    console.log(JSON.stringify(g.toDocument(), null, 2));
    
    console.log("gameplay tests passed.");
}

exports.run_tests = function() {
    test_calcTrickWinner();
    test_gameplay();
}

// for local debugging
test_gameplay();