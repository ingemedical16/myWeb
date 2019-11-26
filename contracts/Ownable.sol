pragma solidity ^0.5.11;

contract Ownable {
  // state variables
  address  payable admin;

  // modifiers
  modifier onlyOwner() {
    require(msg.sender == admin);
    _;
  }

  // constructor
  constructor() public {
    admin = msg.sender;
  }
}
