var Remittance = artifacts.require("./Remittance.sol");

const PromisifyWeb3 = require("../utils/promisifyWeb3.js");
PromisifyWeb3.promisify(web3);

web3.eth.getTransactionReceiptMined = function (txnHash, interval) {
  var transactionReceiptAsync;
  interval = interval ? interval : 500;
  transactionReceiptAsync = function(txnHash, resolve, reject) {
    try {
      var receipt = web3.eth.getTransactionReceipt(txnHash);
      if (receipt == null) {
        setTimeout(function () {
          transactionReceiptAsync(txnHash, resolve, reject);
        }, interval);
      } else {
        resolve(receipt);
      }
    } catch(e) {
      reject(e);
    }
  };

  return new Promise(function (resolve, reject) {
      transactionReceiptAsync(txnHash, resolve, reject);
  });
};

var getEventsPromise = function (myFilter, count) {
  return new Promise(function (resolve, reject) {
    count = count ? count : 1;
    var results = [];
    myFilter.watch(function (error, result) {
      if (error) {
        reject(error);
      } else {
        count--;
        results.push(result);
      }
      if (count <= 0) {
        resolve(results);
        myFilter.stopWatching();
      }
    });
  });
};

contract('Remittance', function(accounts) {
  
  var contract;

  var owner = accounts[0]
  var recipient = accounts[1]

  beforeEach(function() {
    return Remittance.new({from: owner})
    .then(function(instance) {
      contract = instance;
    });
  });

  it("should be active by default", function() {
    return contract.isEnabled()
    .then(function(isEnabled) {
      assert.isTrue(isEnabled, "Contract is not enabled by default.");
    });
  });

  it("should be possible to send some ether", function() {
    var puzzle = 0;
    var blockNumber;
    var recipientBalance;
    var gasUsed;
    return contract.getKeccak256(123, 456, recipient)
    .then(function(puzzled123456) {
      puzzle = puzzled123456;
      blockNumber = web3.eth.blockNumber + 1;
      return contract.sendEther(puzzle, 20, {from: owner, value: web3.toWei(1, 'ether')});
    })
    .then(function(txReceipt) {
      return getEventsPromise(contract.LogEtherForExchangeComesIn({}, 
          {fromBlock: blockNumber, toBlock: "latest"}));
    })
    .then(function(events) {
      var eventArgs = events[0];
      assert.equal(eventArgs.args.ammount, web3.toWei(1, 'ether'), "IN Event logged ammount incorrectly");
      assert.equal(eventArgs.args.owner, owner, "IN Event logged owner incorrectly");
      return contract.hash(puzzle);
    })
    .then(function(remittanceStruct){
      assert.equal(owner, remittanceStruct[0], "Hash storage returned invalid address for owner");
      assert.equal(web3.toWei(1, 'ether'), remittanceStruct[1], "Ether balance is not correct or is in incorrect place");
      return web3.eth.getBalancePromise(contract.address);
    })
    .then(function(balance){
      assert.equal(web3.toWei(1, 'ether'), balance, "Contract balance is invalid");
      blockNumber = web3.eth.blockNumber + 1;
      return web3.eth.getBalancePromise(recipient);
    })
    .then(function(balance){
      recipientBalance = balance;
      return contract.claimFunds(123, 456, {from: recipient});
    }).then(function(txReceipt){
      gasUsed = txReceipt.receipt.gasUsed;
      return getEventsPromise(contract.LogEtherForExchangeComesOut({}, 
          {fromBlock: blockNumber, toBlock: "latest"}));
    })
    .then(function(events) {
      var eventArgs = events[0];
      assert.equal(eventArgs.args.ammount, web3.toWei(1, 'ether'), "OUT Event logged ammount incorrectly");
      assert.equal(eventArgs.args.caller, recipient, "OUT Event logged owner incorrectly");
      return contract.hash(puzzle, {from: owner});
    })
    .then(function(remittanceStruct) {
      assert.equal(remittanceStruct[1], 0, "Puzzled hash was not marked as received");
      return web3.eth.getBalancePromise(recipient);
    })
    .then(function(balance) {
      console.log(recipientBalance.toString(10));
      console.log(balance.toString(10));
      console.log((balance - recipientBalance) / gasUsed);
    });

  });
  

});
