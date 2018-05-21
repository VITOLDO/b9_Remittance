pragma solidity ^0.4.17;

contract Remittance {
	
	uint public deadline;
	address public owner;
	bool public enabled;

	struct RemittanceStruct {
	  address recipient;
	  address owner;
	  uint amount;
	  bool received;
	  // ... etc.
	}

	mapping(bytes32=>RemittanceStruct) public hash;

	event LogEtherForExchangeComesIn(uint ammount, address indexed owner, bytes32 puzzle);
	event LogEtherForExchangeComesOut(uint ammount, address indexed owner, bytes32 puzzle);
	event LogWithdrawal(address indexed whom, uint ammount);
	event LogRemittanceShutDown(uint block);

	function Remittance(uint remittanceDeadline) public {
		owner = msg.sender;
		require(remittanceDeadline < 100);
		deadline = block.number + remittanceDeadline;
		enabled = true;
	}

	function sendEther(bytes32 puzzle, address recipient) 
		public 
		payable 
		returns(bool) 
	{
		require(isEnabled());
		require(msg.value > 0);

		hash[puzzle] = RemittanceStruct(recipient, msg.sender, msg.value, false);
		LogEtherForExchangeComesIn(msg.value, msg.sender, puzzle);

		return true;
	}

	function claimFunds(uint puzzle1,
						uint puzzle2) 
		public 
		returns(bool) 
	{
		require(isEnabled());
		RemittanceStruct storage puzzledDeposit = hash[keccak256(puzzle1, puzzle2)];
		require(puzzledDeposit.amount > 0);
		require(!puzzledDeposit.received);
		require(puzzledDeposit.recipient == msg.sender);
		
		//avoid reentrance	
		puzzledDeposit.received = true;
		msg.sender.transfer(puzzledDeposit.amount);
		LogEtherForExchangeComesOut(puzzledDeposit.amount, msg.sender, keccak256(puzzle1, puzzle2));	

		return true;
	}

	function withdrawMyFunds(bytes32 puzzle) public returns(bool) {
		require(!isEnabled());

		RemittanceStruct storage puzzledDeposit = hash[puzzle];

		require(puzzledDeposit.amount > 0);
		require(!puzzledDeposit.received);
		require(puzzledDeposit.owner == msg.sender);
		
		// avoid reentrance
		puzzledDeposit.received = true;

		msg.sender.transfer(puzzledDeposit.amount);
		LogWithdrawal(msg.sender, puzzledDeposit.amount);

		return true;
	}

	function killSwitch() public returns(bool) {
		if (msg.sender == owner) enabled = false;

		LogRemittanceShutDown(block.number);

		return true;
	}

	function isEnabled() public constant returns(bool) {
		return (enabled && block.number < deadline);
	}

	function getKeccak256(uint p1, uint p2) public pure returns(bytes32) {
		return keccak256(p1, p2);
	}
}