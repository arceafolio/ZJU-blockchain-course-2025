pragma solidity ^0.8.27;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract Points is ERC20, ERC20Permit {
    mapping(address => bool) claimedAirdropPlayerList;
    
    constructor() ERC20("Points", "MTK") ERC20Permit("Points") {}

    function airdrop() external {
        require(claimedAirdropPlayerList[msg.sender] == false, "This user has claimed airdrop already");
        _mint(msg.sender, 10000);
        claimedAirdropPlayerList[msg.sender] = true;
    }
}