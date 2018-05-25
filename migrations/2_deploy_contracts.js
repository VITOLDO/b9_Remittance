var ConvertLib = artifacts.require("./ConvertLib.sol");
var Remittance = artifacts.require("./Remittance.sol");

module.exports = function(deployer) {
  deployer.deploy(ConvertLib);
  deployer.link(ConvertLib, Remittance);
  deployer.deploy(Remittance);
};
