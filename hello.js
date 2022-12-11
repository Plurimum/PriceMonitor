const URL = getSecretURL();
const ADDRESSES = require("./addresses.json");
const ABI = require("./ABI.json");
const Web3 = require('web3');
const web3 = new Web3(URL);

// imitation of a secret url request
function getSecretURL() {
    return require("./secrets_storage.json").url;
}

async function getLastPrice(contract) {
    const lastBlockNumber = await web3.eth.getBlock("latest")
        .then(block => block.number);
    console.log(lastBlockNumber)
    
    contract.getPastEvents(
        "AnswerUpdated",
        { fromBlock: lastBlockNumber }
    ).then(events => console.log(events[0]))
}

async function monitor() {
    const contract = new web3.eth.Contract(ABI, ADDRESSES.ETH_USD);

    const aggregatorAddress = await contract.methods.aggregator().call();
    console.log("aggregator: " + aggregatorAddress)

    const realContract = new web3.eth.Contract(ABI, aggregatorAddress);
    const event = realContract.events.AnswerUpdated(
        {fromBlock: "latest"},
        (error, event) => console.log(event)
    )
        .on("connected", subId => console.log(`realContract subId: ${subId}`))
        .on("data", event => console.log(`realContract 'data' event: ${event}`))
        .on("changed", event => console.log(`realContract 'changed' event: ${event}`))
        .on("error", (error, receipt) => console.log(`realContract 'error' error: ${error}\n receipt: ${receipt}`));

    await getLastPrice(realContract);
}

monitor();