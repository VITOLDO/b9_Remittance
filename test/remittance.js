var Remittance = artifacts.require("./Remittance.sol");

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
    var hashForAddress = 0;
    return contract.sendEther(123, 456, {from: owner, value: web3.toWei(1, 'ether')})
    .then(function(txReceipt) {
      return contract.getKeccak256(123, 456, {from: owner});
    })
    .then(function(hash) {
       hashForAddress = hash;
      return contract.etherBalance(owner, {from: owner});
    })
    .then(function(balance) {
      assert.equal(balance, web3.toWei(1, 'ether'), "Ether balance is not correct or is in incorrect place");
      return contract.hash(hashForAddress, {from: owner});
    })
    .then(function(address) {
      assert.equal(owner, address, "Hash storage returned invalid address");
      return contract.balance({from:owner});
    })
    .then(function(balance){
      assert.equal(web3.toWei(1, 'ether'), balance, "Contract balance is invalid");
    }); 
  });
  

});
