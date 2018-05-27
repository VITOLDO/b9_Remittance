var Owned = artifacts.require("./Owned.sol");
var Stoppable = artifacts.require("./Stoppable.sol");
var Remittance = artifacts.require("./Remittance.sol");

module.exports = function(deployer) {
  deployer.deploy(Owned);
  deployer.link(Owned, Stoppable);
  deployer.deploy(Stoppable);
  deployer.link(Stoppable, Remittance);
  deployer.deploy(Remittance);
};
