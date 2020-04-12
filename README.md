# Online game of 500 

This is the source code of https://500.bwp.io.

This is an online version of the card game 500, created during Covid19 isolation. I made this to play card games with my friends and also to learn about serverless architectures and the React web framework. 

## Architecture overview

The backend is a serverless application running on AWS Lambda. Game state is stored in DynamoDB. Each player opens a websocket connection. In the serverless architecture, each websocket message is processed by a separate instance of the function. The function reads the game state from DynamoDB, modifies the state according to the action that the player took, transmits the updated state to all other clients, and saves the new state into the database.

## Code structure

 * Game logic is in `backend/src/game/`
 * Database logic sin `backend/src/database`
 * The frontend is a React+Redux application in `frontend`

