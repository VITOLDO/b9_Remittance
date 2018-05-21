var Remittance = artifacts.require("./Remittance.sol");

const PromisifyWeb3 = require("../utils/promisifyWeb3.js");
PromisifyWeb3.promisify(web3);

contract('Remittance', function(accounts) {
  
  var contract;

  var owner = accounts[0]
  var recipient = accounts[1]

  beforeEach(function() {
    return Remittance.new(20, {from: owner})
    .then(function(instance) {
      contract = instance;
    });
  });

  it("should be active by default", function() {
    return contract.isEnabled({from: owner})
    .then(function(isEnabled) {
      assert.equal(isEnabled, true, "Contract is not enabled by default.");
    });
  });

  it("should be possible to send some ether", function() {
    var puzzle = 0;
    return contract.getKeccak256.call(123, 456)
    .then(function(puzzled123456) {
      puzzle = puzzled123456;
      console.log(puzzle);
      return contract.sendEther(puzzle, recipient, {from: owner, value: web3.toWei(1, 'ether')});
    })
    .then(function(txReceipt) {
      return contract.hash(puzzle, {from: owner});
    })
    .then(function(remittanceStruct) {
      assert.equal(recipient, remittanceStruct[0], "Hash storage returned invalid address for recipient");
      assert.equal(owner, remittanceStruct[1], "Hash storage returned invalid address for owner");
      assert.equal(web3.toWei(1, 'ether'), remittanceStruct[2], "Ether balance is not correct or is in incorrect place");
      return web3.eth.getBalancePromise(contract.address);
    })
    .then(function(balance){
      assert.equal(web3.toWei(1, 'ether'), balance, "Contract balance is invalid");
      return contract.claimFunds(123, 456, {from: recipient});
    })
    .then(function(txReceipt){
      return contract.hash(puzzle, {from: owner});
    })
    .then(function(remittanceStruct) {
      assert.isTrue(remittanceStruct[3], "Puzzled hash was not marked as received");
    }); 
  });
  

});
