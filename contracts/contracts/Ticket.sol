// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract Ticket is ERC721 {

    // record information about each ticket
    struct TicketInfo {
        uint256 activityId;
        uint256 amount;
        string choice;
    }

    // token => ticket
    mapping(uint256 => TicketInfo) public ticketInfos;

    // index of the next token to be minted
    uint256 public nextTokenId;

    constructor() ERC721("Ticket", "GUA") {}

    function mint(address to, uint256 activityId, uint256 amount, string memory choice) external{
        uint256 tokenId = nextTokenId++;
        _mint(to, tokenId);
        ticketInfos[tokenId] = TicketInfo(activityId, amount, choice);
        // return tokenId;
    }

    function getTicketInfo(uint256 tokenId) external view returns (uint256 activityId, uint256 amount, string memory choice) {
        TicketInfo storage info = ticketInfos[tokenId];
        return (info.activityId, info.amount, info.choice);
    }
}