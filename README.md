# Front Running / Sniper / Sandwich Bot for Sandwiching Transactions
### 🐰 <a href="https://pancakeswap.finance/">Pancake Swap</a> - Binance Smart Chain 🐰

<img width="600" alt="Captura de pantalla 2023-03-09 123256" src="https://user-images.githubusercontent.com/102038261/224323139-c40115e2-8c3a-4aad-8cbb-ad31dd9d7a26.png">

This is a front running bot designed to sandwich transactions with high value on the Pancake Swap DEX on the Binance Smart Chain. The bot monitors the mempool for high-value transactions and then attempts to get ahead of them by submitting its own transaction with a slightly higher gas price. Once the bot's transaction is confirmed, it then submits a second transaction with a lower gas price to complete the sandwich.

## Getting Started

<img width="500" alt="image" src="https://user-images.githubusercontent.com/102038261/224335705-8677583b-da35-4d21-8578-a2b985b7b0f8.png">


### Prerequisites
To use this bot, you'll need:

- An BSC Wss Node, such as QuickNode, that supports Binance Smart Chain. I used <a href="https://getblock.io/">GetBlock.io</a> (As you get 40K free requests per day)
- A wallet with enough funds to cover the gas fees for the transactions
- Knowledge of JavaScript and Node.js

### Installation
To install the bot, simply clone the repository and install the dependencies:

Copy code
```
git clone https://github.com/CristianRicharte6/Front-Running-Bot
cd Front-Running-Bot
npm install
```
### Configuration
Before running the bot, you'll need to configure it with your BSC node and wallet information. Copy the example.env file and rename it to .env. Then fill in the following fields:
```
PORT=<Port>
WSS=<wss Node Url>
PRIVATE_KEY=<the private key of your wallet>
```

You can also update the next fields in the bot.js:
```
line41: const budget = "How much you would like to buy when the bot executes the transaction"
```
```
line198: if (value > "It will filter transactions with higer value than this number") {}
```

### Running the Bot

To run the bot, simply run the following command:

```
nodemon bot.js
```
  
The bot will start monitoring the mempool for high-value transactions on Pancake Swap router V2 and attempt to sandwich them.

## Contributing
If you'd like to contribute to this project, please fork the repository and submit a pull request. Before submitting a pull request, please make sure that your code adheres to the project's style guidelines and passes all tests.

## License
This project is licensed under the MIT License.
