var uuid = require('uuid');

const GameState = {
    "BeforeDealing": "BeforeDealing",
    "Bidding": "Bidding",
    "DiscardingKitty": "DiscardingKitty",
    "Playing": "Playing",
    "Finished": "Finished"
}

const Actions = {
    "shuffle": "shuffle",
    "makeBet": "makeBet",
    "discardKitty": "discardKitty",
    "playCard": "playCard"
}

const MISERE_SCORE = 250;

var CardData = {
    // 4 player data
    4: {
        // mapping between player ID and team ID
        teams: {0:0, 1:1, 2:0, 3:1},

        // The cards must be in order of their worth
        all_cards_H: ["HA", "HK", "HQ", "HJ", "H10", "H9", "H8", "H7", "H6", "H5", "H4"],
        all_cards_D: ["DA", "DK", "DQ", "DJ", "D10", "D9", "D8", "D7", "D6", "D5", "D4"],
        all_cards_C: ["CA", "CK", "CQ", "CJ", "C10", "C9", "C8", "C7", "C6", "C5"],
        all_cards_S: ["SA", "SK", "SQ", "SJ", "S10", "S9", "S8", "S7", "S6", "S5"]
    },
    
    // 6 player data
    6: {
        // mapping between player ID and team ID
        teams: {0:0, 1:1, 2:2, 3:0, 4:1, 5:2},

        // The cards must be in order of their worth
        all_cards_H: ["HA", "HK", "HQ", "HJ", "H13", "H12", "H11", "H10", "H9", "H8", "H7", "H6", "H5", "H4", "H3", "H2"],
        all_cards_D: ["DA", "DK", "DQ", "DJ", "D13", "D12", "D11", "D10", "D9", "D8", "D7", "D6", "D5", "D4", "D3", "D2"],
        all_cards_C: ["CA", "CK", "CQ", "CJ", "C12", "C11", "C10", "C9", "C8", "C7", "C6", "C5", "C4", "C3", "C2"],
        all_cards_S: ["SA", "SK", "SQ", "SJ", "S12", "S11", "S10", "S9", "S8", "S7", "S6", "S5", "S4", "S3", "S2"]
    }
}

// Set other card data
for (let [numPlayers, data] of Object.entries(CardData)) {
    // this list must be in order of worth
    data.all_cards = [
        "Joker",
        ...data.all_cards_H,
        ...data.all_cards_D,
        ...data.all_cards_C,
        ...data.all_cards_S,
    ];

    // Filter callback for finding distinct objects in an array
    const distinct = (value, index, self) => self.indexOf(value) === index;
        
    // Define the list of suits in the game
    data.all_suits = {
        // worth is the score that gets added to the score for the number of tricks
        // Card order is an ordering scheme that places the joker and the two bowers ahead of other cards.
        "H": {
            name: "Hearts",
            worth: 60,
            left_bower: "DJ",
            card_order: ["Joker", "HJ", "DJ", ...data.all_cards_H, ...data.all_cards].filter(distinct)
        },
        "D": {
            name: "Diamonds",
            worth: 40,
            left_bower: "HJ",
            card_order: ["Joker", "DJ", "HJ", ...data.all_cards_D, ...data.all_cards].filter(distinct)
        },
        "C": {
            name: "Clubs",
            worth: 20,
            left_bower: "SJ",
            card_order: ["Joker", "CJ", "SJ", ...data.all_cards_C, ...data.all_cards].filter(distinct)
        },
        "S": {
            name: "Spades",
            worth: 0,
            left_bower: "CJ",
            card_order: ["Joker", "SJ", "CJ", ...data.all_cards_S, ...data.all_cards].filter(distinct)
        }
    };
    
    // Define the list of trump bids 
    data.all_trumps = {
        "NT": {
            name: "No Trumps",
            worth: 80,
            card_order: data.all_cards
        },
        ...data.all_suits
    };

    // Set it back into the global CardData
    CardData[numPlayers] = data;
}

// Calculate the worth of a given bid
function worthOfBid(bet) {
    // hardcode which carddata to use since they are all the same
    var cd = CardData['6'];

    // Parse bet
    if (bet.length != 2) {
        throw Error("Invalid bet.");
    }
    var tricksWagered = parseInt(bet[0]);
    var trumps = bet[1];

    // sanity check
    if (! cd.all_trumps.hasOwnProperty(trumps)) {
        throw Error("Invalid trumps suit.");
    }

    // special case for Misere
    if (tricksWagered == 0 && trumps == "NT") {
        return MISERE_SCORE;
    } else if (tricksWagered >= 6 && tricksWagered <= 10) {
        // calculate worth 
        return 100*(tricksWagered-6) + cd.all_trumps[trumps].worth + 40;
    } else {
        throw Error("Invalid bet.");
    }
}

// Convert a bid to a string
function betToString(bet) {
    if (bet[0] == 0 && bet[1] == "NT") {
        return "Misère";
    } else {
        return bet[0].toString() + " " + CardData['6'].all_trumps[bet[1]].name
    }
}

// Create a new game, returning an object representing the game state
function startGame(playerNames) {
    // remove whitespace from player names
    playerNames = playerNames.map(s => s.trim());

    // get creation time as a Unix timestamp
    var creationTime = Math.round((new Date()).getTime() / 1000);

    // create game structure
    return {
        // Set the player names
        playerNames: playerNames,

        // Generate a game ID and timestamps
        gameID: uuid.v4(),
        creationTime: creationTime,
        expiryTime: creationTime + 604800, // number of seconds in a week
        version: 0,

        // Store the websocket connection IDs (or the special flag "-" if there is no connection)
        websockets: playerNames.map(n => "-"),
        
        // Players can vote to discard and redraw (e.g. if something goes wrong)
        playersVoteToRedrawTrick: playerNames.map(n => false),

        // During the bidding phase, keep track of who has passed
        bettingPassed: playerNames.map(n => false),

        // During the betting phase, list the bet that have been made
        // This is an array of objects of the form:
        // [{
        //     playerID: __,
        //     bet: __,
        // }]
        bettingHistory: [],

        // The current trick to far
        trick: [],
        // In a no-trumps game, if the joker is led, must declare which suit it belongs to.
        notrumps_joker_suit: "",

        // The previous trick (so it can continue to be displayed by the user interface long enough for the user to see)
        previousTrick: [],
        previousTrickPlayedBy: [],

        // Who won the previous trick
        previousTrickWonBy: -1,

        // an ID number that increments (for front end to know when a new trick starts)
        trickID: 0,

        // The player ID who played each card in the trick
        trickPlayedBy: [],

        // Number of tricks won by each player
        tricksWon: playerNames.map(n => 0),
        
        // Scoreboard
        // This is an array of objects of the form:
        // [ 
        //     {
        //         tricksWagered: __,
        //         trumps: __,
        //         playerWinningBid: __,
        //         tricksWon: [_, _, _, _, _, _], // for each player
        //         teamScores: [-100, 10, 10] // for each team
        //      },
        //      { ... },
        //     ...
        // ]
        scoreboard: [],

        // The current trump suit
        // Should be one of the keys in CardData[xx].all_trumps (e.g. "NT", "H", "D", "C", "S")
        trumps: "",

        // Number of tricks that have been wagered
        tricksWagered: -1,

        // ... and by whom?
        playerWinningBid: -1,
        
        // No cards have been dealt yet
        hands: [],
        kitty: [],

        // Game state 
        gameState: GameState.BeforeDealing,

        // Whose turn is it?
        turn: -1,

        // Who will start betting?
        firstBetter: Math.floor(Math.random() * (playerNames.length)),
    }
}

// Convert a game to a document for storage in the database
function serialiseGame(game) {
    var serialisation = {};

    // These selected fields are stored at the top level 
    var mainFields = [
        "gameID",
        "version",
        "creationTime",
        "expiryTime",
        "websockets",
    ];
    mainFields.forEach(f => serialisation[f] = game[f]);

    // Other fields are stored as a JSON string.
    // This is done because DynamoDB can't store empty strings.
    var document = {};
    Object.keys(game).forEach(key => {
        if (-1 == mainFields.indexOf(key)) {
            document[key] = game[key];
        }
    })
    serialisation.document = JSON.stringify(document);
    return serialisation;
}

// Create a game structure from the database document
function deserialiseGame(serialisation) {
    // Create game object
    var game = {};

    // Set the core parameters that are stored directly in the database
    Object.keys(serialisation).forEach(key => {
        if (key != 'document') {
            game[key] = serialisation[key];
        }
    })

    // Set the keys stored as string
    Object.assign(game, JSON.parse(serialisation.document));

    // Done
    return game;
}

// Return the CardData structure for the current game
function getCardData(game) {
    return CardData[game.playerNames.length.toString()];
}

// Shuffle the cards (abandoning any round in progress, if any).
// Mutates the game object. 
// There is no return value.
function shuffleCards(game) {
    var cards = getCardData(game).all_cards.slice();
    
    // shuffle the cards by the Fisher-Yates algorithm
    for (var i = cards.length - 1; i >= 1; i--) {
        var j = Math.floor(Math.random() * (i+1));
        var temp = cards[i];
        cards[i] = cards[j];
        cards[j] = temp;
    }
    
    // assign cards to players' hands
    game.hands = [];
    for (var i = 0; i < cards.length-4; i += 10) {
        game.hands.push(cards.slice(i, i+10));
    }

    // assign remainder to the kitty
    game.kitty = cards.slice(cards.length-3, cards.length+1);

    // reset game state
    game.gameState = GameState.Bidding;
    game.trick = [];
    game.trickPlayedBy = [];
    game.tricksWon = game.playerNames.map(n => 0);
    game.trumps = "";
    game.tricksWagered = -1;
    game.playerWinningBid = -1;
    game.turn = game.firstBetter;
    game.playersVoteToRedrawTrick = game.playerNames.map(n => false);
}

// Calculate the suit of a given card.
// Input:
//   game: current game state (e.g. which suit is trumps)
//   card: the card to consider
// Return value:
//   one of "H", "D", "S", "C" corresponding to the suit of the named card
function getSuit(game, card) {
    // Special case for the joker
    if (card == "Joker") {
        return game.trumps;
    }
    
    // Special case for the left bower
    if (game.trumps != "NT") {
        if (card == getCardData(game).all_suits[game.trumps].left_bower) {
            return game.trumps;
        }
    }
    
    // Otherwise, read the suit from the first character in the card name
    return card[0];
}

// Determine which cards in the hand are legal to play. 
// Input: 
//   game: current game state
//   playerID: which player we are considering
//   card: the proposed card
// Returns:
//   true if the card is legal to play, otherwise false
function isCardLegal(game, playerID, card) {
    // Check if the card is actually in the player's hand
    if (game.hands[playerID].indexOf(card) == -1) {
        return false;
    }
    
    // Any card is legal if no card has yet been played
    if (game.trick.length == 0) {
        return true;
    }
    
    // In no trumps, the joker is always legal to play
    if (game.trumps == "NT" && card == "Joker") {
        return true;
    }
    
    // If the player can follow suit, then they must
    var proposed_suit = getSuit(game, card);
    var leading_suit;
    if (game.trick[0] == "Joker" && game.trumps == "NT") {
        leading_suit = game.notrumps_joker_suit;
    } else {
        leading_suit = getSuit(game, game.trick[0]);
    }
    var suits_in_hand = game.hands[playerID].map(c => getSuit(game, c));
    if (suits_in_hand.indexOf(leading_suit) != -1) {
        // The player can follow suit
        return (proposed_suit == leading_suit);
    } else {
        // The player can play any card
        return true;
    }
}

// check if a game is misere
function isMisere(game) {
    return game.tricksWagered == 0 && game.trumps == "NT";
}

// return the ID of the teammate of the player who bid misere
function getMisereSkippedPlayer(game) {
    if (4 == game.playerNames.length) {
        switch (game.playerWinningBid) {
            case 0: return 2;
            case 1: return 3;
            case 2: return 0;
            case 3: return 1;
        }
    } else {
        switch (game.playerWinningBid) {
            case 0: return 3;
            case 1: return 4;
            case 2: return 5;
            case 3: return 0;
            case 4: return 1;
            case 5: return 2;
        }
    }
}

// Process a move taken by a given player
// Input:
//   game: game state. Will be mutated by this function.
//   playerID: the ID of the player issuing the move.
//   action: an object of two fields: action and payload.
//   Allowable actions are:
//   { action: Actions.shuffle } --> shuffle the deck and distribute cards to players.
//   { action: Actions.makeBet, payload: [8, "H"] } --> during bidding phase, make a bet. Bet format is number of tricks then trump suit. To pass, bet format is an empty array []. For "misere", bet format is [0, "NT"]
//   { action: Actions.discardKitty, payload: [_, _, _] } --> discard 3 cards from the hand.
//   { action: Actions.playCard, payload: "DJ" } --> play the given card. Note: if the Joker is led in no-trumps, an extra field is added: "notrumps_joker_suit" giving the suit of the joker
//
// Return:
//   An object of the following form:
//    {
//        action: "gameActionResponse",
//        accepted: true / false, 
//        message: "if the action was rejected, explain why",
//        log: [{    // entry to be shown in the log of all actions taken in the game, intended to be broadcast to all players. This field is meaningless if accepted=false
//           playerID: _   // the player who did the action
//           action: _  // the action
//           payload: _ // the payload (if this information is public), or else undefined
//        }, ... ] // there can be multiple log entries (e.g. when playing a card causes a trick to be won)
//    }
//   If the accepted field of response is true, then the game state has been updated.
function processPlayerAction(game, playerID, action) {
    var response = {
        "action": "gameActionResponse",
        "message": "",
        "accepted": false,
        "log": [{}]
    };

    try {
        response.log[0].playerID = playerID;
        response.log[0].action = action.action;

        // The action depends upon the game state
        switch (game.gameState) {
            case GameState.BeforeDealing: 
                // Accept the shuffle action once all players are connected
                if (action.action == Actions.shuffle) {
                    // If we are running on the client, do nothing
                    if (game.hasOwnProperty('numberOfCardsInHand')) {
                        response.accepted = true;
                        return response;
                    }

                    if (game.websockets.every(id => id != "-")) {
                        response.accepted = true;
                        shuffleCards(game);
                        return response;
                    } else {
                        response.accepted = false;
                        response.message = "Wait for all players to connect before dealing cards.";
                        return response;
                    }
                } else {
                    // All other actions are illegal
                    response.accepted = false;
                    response.message = "You must deal the cards first.";
                    return response;
                }
            
            case GameState.Bidding:
                // Accept the makeBet action 
                if (action.action == Actions.makeBet) {

                    // Reject if it's not our turn
                    if (playerID !== game.turn) {
                        response.accepted = false;
                        response.message = "Wait your turn.";
                        return response;
                    }
                    
                    // Did the player pass?
                    if (action.payload.length == 0) {
                        // yes, it is a pass.
                        game.bettingPassed[playerID] = true;
                        response.accepted = true;
                    }

                    // Take the bet
                    else if (action.payload.length == 2) {
                        // will throw an error if this is an invalid bet
                        var worth = worthOfBid(action.payload);

                        // check if this bid is legal
                        if (game.bettingHistory.length > 0) {
                            var lastBet = game.bettingHistory[game.bettingHistory.length - 1];
                            if (worth <= worthOfBid(lastBet.bet)) {
                                response.accepted = false;
                                response.message = "Bet must be higher than the previous bet.";
                                return response;
                            }
                        }

                        // store the bid
                        game.bettingHistory.push({
                            playerID: playerID,
                            bet: [action.payload[0], action.payload[1]],
                        })
                        response.accepted = true;
                    }

                    // Else it's an invalid format
                    else {
                        response.accepted = false;
                        response.message = "Expected a payload of form [tricksWagered, trumps]";
                        return response;
                    }

                    // Calculate how many players are not passed
                    var playersStillBetting = 0;
                    for (i = 0; i < game.playerNames.length; i++) {
                        if (!game.bettingPassed[i]) {
                            playersStillBetting += 1;
                        }
                    }
                    
                    // Is betting over?
                    
                    // If no-one has bet, betting is over when everyone passes. In that case, redraw.
                    if (game.bettingHistory.length == 0 && playersStillBetting == 0) {
                        game.gameState = GameState.BeforeDealing;
                        game.bettingPassed = game.playerNames.map(n => false);
                        game.hands = [];
                        game.kitty = [];
                        game.turn = -1;
                        response.accepted = true;
                        return response;
                    }
                    
                    // If there have been bets, betting is over when everyone except one player passes.
                    if (game.bettingHistory.length > 0 && playersStillBetting == 1) {
                        // Find the winner of the bet
                        var lastBet = game.bettingHistory[game.bettingHistory.length - 1];
                        
                        // Assign the kitty to the player who won the bid
                        game.tricksWagered = lastBet.bet[0];
                        game.trumps = lastBet.bet[1];
                        game.playerWinningBid = lastBet.playerID;
                        game.gameState = GameState.DiscardingKitty;
                        game.turn = lastBet.playerID;
                        // Only on the server can we allocate the kitty, since this information is not visible at the client
                        if (!game.hasOwnProperty("numberOfCardsInHand")) {
                            game.hands[game.playerWinningBid] = game.hands[game.playerWinningBid].concat(game.kitty);
                            game.kitty = [];
                        }
                        response.accepted = true;
                        response.message = "";
                        response.log[0].payload = {action: "winBet", payload: lastBet};
                        return response;
                    }

                    // Move to the next player who hasn't passed
                    var i;
                    for (i = 0; i < game.playerNames.length; i++) {
                        game.turn = (game.turn + 1) % game.playerNames.length;
                        if (!game.bettingPassed[game.turn]) {
                            break;
                        }
                    }
                    return response;

                } else {
                    // All other actions are not acceptable
                    response.accepted = false;
                    response.message = "You must make bets first.";
                    return response;
                }

            case GameState.DiscardingKitty:
                // Allow the player who won the bet to discard the kitty

                if (playerID == game.turn) {
                    if (action.action == Actions.discardKitty) {
                        // Check that the cards discarded are legal
                        var discards = action.payload;
                        if (discards.length == 3 && discards.every(d => game.hands[playerID].indexOf(d) >= 0)) {
                            var proposedHand = game.hands[playerID].filter(c => discards.indexOf(c) == -1);
                            if (proposedHand.length == 10) {
                                response.accepted = true;
                                game.hands[playerID] = proposedHand;
                                game.gameState = GameState.Playing;
                                return response;
                            }
                        }

                        // Discard is not legal
                        response.accepted = false;
                        response.message = "Illegal discards. You must choose 3 cards from your hand to discard.";
                        return response;
                    } else {
                        response.accepted = false;
                        response.message = "You must discard cards before playing.";
                        return response;
                    }
                } else {
                    // All other actions are not acceptable
                    response.accepted = false;
                    response.message = "Wait your turn.";
                    return response;
                }

            case GameState.Playing:
                // Allow the player whose turn it is to play a legal card

                if (action.action == Actions.playCard && playerID == game.turn) {
                    var card = action.payload;

                    // Is the card legal to play?
                    if (isCardLegal(game, playerID, card)) {
                        // Special case for No Trumps when the joker is led
                        if (card == "Joker" && game.trumps == "NT" && game.trick.length == 0) {
                            if (action.hasOwnProperty("notrumps_joker_suit") && getCardData(game).all_suits.hasOwnProperty(action.notrumps_joker_suit)) {
                                game.notrumps_joker_suit = action.notrumps_joker_suit;
                            } else {
                                response.accepted = false;
                                response.message = "In a no-trumps game, when the joker is led, supply an extra parameter `notrumps_joker_suit` to indicate the suit of the joker";
                                return response;
                            }
                        }

                        // Play it
                        response.accepted = true;
                        response.log[0].payload = card;
                        game.trick.push(card);
                        game.trickPlayedBy.push(playerID);

                        // Remove it from the player's hand
                        game.hands[playerID] = game.hands[playerID].filter(c => c != card);

                        if (!checkForEndOfTrick(game)) {
                            // Trick is not finished. Move to the next player.
                            game.turn = (game.turn + 1) % game.playerNames.length;

                            // Special case for misere
                            if (isMisere(game)) {
                                if (game.turn == getMisereSkippedPlayer(game)) {
                                    // insert a special skip token
                                    game.trick.push('#SKIP');
                                    game.trickPlayedBy.push(game.turn);

                                    // Move to the next player
                                    game.turn = (game.turn + 1) % game.playerNames.length;
                                }

                                // Now the trick might be finished
                                checkForEndOfTrick(game);
                            }
                        }

                        // Done
                        return response;
                    }

                }

            default:
                // All other actions are not acceptable
                response.accepted = false;
                response.message = "Invalid action.";
                return response;            
        }
    } catch (error) {
        response.accepted = false;
        response.message = "Invalid request. " + error;
        return response;
    }    
    
    return response;
}

// Check for whether a trick is ended
function checkForEndOfTrick(game) {
    // Is the trick finished?
    if (game.trick.length == game.playerNames.length) {
        // Trick is done. Find the winner

        var winningCardID = calcTrickWinner(game);
        var winningPlayerID = game.trickPlayedBy[winningCardID];

        // Add to the score
        game.tricksWon[winningPlayerID] += 1;

        // The winner plays next
        game.turn = winningPlayerID;
        
        // Save the previous trick (for the user interface)
        game.previousTrick = game.trick;
        game.previousTrickPlayedBy = game.trickPlayedBy;
        game.previousTrickWonBy = winningPlayerID;
        game.trickID += 1;

        // Clean up
        game.notrumps_joker_suit = "";
        game.trick = [];
        game.trickPlayedBy = [];

        // Is the round finished?
        // Look at any player's hand (except the player being skipped by misere).
        // On the server we can use the player who won the bid; on the client we must
        // look at our own hand.
        var a_hand = game.hands[game.playerWinningBid];
        if (a_hand == null) {
            // on the client, we don't have access to other people's hands. Search for a hand that we can see. 
            for (var i = 0; i < game.playerNames.length; i++) {
                if (game.hands[i] !== null) {
                    a_hand = game.hands[i];
                    break;
                }
            }
        }
        if (a_hand.length == 0) {
            // All tricks have been played.

            // Add up the total points for winning tricks
            var teamScores = (game.playerNames.length == 4) ? [0,0] : [0,0,0];
            var teamWinningBid = getCardData(game).teams[game.playerWinningBid];
            // Special case for misere
            if (game.tricksWagered == 0 && game.trumps == "NT") {
                // Did the player bidding misere win any tricks?
                if (game.tricksWon[game.playerWinningBid] == 0) {
                    // success
                    teamScores[teamWinningBid] += MISERE_SCORE;
                } else {
                    // failure
                    teamScores[teamWinningBid] -= MISERE_SCORE;
                }
            } else {
                // for normal bids, get 10 points per trick (except for the team who wagered)
                var tricksWonByWageringTeam = 0;
                game.tricksWon.forEach((tricks, playerID) => {
                    var teamID = getCardData(game).teams[playerID];
                    if (teamID != teamWinningBid) {
                        teamScores[teamID] += 10*tricks;
                    } else {
                        tricksWonByWageringTeam += tricks;
                    }
                })

                // How many points were at stake?
                var pointsAtStake = 100*(game.tricksWagered-6) + getCardData(game).all_trumps[game.trumps].worth + 40

                // Did the players succeed?
                if (tricksWonByWageringTeam >= game.tricksWagered) {
                    // yes, they get the points
                    teamScores[teamWinningBid] += pointsAtStake;
                } else {
                    // no, they failed
                    teamScores[teamWinningBid] -= pointsAtStake;
                }
            }

            // Set tricksWon back to 0
            game.tricksWon = game.tricksWon.map(x => 0);

            // The next player should bid first in the next round
            game.firstBetter = (game.firstBetter + 1) % game.playerNames.length;
            
            // add to the scoreboard
            game.scoreboard.push({
                tricksWagered: game.tricksWagered,
                trumps: game.trumps,
                playerWinningBid: game.playerWinningBid,
                tricksWon: game.tricksWon,
                teamScores: teamScores
            })
            
            // done, round is finished
            game.gameState = GameState.BeforeDealing;
        }
        return true;
    } else {
        // Trick is not finished
        return false;
    }
}

// Calculate the winner of the current trick
function calcTrickWinner(game) {
    // Sanity check that all cards exist 
    var card_order = getCardData(game).all_trumps[game.trumps].card_order;
    game.trick.forEach((c,i) => {
        if (-1 == card_order.indexOf(c)) {
            // accept "#SKIP" tokens for misere games but reject other cards
            if (!(isMisere(game) 
                    && getMisereSkippedPlayer(game) == game.trickPlayedBy[i] 
                    && c == "#SKIP")) 
            {
                throw Error("Invalid card `" + c + "` was presented in a trick.");
            }
        }
    })

    // Find the leading suit
    var leading_suit = getSuit(game, game.trick[0]);

    // Special case for a leading joker
    if (game.trick[0] == "Joker" && game.trumps == "NT") {
        leading_suit = game.notrumps_joker_suit;
    }
    
    // Process each card, looking for a winner
    // The first character of each card name is its suit
    var winner = 0; 
    var previous_suit = getSuit(game, game.trick[winner]);
    for (var i = 1; i < game.trick.length; i++) {
        // Special case for the joker
        if (game.trick[i] == "Joker") {
            // This card wins if it's the joker 
            winner = i;
            break;
        }
        
        // Find the suit of this card
        var this_suit = getSuit(game, game.trick[i]);
        
        // Check which card wins:
        
        if (this_suit == game.trumps && previous_suit != game.trumps) {
            // This card trumps the previous card
            winner = i;
            previous_suit = getSuit(game, game.trick[winner]);
        } else if (this_suit == previous_suit) {
            // This card is of the same suit as the previous card. We need to check its value.
            if (card_order.indexOf(game.trick[i]) < card_order.indexOf(game.trick[winner])) {
                // This card is of higher value.
                winner = i;
            }
        }
    }
    
    // Done
    return winner;
}

// Report game status to players (reporting only information that the player should know)
function getGameInfoForPlayer(game, playerID) {
    // copy player's hands and replace other players with null 
    var hands = game.hands.slice();
    for (var i = 0; i < game.playerNames.length; i++) {
        if (i !== playerID) {
            hands[i] = null;
        }
    }

    return {
        // these whitelisted fields do not contain sensitive information
        "playerNames": game.playerNames,
        "playersConnected": game.websockets.map(ws => ws != '-'),
        "playersVoteToRedrawTrick": game.playersVoteToRedrawTrick,
        "trick": game.trick,
        "notrumps_joker_suit": game.notrumps_joker_suit,
        "previousTrick": game.previousTrick,
        "previousTrickPlayedBy": game.previousTrickPlayedBy,
        "previousTrickWonBy": game.previousTrickWonBy,
        "trickID": game.trickID,
        "trickPlayedBy": game.trickPlayedBy,
        "tricksWon": game.tricksWon,
        "scoreboard": game.scoreboard,
        "trumps": game.trumps,
        "tricksWagered": game.tricksWagered,
        "playerWinningBid": game.playerWinningBid,
        "gameState": game.gameState,
        "turn": game.turn,
        "firstBetter": game.firstBetter,
        "bettingPassed": game.bettingPassed,
        "bettingHistory": game.bettingHistory,

        // information about other players has been scrubbed out
        "hands": hands,

        // the player can see how many cards each player holds
        "numberOfCardsInHand": game.hands.map(h => h.length),
    }
}


// Set up exports
module.exports = {
    // functions that manipulate the game state
    startGame,
    serialiseGame,
    deserialiseGame,
    getGameInfoForPlayer,
    getSuit,
    isCardLegal,
    calcTrickWinner,
    processPlayerAction,
    worthOfBid,
    betToString,

    // enum constants 
    Actions,
    GameState,
    CardData,
}
