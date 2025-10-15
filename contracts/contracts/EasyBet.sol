// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

// Uncomment the line to use openzeppelin/ERC721,ERC20
// You can use this dependency directly because it has been installed by TA already
// import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
// import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Uncomment this line to use console.log
import "hardhat/console.sol";

import "./Ticket.sol";
import "./Points.sol";

contract EasyBet {

    // use a event if you want
    // to represent time you can choose block.timestamp
    event BetPlaced(uint256 tokenId, uint256 price, address owner);

    // maybe you need a struct to store some activity information
    struct Activity {
        address owner;
        uint256 listedTimestamp;
        string[] choices;
        // ...
        mapping(address => string) playerChoices;
    }

    uint256 public totalAmount; // 奖池总金额

    mapping(uint256 => Activity) public activities; // A map from activity-index to its information
    // ...
    // TODO add any variables and functions if you want

    // 彩票和积分
    Ticket public ticket;
    Points public points;

    // 商店，存储上架的彩票
    struct TicketOnSale{
        uint256 tokenId;
        uint256 price;
        address seller;
    }
    // 彩票池和检索用的数组
    mapping(uint256 => TicketOnSale) public ticketPool;
    uint256[] public ticketsOnSale;

    // 管理员
    address public manager;

    modifier onlyManager {
        require(msg.sender == manager, "Only manager can call this function");
        _;
    }

    constructor() {
        // maybe you need a constructor
        ticket = new Ticket();
        manager = msg.sender;
    }

    // 创建活动，只限管理员
    function createActivity(uint256 tokenId, string[] memory choices) external onlyManager {
        require(activities[tokenId].owner == address(0), "Activity with this tokenId already exists");
        Activity storage activity = activities[tokenId];
        activity.owner = msg.sender;
        activity.listedTimestamp = block.timestamp;
        activity.choices = choices;
    }

    // 参与活动
    function play(uint256 amount, string memory choice, uint256 activityId) public {
        // 交易积分
        bool ok = points.transferFrom(msg.sender, address(this), amount);
        require(ok, "Transfer failed");

        // 记录玩家选择
        activities[activityId].playerChoices[msg.sender] = choice;

        // 生成彩票
        ticket.mint(msg.sender, activityId, amount, choice);

        totalAmount += amount;
    }

    // 交易彩票
    function tradeTicket(uint256 tokenId, address to) public {
        // 从奖池中获取交易金额
        uint256 amount = ticketPool[tokenId].price;
        // 检查卖方是否有彩票，检查买方是否有足够的积分
        require(msg.sender == ticket.ownerOf(tokenId), "Not the ticket owner");
        require(points.balanceOf(to) >= amount, "Insufficient points");

        // 交易积分
        bool ok = points.transferFrom(to, msg.sender, amount);
        require(ok, "Transfer failed");

        // 交易彩票
        ticket.transferFrom(msg.sender, to, tokenId);

        // 从彩票池中移除
        removeTicketOnSale(tokenId);
    }

    // 上架彩票
    function listTicket(uint256 tokenId, uint256 price) public {
        require(msg.sender == ticket.ownerOf(tokenId), "Not the ticket owner");
        require(price > 0, "Invalid price");

        ticketPool[tokenId] = TicketOnSale({
            tokenId: tokenId,
            price: price,
            seller: msg.sender
        });
        ticketsOnSale.push(tokenId);
    }

    // 获取彩票池
    function getTicketPool() public view returns (TicketOnSale[] memory) {
        TicketOnSale[] memory pool = new TicketOnSale[](ticketsOnSale.length);
        for (uint256 i = 0; i < ticketsOnSale.length; i++) {
            pool[i] = ticketPool[ticketsOnSale[i]];
        }
        return pool;
    }

    // 移除彩票池中某元素
    function removeTicketOnSale(uint256 tokenId) internal {
        uint256 length = ticketsOnSale.length;
        for (uint256 i = 0; i < length; i++) {
            if (ticketsOnSale[i] == tokenId) {
                ticketsOnSale[i] = ticketsOnSale[length - 1];
                ticketsOnSale.pop();
                break;
            }
        }
        delete ticketPool[tokenId];
    }

    // 结算，发放奖励
    function settle(uint256 activityId, string memory choice_win) public onlyManager() {
        uint256 totalWinners = 0;
        uint totalPrize = totalAmount;
        address[] memory winners = new address[](ticket.nextTokenId());

        // 统计
        for(uint256 tokenId = 0; tokenId < ticket.nextTokenId(); tokenId++) {
            (uint256 activityId_own, uint256 amount_, string memory choice) = ticket.getTicketInfo(tokenId);
            if(activityId_own == activityId && 
                keccak256(bytes(choice)) == keccak256(bytes(choice_win))) {
                winners[totalWinners] = ticket.ownerOf(tokenId);
                totalWinners++;
            }
        }

        // 发奖
        uint256 prize = totalPrize / totalWinners;
        for(uint256 i = 0; i < totalWinners; i++) {
            points.transfer(winners[i], prize);
        }

        totalAmount = 0;
        delete activities[activityId];
    }

    function helloworld() pure external returns(string memory) {
        return "hello world";
    }

    // ...
    // TODO add any logic if you want
}