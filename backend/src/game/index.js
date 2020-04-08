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
    "winBet": "winBet",
    "discardKitty": "discardKitty",
    "playCard": "playCard"
}

// Contains the game rules, checks the winner, etc.
class Game {
    // Don't call the constructor directory, instead use the factory functions
    // startGame and deserialiseGame defined below
    constructor(playerNames, serialisation) {
        // Option 1: called from startGame in which case playerNames are provided
        if (playerNames != null) {
            // Set the player names
            this.playerNames = playerNames;
            this.numberOfPlayers = playerNames.length;

            // Generate a game ID and timestamps
            this.gameID = uuid.v4();
            this.creationTime = Math.round((new Date()).getTime() / 1000);
            this.expiryTime = this.creationTime + 604800; // number of seconds in a week
            this.version = 0;

            // Store the websocket connection IDs (or the special flag "-" if there is no connection)
            this.websockets = this.playerNames.map(n => "-");
            
            // Players can vote to discard and redraw (e.g. if something goes wrong)
            this.playersVoteToRedrawTrick = this.playerNames.map(n => false);

            // The current trick to far
            this.trick = [];
            // In a no-trumps game, if the joker is led, must declare which suit it belongs to.
            this.notrumps_joker_suit = "";

            // The player ID who played each card in the trick
            this.trickPlayedBy = [];

            // Number of tricks won by each player
            this.tricksWon = this.playerNames.map(n => 0);
            
            // Points won by each player
            this.pointsWon = this.playerNames.map(n => 0);

            // The current trump suit
            // Should be one of the keys in all_trumps (e.g. "NT", "H", "D", "C", "S")
            this.trumps = "";
            // Number of tricks that have been wagered
            this.tricksWagered = -1;
            // ... and by whom?
            this.playerWinningBid = -1;
            
            // No cards have been dealt yet
            this.hands = [];
            this.kitty = [];

            // Game state 
            this.gameState = GameState.BeforeDealing;

            // Whose turn is it?
            this.turn = -1; 

            // Who will start betting?
            this.firstBetter = Math.floor(Math.random() * (this.numberOfPlayers));
        }

        // Option 2: called from deserialiseGame in which case the serialisation parameter is provided
        else if (serialisation != null) {
            // Set the core parameters that are stored directly in the database
            Object.keys(serialisation).forEach(key => {
                if (key != 'document') {
                    this[key] = serialisation[key];
                }
            })

            // Set the keys stored as string
            Object.assign(this, JSON.parse(serialisation.document));

            // Set calculated fields
            this.numberOfPlayers = this.playerNames.length;
        }

        else {
            throw Error("Constructor must be called with either playerNames or a serialisation of a previous game.");
        }
        
        // Set static data
        this.setCardData();
    }

    // Set the deck of cards based upon the number of players
    setCardData() {
        // Create a list of all the cards in the deck, in order of their worth
        if (this.numberOfPlayers == 4) {
            this.all_cards = [
                // The cards within each suit must be in order of their worth
                "Joker",
                // hearts:
                "HA", "HK", "HQ", "HJ", "H10", "H9", "H8", "H7", "H6", "H5", "H4",
                // diamonds:
                "DA", "DK", "DQ", "DJ", "D10", "D9", "D8", "D7", "D6", "D5", "D4",
                // clubs:
                "CA", "CK", "CQ", "CJ", "C10", "C9", "C8", "C7", "C6", "C5",
                // spades:
                "SA", "SK", "SQ", "SJ", "S10", "S9", "S8", "S7", "S6", "S5"
            ];
        } else if (this.numberOfPlayers == 6) {
            this.all_cards = [
                // The cards within each suit must be in order of their worth
                "Joker",
                // hearts:
                "HA", "HK", "HQ", "HJ", "H13", "H12", "H11", "H10", "H9", "H8", "H7", "H6", "H5", "H4", "H3", "H2",
                // diamonds:
                "DA", "DK", "DQ", "DJ", "D13", "D12", "D11", "D10", "D9", "D8", "D7", "D6", "D5", "D4", "D3", "D2",
                // clubs:
                "CA", "CK", "CQ", "CJ", "C12", "C11", "C10", "C9", "C8", "C7", "C6", "C5", "C4", "C3", "C2",
                // spades:
                "SA", "SK", "SQ", "SJ", "S12", "S11", "S10", "S9", "S8", "S7", "S6", "S5", "S4", "S3", "S2"
            ];
        } else {
            throw "Only 4 and 6 player games have been implemented.";
        }
        
        // Filter callback for finding distinct objects in an array
        const distinct = (value, index, self) => self.indexOf(value) === index;
        
        // Define the list of suits in the game
        this.all_suits = {
            // worth is the score that gets added to the score for the number of tricks
            // Card order is an ordering scheme that places the joker and the two bowers ahead of other cards.
            "H": {
                name: "Hearts",
                worth: 60,
                left_bower: "DJ",
                card_order: ["Joker", "HJ", "DJ", ...this.all_cards].filter(distinct)
            },
            "D": {
                name: "Diamonds",
                worth: 40,
                left_bower: "HJ",
                card_order: ["Joker", "DJ", "HJ", ...this.all_cards].filter(distinct)
            },
            "C": {
                name: "Clubs",
                worth: 20,
                left_bower: "SJ",
                card_order: ["Joker", "CJ", "SJ", ...this.all_cards].filter(distinct)
            },
            "S": {
                name: "Spades",
                worth: 0,
                left_bower: "CJ",
                card_order: ["Joker", "SJ", "CJ", ...this.all_cards].filter(distinct)
            }
        };
        
        // Define the list of trump bids 
        this.all_trumps = {
            "NT": {
                name: "No Trumps",
                worth: 80,
                card_order: this.all_cards
            },
            ...this.all_suits
        };
    }

    // Serialise 
    toDocument() {
        var doc = {};
        var fieldsToSave = [
            "playerNames",
            "playersVoteToRedrawTrick",
            "trick",
            "notrumps_joker_suit",
            "trickPlayedBy",
            "tricksWon",
            "pointsWon",
            "trumps",
            "tricksWagered",
            "playerWinningBid",
            "hands",
            "kitty",
            "gameState",
            "turn",
            "firstBetter"
        ];
        fieldsToSave.forEach(f => doc[f] = this[f]);
        return {
            gameID: this.gameID,
            version: this.version,
            creationTime: this.creationTime,
            expiryTime: this.expiryTime,
            websockets: this.websockets,
            document: JSON.stringify(doc)
        };
    }

    // Process a move taken by a given player
    // Input:
    //   playerID: the ID of the player issuing the move.
    //   action: an object of two fields: action and payload.
    //   Allowable actions are:
    //   { action: Actions.shuffle } --> shuffle the deck and distribute cards to players.
    //   { action: Actions.winBet, payload: [8, "H"] } --> notify that this player wins the betting. Bet format is number of tricks then trump suit. The payload can also be the string "misere"
    //   { action: Actions.discardKitty, payload: [_, _, _] } --> discard 3 cards from the hand.
    //   { action: Actions.playCard, payload: "DJ" } --> play the given card. Note: if the Joker is led in no-trumps, an extra field is added: "notrumps_joker_suit" giving the suit of the joker
    
    // Return:
    //   An object of the following form:
    //   {
    //       action: "gameActionResponse",
    //       accepted: true / false,
    //       message: "if the action was rejected, explain why",
    //       log: [{    // entry to be shown in the log of all actions taken in the game, intended to be broadcast to all players. This field is meaningless if accepted=false
    //           playerID: _   // the player who did the action
    //           action: _  // the action
    //           payload: _ // the payload (if this information is public), or else undefined
    //       }, ... ] // there can be multiple log entries (e.g. when playing a card causes a trick to be won)
    //    }
    //   If the accepted field of the return value is true, then the game state has been updated.
    processPlayerAction(playerID, action) {
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
            switch (this.gameState) {
                case GameState.BeforeDealing: 
                    // Accept the shuffle action once all players are connected
                    if (action.action == Actions.shuffle) {
                        if (this.websockets.every(id => id != "-")) {
                            response.accepted = true;
                            this.shuffleCards();
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
                    // Accept the winBet action
                    if (action.action == Actions.winBet) {
                        // Check input data

                        // Default rejection
                        response.accepted = false;
                        response.message = "Invalid bet.";

                        // Special case for misere
                        if (action.payload == "misere") {
                            response.accepted = true;
                            this.trumps = "NT";
                            this.tricksWagered = 0;
                        }

                        // Check normal bets
                        var tricksWagered = parseInt(action.payload[0]);
                        var trumps = action.payload[1];
                        if (tricksWagered >= 6 && tricksWagered <= 10 && this.all_trumps.hasOwnProperty(trumps)) {
                            response.accepted = true;
                            this.tricksWagered = tricksWagered;
                            this.trumps = trumps;
                        }

                        // Assign the kitty to the player who won the bid
                        if (response.accepted) {
                            this.playerWinningBid = playerID;
                            this.hands[this.playerWinningBid] = this.hands[this.playerWinningBid].concat(this.kitty);
                            this.kitty = [];
                            this.gameState = GameState.DiscardingKitty;
                            this.turn = playerID;
                            response.log[0].payload = action.payload;
                            return response;
                        }

                        return response;

                    } else {
                        // All other actions are not acceptable
                        response.accepted = false;
                        response.message = "Talk to your friends and decide who wins the bid first.";
                        return response;
                    }

                case GameState.DiscardingKitty:
                    // Allow the player who won the bet to discard the kitty

                    if (playerID == this.turn) {
                        if (action.action == Actions.discardKitty) {
                            // Check that the cards discarded are legal
                            var discards = action.payload;
                            if (discards.length == 3 && discards.every(d => this.hands[playerID].indexOf(d) >= 0)) {
                                var proposedHand = this.hands[playerID].filter(c => discards.indexOf(c) == -1);
                                if (proposedHand.length == 10) {
                                    response.accepted = true;
                                    this.hands[playerID] = proposedHand;
                                    this.gameState = GameState.Playing;
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

                    if (action.action == Actions.playCard && playerID == this.turn) {
                        // Is the card legal to play?
                        var card = action.payload;
                        if (this.isCardLegal(this.trick, card, this.hands[playerID])) {

                            // Special case for No Trumps when the joker is led
                            if (card == "Joker" && this.trick.length == 0) {
                                if (action.hasOwnProperty("notrumps_joker_suit") && this.all_suits.hasOwnProperty(action.notrumps_joker_suit)) {
                                    this.notrumps_joker_suit = action.notrumps_joker_suit;
                                } else {
                                    response.accepted = false;
                                    response.message = "In a no-trumps game, when the joker is led, supply an extra parameter `notrumps_joker_suit` to indicate the suit of the joker";
                                    return response;
                                }
                            }

                            // Play it
                            response.accepted = true;
                            response.log[0].payload = card;
                            this.trick.push(card);
                            this.trickPlayedBy.push(playerID);

                            // Remove it from the player's hand
                            this.hands[playerID] = this.hands[playerID].filter(c => c != card);

                            // Is the trick finished?
                            if (this.trick.length == this.numberOfPlayers) {
                                // Trick is done. Find the winner

                                var winningCardID = this.calcTrickWinner(this.trick, this.notrumps_joker_suit);
                                var winningCard = this.trick[winningCardID];
                                var winningPlayerID = this.trickPlayedBy[winningCardID];

                                // Add to the score
                                this.tricksWon[winningPlayerID] += 1;

                                // The winner plays next
                                this.turn = winningPlayerID;
                                
                                // Add to the log
                                response.log.push({
                                    playerID: -1,
                                    action: "trickWon",
                                    payload: [winningPlayerID, winningCard]
                                });

                                // Clean up
                                this.notrumps_joker_suit = "";
                                this.trick = [];
                                this.trickPlayedBy = [];

                                // Is the round finished?
                                if (this.hands[0].length == 0) {
                                    // All tricks have been played.
                                    // Add up the totals.

                                    // TODO scoring etc.
                                    this.gameState = GameState.BeforeDealing;
                                }


                            } else {
                                // Trick is not finished. Move to the next player.
                                this.turn = (this.turn + 1) % this.numberOfPlayers;
                            }

                            // Done
                            return response;
                        }

                    }

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

    // Shuffle the cards and set this.hands and this.kitty 
    shuffleCards() {
        var cards = this.all_cards.slice();
        
        // shuffle the cards by the Fisher-Yates algorithm
        for (var i = cards.length - 1; i >= 1; i--) {
            var j = Math.floor(Math.random() * (i+1));
            var temp = cards[i];
            cards[i] = cards[j];
            cards[j] = temp;
        }
        
        // assign cards to players' hands
        this.hands = [];
        for (var i = 0; i < cards.length-4; i += 10) {
            this.hands.push(cards.slice(i, i+10));
        }

        // assign remainder to the kitty
        this.kitty = cards.slice(cards.length-3, cards.length+1);

        // reset any votes to abandon the hand
        this.playersVoteToRedrawTrick = this.playerNames.map(n => false);

        // update game state
        this.gameState = GameState.Bidding;
        this.trick = [];
        this.trumps = "";
        this.tricksWagered = -1;
        this.playerWinningBid = -1;        
    }


    // Calculate the suit of a given card.
    // Input:
    //   card: the card to consider
    //   trumps: which suit is trumps, e.g. "NT", "H", "D", ...
    // Return value:
    //   one of "H", "D", "S", "C" corresponding to the suit of the named card
    getSuit(card) {
        // Special case for the joker
        if (card == "Joker") {
            return this.trumps;
        }
        
        // Special case for the left bower
        if (this.trumps != "NT") {
            if (card == this.all_suits[this.trumps].left_bower) {
                return this.trumps;
            }
        }
        
        // Read the suit from the first character in the card name
        return card[0];
    }

    // Calculate the winner of a trick.
    // Input:
    //   trick: array of all played cards
    //   notrumps_led_joker_suit: in the case of no trumps, when the joker is led, it must be declared which suit it belongs to
    calcTrickWinner(trick, notrumps_led_joker_suit) {

        // Sanity check that all cards exist 
        var card_order = this.all_trumps[this.trumps].card_order;
        trick.forEach(c => {
            if (-1 == card_order.indexOf(c)) {
                throw "Invalid card `" + c + "` was presented in a trick.";
            }
        })

        // Find the leading suit
        var leading_suit = this.getSuit(trick[0]);

        // Special case for a leading joker
        if (trick[0] == "Joker" && this.trumps == "NT") {
            leading_suit = notrumps_led_joker_suit;
        }
        
        // Process each card, looking for a winner
        // The first character of each card name is its suit
        var winner = 0; 
        var previous_suit = this.getSuit(trick[winner]);
        for (var i = 1; i < trick.length; i++) {
            // Special case for the joker
            if (trick[i] == "Joker") {
                // This card wins if it's the joker 
                winner = i;
                break;
            }
            
            // Find the suit of this card
            var this_suit = this.getSuit(trick[i]);
            
            // Check which card wins:
            
            if (this_suit == this.trumps && previous_suit != this.trumps) {
                // This card trumps the previous card
                winner = i;
                previous_suit = this.getSuit(trick[winner]);
            } else if (this_suit == previous_suit) {
                // This card is of the same suit as the previous card. We need to check its value.
                if (card_order.indexOf(trick[i]) < card_order.indexOf(trick[winner])) {
                    // This card is of higher value.
                    winner = i;
                }
            }
        }
        
        // Done
        return winner;
    }

    // Determine which cards in the hand are legal to play. 
    // Input: 
    //   trick_so_far: array of cards that have been played so far
    //   card: the proposed card
    //   cards_in_hand: the cards that remain in the player's hand
    // Returns:
    //   true if the card is legal to play, otherwise false
    isCardLegal(trick_so_far, card, cards_in_hand) {
        // Check if the card is actually in the player's hand
        if (cards_in_hand.indexOf(card) == -1) {
            return false;
        }
        
        // Any card is legal if no card has yet been played
        if (trick_so_far.length == 0) {
            return true;
        }
        
        // In no trumps, the joker is always legal to play
        if (this.trumps == "NT" && card == "Joker") {
            return true;
        }
        
        // If the player can follow suit, then they must
        var proposed_suit = this.getSuit(card);
        var leading_suit = this.getSuit(trick_so_far[0]);
        var suits_in_hand = cards_in_hand.map(c => this.getSuit(c));
        if (suits_in_hand.indexOf(leading_suit) != -1) {
            // The player can follow suit
            return (proposed_suit == leading_suit);
        } else {
            // The player can play any card
            return true;
        }
    }

    // Report game status to players
    getGameStatus(playerID) {
        return {
            "action": "gameStatus",
            "payload": {
                "playerNames": this.playerNames,
                "playersConnected": this.websockets.map(ws => ws != '-'),
                "playersVoteToRedrawTrick": this.playersVoteToRedrawTrick,
                "trick": this.trick,
                "notrumps_joker_suit": this.notrumps_joker_suit,
                "trickPlayedBy": this.trickPlayedBy,
                "tricksWon": this.tricksWon,
                "pointsWon": this.pointsWon,
                "trumps": this.trumps,
                "tricksWagered": this.tricksWagered,
                "playerWinningBid": this.playerWinningBid,
                "gameState": this.gameState,
                "turn": this.turn,
                "firstBetter": this.firstBetter,
                
                "yourHand": this.hands[playerID],
                "numberOfCardsInHand": this.hands.map(h => h.length),
            }
        }
    }
}


// Set up exports
exports.Game = Game;
exports.startGame = function(playerNames) {
    return new Game(playerNames, null);
}
exports.deserialiseGame = function(serialisation) {
    return new Game(null, serialisation);
}
exports.Actions = Actions;

