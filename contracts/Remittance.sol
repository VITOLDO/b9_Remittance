pragma solidity ^0.4.17;

import "./ConvertLib.sol";

contract Remittance {
	
	uint public deadline;
	address public owner;
	bool public enabled;

	mapping(bytes32=>address) public hash;
	mapping(address=>uint) public etherBalance;

	event LogEtherForExchangeComesIn(uint ammount, address owner, bytes32 puzzle);
	event LogEtherForExchangeComesOut(uint ammount, address owner, bytes32 puzzle, uint converted);
	event LogWithdrawal(address whom, uint ammount);
	event LogRemittanceShutDown(uint block);

	function Remittance(uint remittanceDeadline) public {
		owner = msg.sender;
		require(remittanceDeadline < 100);
		deadline = block.number + remittanceDeadline;
		enabled = true;
	}

	function sendEther(uint puzzle1, 
					   uint puzzle2) 
		public 
		payable 
		returns(bool) 
	{
		require(isEnabled());
		require(msg.value > 0);

		etherBalance[msg.sender] = msg.value;
		hash[keccak256(puzzle1, puzzle2)] = msg.sender;
		LogEtherForExchangeComesIn(msg.value, msg.sender, keccak256(puzzle1, puzzle2));

		return true;
	}

	function convertEtherToLoccur(uint puzzle1,
								  uint puzzle2) 
		public 
		returns(bool) 
	{
		require(isEnabled());

		if (hash[keccak256(puzzle1, puzzle2)] != 0) {
			var ammountToSend = etherBalance[hash[keccak256(puzzle1, puzzle2)]];
			etherBalance[hash[keccak256(puzzle1, puzzle2)]] = 0;
			hash[keccak256(puzzle1, puzzle2)] = 0;
			msg.sender.transfer(ammountToSend);
			LogEtherForExchangeComesOut(ammountToSend, msg.sender, keccak256(puzzle1, puzzle2), ConvertLib.convert(ammountToSend, 2));
		}

		return true;
	}

	function withdrawMyFunds() public returns(bool) {
		require(etherBalance[msg.sender] > 0);
		require(!isEnabled());

		var ammountToSend = etherBalance[msg.sender];
		etherBalance[msg.sender] = 0;

		msg.sender.transfer(etherBalance[msg.sender]);
		LogWithdrawal(msg.sender, ammountToSend);

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