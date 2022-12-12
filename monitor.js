const URL = getSecretURL();
const ADDRESSES = require("./addresses.json");
const ABI = require("./ABI.json");
const Web3 = require('web3');
const events = require("events");
const web3 = new Web3(URL);
const HARDCODED_FROM_BLOCK = 16162500; // hardcoded because we can't know how many blocks ago was the last event received

// imitation of requesting a secret url
function getSecretURL() {
    return require("./secrets_storage.json").url;
}

function CurrencyQuotation(pairObj, contractObj) {
    this.pair = pairObj;
    this.contract = contractObj;
}

async function getContract(address) {
    return Promise.resolve(new web3.eth.Contract(ABI, address[1]))
        .then(contract => contract.methods.aggregator().call())
        .then(aggregatorAddress => new web3.eth.Contract(ABI, aggregatorAddress))
        .then(contract => new CurrencyQuotation(address[0], contract));
}

function parseEvent(pair, event) {
    //return event;
    return `${pair} price: ${event.returnValues.current} updatedAt: ${millisToDateTime(event.returnValues.updatedAt * 1000)}`;
}

function millisToDateTime(millis) {
    return new Date(millis);
}

async function getLastPrice(currencyQuotation) {
    currencyQuotation.then(currQuot =>
        currQuot.contract.getPastEvents(
            "AnswerUpdated",
            {fromBlock: HARDCODED_FROM_BLOCK}
        ).then(events => console.log(parseEvent(currQuot.pair, events[events.length - 1])))
    );
}

async function subscribeOnNewPrices(currencyQuotation) {
    currencyQuotation.then(currQuot =>
        currQuot.contract.events.AnswerUpdated(
            {fromBlock: "latest"}
        )
            .on("data", event => console.log(parseEvent(currQuot.pair, event)))
    );
}

async function monitor() {
    const contracts = Object.entries(ADDRESSES)
        .map(getContract);

    contracts.forEach(getLastPrice);
    contracts.forEach(subscribeOnNewPrices)
}

monitor();