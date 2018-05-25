pragma solidity ^0.4.17;

contract Remittance {
	
	address public owner;
	bool public enabled;

	struct RemittanceStruct {
	  address owner;
	  uint amount;
	  uint deadline;
	}

	mapping(bytes32=>RemittanceStruct) public hash;

	event LogEtherForExchangeComesIn(uint ammount, address indexed owner, bytes32 puzzle);
	event LogEtherForExchangeComesOut(uint ammount, address indexed caller, bytes32 puzzle);
	event LogWithdrawal(address indexed whom, uint ammount);
	event LogRemittanceShutDown(uint block);

	function Remittance() public {
		owner = msg.sender;
		enabled = true;
	}

	function sendEther(bytes32 puzzle, uint deadline) 
		public 
		payable 
		returns(bool) 
	{
		require(isEnabled());
		require(msg.value > 0);
		require(hash[puzzle].owner == 0);

		hash[puzzle] = RemittanceStruct(msg.sender, msg.value, block.number + deadline);
		LogEtherForExchangeComesIn(msg.value, msg.sender, puzzle);

		return true;
	}

	function claimFunds(uint puzzle1,
						uint puzzle2) 
		public 
		returns(bool) 
	{
		require(isEnabled());
		RemittanceStruct storage puzzledDeposit = hash[getKeccak256(puzzle1, puzzle2, msg.sender)];
		require(puzzledDeposit.amount > 0);
		require(block.number <= puzzledDeposit.deadline);
		
		//avoid reentrance	
		var amountToSend = puzzledDeposit.amount;
		puzzledDeposit.amount = 0;
		LogEtherForExchangeComesOut(amountToSend, msg.sender, getKeccak256(puzzle1, puzzle2, msg.sender));
		msg.sender.transfer(amountToSend);

		return true;
	}

	function withdrawMyFunds(bytes32 puzzle) public returns(bool) {
		require(!isEnabled());

		RemittanceStruct storage puzzledDeposit = hash[puzzle];

		require(puzzledDeposit.amount > 0);
		require(block.number > puzzledDeposit.deadline);
		require(puzzledDeposit.owner == msg.sender);
		
		// avoid reentrance
		var amountToSend = puzzledDeposit.amount;
		puzzledDeposit.amount = 0;

		msg.sender.transfer(amountToSend);
		LogWithdrawal(msg.sender, amountToSend);

		return true;
	}

	function killSwitch() public returns(bool) {
		if (msg.sender == owner) enabled = false;

		LogRemittanceShutDown(block.number);

		return true;
	}

	function isEnabled() public constant returns(bool) {
		return (enabled);
	}

	function getKeccak256(uint p1, uint p2, address p3) public pure returns(bytes32) {
		return keccak256(p1, p2, p3);
	}
}