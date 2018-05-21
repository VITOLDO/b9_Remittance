// Import the page's CSS. Webpack will know what to do with it.
import "../stylesheets/app.css";

// Import libraries we need.
import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract'

// Import our contract artifacts and turn them into usable abstractions.
import remittance_artifacts from '../../build/contracts/Remittance.json'

// Remittance is our usable abstraction, which we'll use through the code below.
var Remittance = contract(remittance_artifacts);

// The following code is simple to show off interacting with your contracts.
// As your needs grow you will likely need to change its form and structure.
// For application bootstrapping, check out window.addEventListener below.
var accounts;
var account;

window.App = {
  start: function() {
    var self = this;

    // Bootstrap the Remittance abstraction for Use.
    Remittance.setProvider(web3.currentProvider);

    // Get the initial account balance so it can be displayed.
    web3.eth.getAccounts(function(err, accs) {
      if (err != null) {
        alert("There was an error fetching your accounts.");
        return;
      }

      if (accs.length == 0) {
        alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
        return;
      }

      accounts = accs;
      account = accounts[0];

      self.refreshBalance();
    });
  },

  setStatus: function(message) {
    var status = document.getElementById("status");
    status.innerHTML = message;
  },

  refreshBalance: function() {
    var self = this;

    var remittance;
    Remittance.deployed().then(function(instance) {
      remittance = instance;
      
      web3.eth.getBalance(remittance.address, function(err, balance){
        if (err != null) {
          alert("There was an error getting contracts balance.");
          return;
        }

        var balance_element = document.getElementById("balance");
        balance_element.innerHTML = balance.toString(10);
      });
    }).catch(function(e) {
      console.log(e);
      self.setStatus("Error getting balance; see log.");
    });
  },

  sendEtherumForExchange: function() {
    var self = this;

    var amount = parseInt(document.getElementById("amount").value);
    var puzzle1 = document.getElementById("puzzleWord1").value;
    var puzzle2 = document.getElementById("puzzleWord2").value;

    this.setStatus("Initiating transaction... (please wait)");

    var remittance;
    Remittance.deployed().then(function(instance) {
      remittance = instance;
      return remittance.sendEther(puzzle1, puzzle2, {from: account, value:amount});
    }).then(function() {
      self.setStatus("Transaction complete!");
      self.refreshBalance();
    }).catch(function(e) {
      console.log(e);
      self.setStatus("Error sending coin; see log.");
    });
  },

  exchangeEtherum: function() {
    var self = this;

    var puzzle1 = document.getElementById("puzzleWord1").value;
    var puzzle2 = document.getElementById("puzzleWord2").value;

    this.setStatus("Initiating transaction... (please wait)");

    var remittance;
    Remittance.deployed().then(function(instance) {
      remittance = instance;
      return remittance.convertEtherToLoccur(puzzle1, puzzle2, {from: account});
    }).then(function(success) {
      console.log(success);
      self.setStatus("Exchange complete");
      self.refreshBalance();
    }).catch(function(err) {
      console.err(err);
      self.setStatus("Error exchanging etherum; see log.");
    });
  }
};

window.addEventListener('load', function() {
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== 'undefined') {
    console.warn("Using web3 detected from external source. If you find that your accounts don't appear or you have 0 Remittance, ensure you've configured that source properly. If using MetaMask, see the following link. Feel free to delete this warning. :) http://truffleframework.com/tutorials/truffle-and-metamask")
    // Use Mist/MetaMask's provider
    window.web3 = new Web3(web3.currentProvider);
  } else {
    console.warn("No web3 detected. Falling back to http://127.0.0.1:8545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask");
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    window.web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545"));
  }

  App.start();
});
