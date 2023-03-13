// FRONT RUNNING BOT FOR PANCACKE SWAP (Using Router V2)
require("dotenv").config();
const ethers = require("ethers");
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

// PancakeSwap router.
const pancakeRouterABI = require("./ABIs/pancakeRouterABI.json");
const erc20ABI = require("./ABIs/erc20ABI.json");
const pancakeSwapRouterV2Address = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
const BNBaddress = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";

// Function to calculate the gas fee to pay. To sandwich the high value transaction.
function calculateGasPrice(action, value) {
  if (action === "buy") {
    return ethers.formatUnits(value++, "gwei");
  } else {
    // If it is a sell substract 1
    return ethers.formatUnits(value--, "gwei");
  }
}

//  Router function to interact with PancakeSwap Router
function router(ourWallet) {
  return new ethers.Contract(
    pancakeSwapRouterV2Address,
    pancakeRouterABI,
    ourWallet
  );
}

// Function to interact with the ERC20
function erc20(ourWallet, tokenAddress) {
  return new ethers.Contract(tokenAddress, erc20ABI, ourWallet);
}

// Buy function (BNB -> ERC20)
async function buy(ourWallet, tokenAddress, gasLimit, gasPrice) {
  // How much we are going to buy. (BNB to Gwei)
  const budget = 0.01;
  const buyAmount = ethers.parseUnits(budget.toString(), "ether");

  // The difference between the expected price of the trade and the final price of the trade when executed.
  const slippage = 1;

  // How many tokens we are going to receive.
  let amountOutMin = 0;

  if (slippage !== 0) {
    const amounts = await router(ourWallet).getAmountsOut(buyAmount, [
      BNBaddress,
      tokenAddress,
    ]);

    // amountOutMin = amounts[1] - (amounts[1] / 100n) * BigInt(slippage);
    amountOutMin = amounts[1] - amounts[1] * (BigInt(slippage) / BigInt(100));
  }

  // Fill up the transaction Swap
  const tx = await router(
    ourWallet
  ).swapExactETHForTokensSupportingFeeOnTransferTokens(
    amountOutMin,
    [BNBaddress, tokenAddress],
    ourWallet.address,
    Date.now() + 1000 * 60 * 10,
    {
      'value': buyAmount.toString(),
      'gasLimit': ethers.parseUnits(gasLimit.toString(), "gwei"),
      'gasPrice': ethers.parseUnits(gasPrice.toString(), "gwei"),
    }
  );

  const receipt = await tx.wait();

  // 0 = failed \\ 1 == success
  if (receipt && receipt.blockNumber && receipt.status === 1) {
    console.log(
      `Transaction https://bscscan.com/tx/${receipt.transactionHash} mined, status: success`
    );
  } else if (receipt && receipt.blockNumber && receipt.status === 0) {
    console.log(
      `Transaction https://bscscan.com/tx/${receipt.transactionHash} mined, status: failed`
    );
  } else {
    console.log(
      `Transaction https://bscscan.com/tx/${receipt.transactionHash} not mined`
    );
  }
}

// Sell function (ERC20 -> BNB)
async function sell(ourWallet, tokenAddress, gasLimit, gasPrice) {
  const slippage = 1;

  // % to sell from our balance needs to be 99% as maybe the 100% cannot be executed.
  const amountToken = 99;

  //Instance Swap contract for selling.
  const sellTokenContract = new ethers.Contract(
    pancakeSwapRouterV2Address,
    pancakeRouterABI,
    ourWallet
  );

  // Get our balance in the Token contract after purchase
  const tokenBalance = await erc20(ourWallet, tokenAddress).balanceOf(
    ourWallet.address
  );

  //99% of our balance will be sold.
  const sellAmount = tokenBalance * (amountToken / 100);

  let amountOutMin = 0;

  const amounts = await router(ourWallet).getAmountsOut(sellAmount, [
    tokenAddress,
    BNBaddress,
  ]);

  if (slippage !== 0) {
    amountOutMin = amounts[1] - amounts[1] * (BigInt(slippage) / BigInt(100));
  } else {
    amountOutMin = amounts[1];
  }

  // Approve Pancacke swap to manage our tokens.
  const approve = await sellTokenContract.approve(
    pancakeSwapRouterV2Address,
    sellAmount
  );
  const receipt_approve = await approve.wait();
  if (
    receipt_approve &&
    receipt_approve.blockNumber &&
    receipt_approve.status === 1
  ) {
    console.log(
      `Approved https://bscscan.com/tx/${receipt_approve.transactionHash}`
    );

    // Execute the transaction once the token management is approved.
    const swap_txn =
      await contract.swapExactTokensForETHSupportingFeeOnTransferTokens(
        sellAmount,
        amountOutMin,
        [tokenAddress, BNBaddress],
        ourWallet.address,
        Date.now() + 1000 * 60 * 10,
        {
          'gasLimit': ethers.parseUnits(gasLimit.toString(), "gwei"),
          'gasPrice': ethers.parseUnits(gasPrice.toString(), "gwei"),
        }
      );

    const receipt = await swap_txn.wait();

    // 0 - failed, 1 - success
    if (receipt && receipt.blockNumber && receipt.status === 1) {
      console.log(
        `Transaction https://bscscan.com/tx/${receipt.transactionHash} mined, status: success`
      );
    } else if (receipt && receipt.blockNumber && receipt.status === 0) {
      console.log(
        `Transaction https://bscscan.com/tx/${receipt.transactionHash} mined, status: failed`
      );
    } else {
      console.log(
        `Transaction https://bscscan.com/tx/${receipt.transactionHash} not mined`
      );
    }
  }
}

const main = async () => {
  // Instance JsonRpcProvider.
  const provider = new ethers.WebSocketProvider(process.env.WSS);
  // our Wallet
  const privateKey = new ethers.Wallet(process.env.PRIVATE_KEY);
  const ourWallet = privateKey.connect(provider);

  // Instance Interface
  const Interface = new ethers.Interface([
    "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline)",
    "function swapETHForExactTokens(uint amountOut, address[] calldata path, address to, uint deadline)",
    "function swapExactETHForTokensSupportingFeeOnTransferTokens(uint amountOutMin, address[] calldata path, address to, uint deadline",]);

  // Listen to the pending transactions
  provider.on("pending", (tx) => {
    provider.getTransaction(tx).then(async (transaction) => {
      // now we will only listen for pending transaction on pancakesswap factory
      if (transaction && transaction.to === pancakeSwapRouterV2Address) {
        const value = ethers.formatEther(transaction.value);
        const gasPrice = ethers.formatEther(transaction.gasPrice);
        const gasLimit = ethers.formatEther(transaction.gasLimit);

        // for example we will be only showing transaction that are higher than 30 bnb
        if (value > 1) {
          console.log(`\nValue BNB: ${value}`);
          console.log(`gasPrice: ${gasPrice}`);
          console.log(`gasLimit: ${gasLimit}`);

          // Sender
          console.log(`From: ${transaction.from}`);

          let result = [];

          //we will use try and catch to handle the error and decode the data of the function used to swap the token
          try {
            result = Interface.decodeFunctionData(
              "swapExactETHForTokens",
              transaction.data
            );
          } catch (err) {
            try {
              result = Interface.decodeFunctionData(
                "swapExactETHForTokensSupportingFeeOnTransferTokens",
                transaction.data
              );
            } catch (err) {
              try {
                result = Interface.decodeFunctionData(
                  "swapETHForExactTokens",
                  transaction.data
                );
              } catch (err) {
                if (err) {
                  console.log(err);
                  console.log(`\nFinal error: ${transaction}`);
                }
              }
            }
          }
          if (result.length > 0) {
            let tokenAddress = "";
            if (result[1].length > 0) {
              tokenAddress = result[1][1];
              console.log(`Token Address: ${tokenAddress}`);

              // Calculate the gas price for buying and selling
              const buyGasPrice = calculateGasPrice(
                "buy",
                transaction.gasPrice
              );
              const sellGasPrice = calculateGasPrice(
                "sell",
                transaction.gasPrice
              );

              // Execute the BUY! (BNB -> ERC20)
              console.log("\n-Let's buy!💰");
              await buy(
                ourWallet,
                tokenAddress,
                transaction.gasLimit,
                buyGasPrice
              );

              // Execute the SELL! (ERC20 -> BNB)
              await sell(
                ourWallet,
                tokenAddress,
                transaction.gasLimit,
                sellGasPrice
              );
            }
            console.log(`Result: ${result}`);
          }
        }
      }
    });
  });

  // Handle Node disconnection & errors.
  provider.websocket.on("error", (ep) => {
    console.log(`Unable to connect to ${ep.subdomain} retrying in 3s...`);
    setTimeout(main, 3000);
  });

  provider.websocket.on("close", (code) => {
    console.log(
      `Connection lost with code ${code}! Attempting reconnect in 3s...`
    );
    provider.websocket.terminate();

    setTimeout(main, 3000);
  });
};

main();

// Server created with Express.
app.listen(PORT, (err) => {
  console.log(`Listening on port http://localhost:${PORT}`);
});
