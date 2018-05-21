var Remittance = artifacts.require("./Remittance.sol");

const PromisifyWeb3 = require("../utils/promisifyWeb3.js");
PromisifyWeb3.promisify(web3);

contract('Remittance', function(accounts) {
  
  var contract;

  var owner = accounts[0]

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
      return contract.sendEther(puzzle, {from: owner, value: web3.toWei(1, 'ether')});
    })
    .then(function(txReceipt) {
      return contract.etherBalance(owner, {from: owner});
    })
    .then(function(balance) {
      assert.equal(balance, web3.toWei(1, 'ether'), "Ether balance is not correct or is in incorrect place");
      return contract.hash(puzzle, {from: owner});
    })
    .then(function(address) {
      assert.equal(owner, address, "Hash storage returned invalid address");
      return web3.eth.getBalancePromise(contract.address);
    })
    .then(function(balance){
      assert.equal(web3.toWei(1, 'ether'), balance, "Contract balance is invalid");
    }); 
  });
  

});
