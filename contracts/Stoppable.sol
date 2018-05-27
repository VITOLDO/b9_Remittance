pragma solidity ^0.4.17;

import './Owned.sol';

contract Stoppable is Owned {
	
	bool public enabled;

	function Stoppable() public {
		enabled = true;
	}

	modifier onlyWhenEnabled {
		require(enabled);
		_;
	}

	modifier onlyWhenDisabled {
		require(!enabled);
		_;
	}

	function disable() fromOwner public {
		enabled = false;
	}

	function enable() fromOwner public {
		enabled = true;
	}
}