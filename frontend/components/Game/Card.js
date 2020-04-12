import styles from './game.module.css';

import clubsImage from './images/clubs.jpg';
import spadesImage from './images/spades.jpg';
import heartsImage from './images/hearts.jpg';
import diamondsImage from './images/diamonds.jpg';
import jokerImage from './images/joker.jpg';

export function parseCard(card) {
    var suit;
    var value;
    var suitEmoji = "";
    var image;
    if (card == "Joker") {
        suit = "Joker";
        value = "Joker";
        image = jokerImage;
    } else {
        suit = card[0];
        value = card.slice(1);
    }

    switch (suit) {
        case 'S':
            suitEmoji = '♠️';
            image = spadesImage;
            break;
        case 'C':
            suitEmoji = '♣️';
            image = clubsImage;
            break;
        case 'H': 
            suitEmoji = '♥️';
            image = heartsImage;
            break;
        case 'D': 
            suitEmoji = '♦️';
            image = diamondsImage;
            break;
        default:

    }

    return {
        suit,
        value,
        suitEmoji,
        image
    }
}

export function cardToShortDescription(card) {
    var {value, suitEmoji} = parseCard(card);
    return value + suitEmoji;
}

export default function Card(props) {
    var card = parseCard(props.card);

    var cardText;
    if (card == "Joker") {
        cardText = "Joker";
    } else {
        cardText = card.value + card.suitEmoji;
    }

    return (
        <div 
            onClick={() => props.onClick(props.card)}
            className={styles.card + " " + styles["card" + card.suit] + " " + props.extraStyle} >
                <span className={styles.helper}></span>
                <img src={card.image} />
                <div className={styles.cardText}>{cardText}</div>
                <div className={styles.cardTextDuplicate}>{cardText}</div>
        </div>
    )
}
