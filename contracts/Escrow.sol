// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "hardhat/console.sol";

contract Escrow {
    address public arbiter1;
    address public arbiter2;
    address public beneficiary;
    address public depositor;

    bool public isApprovedByArbiter1;
    bool public isApprovedByArbiter2;
    bool public isReleased;

    constructor(
        address _arbiter1,
        address _arbiter2,
        address _beneficiary
    ) payable {
        arbiter1 = _arbiter1;
        arbiter2 = _arbiter2;
        beneficiary = _beneficiary;
        depositor = msg.sender;
    }

    event Approved(address indexed arbiter, uint);

    function approve() external {
        require(
            msg.sender == arbiter1 || msg.sender == arbiter2,
            "Only arbiters can approve"
        );
        require(!isReleased, "Funds have already been released");

		console.log('arbiter1 is: ', arbiter1);
		console.log('arbiter2 is: ', arbiter2);
		console.log("msg.sender is: ", msg.sender);

        if (msg.sender == arbiter1) {
            require(!isApprovedByArbiter1, "Arbiter 1 has already approved");
            isApprovedByArbiter1 = true;
        } else {
            require(!isApprovedByArbiter2, "Arbiter 2 has already approved");
            isApprovedByArbiter2 = true;
        }

        emit Approved(msg.sender, address(this).balance);
        uint balance = address(this).balance;

        if (isApprovedByArbiter1 && isApprovedByArbiter2) {
            console.log('gonna to send this sum: ', balance);
            (bool sent, ) = payable(beneficiary).call{value: balance}("");
            require(sent, "Failed to send Ether");
            console.log('balance is: ', balance);           
            isReleased = true;
        }
        
    }
}
