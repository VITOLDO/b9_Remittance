pragma solidity ^0.4.17;

import './Stoppable.sol';

contract Remittance is Stoppable {
	
	struct RemittanceStruct {
	  address sender;
	  uint amount;
	  uint deadline;
	}

	mapping(bytes32=>RemittanceStruct) public remittanceStruct;

	event LogEtherForExchangeComesIn(address indexed sender,     uint ammount, bytes32 password);
	event LogEtherForExchangeComesOut(address indexed recipient, uint ammount, bytes32 password);
	event LogWithdrawal(address indexed whom, 				     uint ammount);

	function Remittance() public {
	}

	function sendRemittance(bytes32 password, uint deadline) 
		public 
		payable 
		onlyWhenEnabled
		returns(bool) 
	{
		require(msg.value > 0);
		require(remittanceStruct[password].sender == 0);

		remittanceStruct[password] = RemittanceStruct(msg.sender, msg.value, block.number + deadline);
		LogEtherForExchangeComesIn(msg.sender, msg.value, password);

		return true;
	}

	function claimRemittance(string puzzle) 
		public 
		onlyWhenEnabled
		returns(bool) 
	{
		RemittanceStruct storage puzzledDeposit = remittanceStruct[hashHelper(puzzle, msg.sender)];
		require(puzzledDeposit.amount > 0);
		require(block.number <= puzzledDeposit.deadline);
		
		//avoid reentrance	
		var amountToSend = puzzledDeposit.amount;
		puzzledDeposit.amount = 0;
		LogEtherForExchangeComesOut(msg.sender, amountToSend, hashHelper(puzzle, msg.sender));
		msg.sender.transfer(amountToSend);

		return true;
	}

	function withdrawBackRemittance(bytes32 password) 
		public 
		onlyWhenDisabled
		returns(bool) 
	{
		RemittanceStruct storage puzzledDeposit = remittanceStruct[password];

		require(puzzledDeposit.amount > 0);
		require(block.number > puzzledDeposit.deadline);
		require(puzzledDeposit.sender == msg.sender);
		
		// avoid reentrance
		var amountToSend = puzzledDeposit.amount;
		puzzledDeposit.amount = 0;

		msg.sender.transfer(amountToSend);
		LogWithdrawal(msg.sender, amountToSend);

		return true;
	}

	function hashHelper(string password, address processor) public pure returns(bytes32) {
		return keccak256(password, processor);
	}
}