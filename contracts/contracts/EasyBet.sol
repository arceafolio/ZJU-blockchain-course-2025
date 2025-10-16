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
        // mapping(address => string) playerChoices;
        string name;
        uint256 totalAmount; // �����ܽ��
    }

    // uint256 public totalAmount; // �����ܽ��

    mapping(uint256 => Activity) public activities; // A map from activity-index to its information
    uint256[] public activitiesActive; // ��ǰ�ID
    uint256 public nextActivityId;
    // ...
    // TODO add any variables and functions if you want

    // ��Ʊ�ͻ���
    Ticket public ticket;
    Points public points;

    // �̵꣬�洢�ϼܵĲ�Ʊ
    struct TicketOnSale{
        uint256 tokenId;
        uint256 price;
        address seller;
    }
    // ��Ʊ�غͼ����õ�����
    mapping(uint256 => TicketOnSale) public ticketPool;
    uint256[] public ticketsOnSale;

    // ����Ա
    address public manager;

    modifier onlyManager {
        require(msg.sender == manager, "Only manager can call this function");
        _;
    }

    constructor() {
        // maybe you need a constructor
        ticket = new Ticket();
        points = new Points();
        manager = msg.sender;
    }

    // �������ֻ�޹���Ա
    function createActivity(string[] memory choices ,string memory name) external onlyManager {
        uint256 tokenId = nextActivityId++;
        activitiesActive.push(tokenId);
        Activity storage activity = activities[tokenId];
        activity.owner = msg.sender;
        activity.listedTimestamp = block.timestamp;
        activity.choices = choices;
        activity.name = name;
    }

    // ����
    function play(uint256 amount, string memory choice, uint256 activityId) public {
        // ���׻���
        bool ok = points.transferFrom(msg.sender, address(this), amount);
        require(ok, "Transfer failed");

        // ��¼���ѡ��
        // activities[activityId].playerChoices[msg.sender] = choice;

        // ���ɲ�Ʊ
        ticket.mint(msg.sender, activityId, amount, choice);

        activities[activityId].totalAmount += amount;
    }

    // ���ײ�Ʊ����ҵ��ô˺�������
    function tradeTicket(uint256 tokenId, address to) public {
        // ��ȡ���Һͼ۸�
        address seller = ticketPool[tokenId].seller;
        uint256 amount = ticketPool[tokenId].price;
        
        // ���������㹻�Ļ���
        require(points.balanceOf(to) >= amount, "Insufficient points");

        // ���֧�����ָ�����
        bool ok = points.transferFrom(to, seller, amount);
        require(ok, "Transfer failed");

        // ��Լ����Ʊת�����
        ticket.transferFrom(address(this), to, tokenId);

        // �Ӳ�Ʊ�����Ƴ�
        removeTicketOnSale(tokenId);
    }

    // �ϼܲ�Ʊ
    function listTicket(uint256 tokenId, uint256 price) public {
        require(msg.sender == ticket.ownerOf(tokenId), "Not the ticket owner");

        // ����Ʊת�Ƶ���Լ�����й�
        ticket.transferFrom(msg.sender, address(this), tokenId);

        ticketPool[tokenId] = TicketOnSale({
            tokenId: tokenId,
            price: price,
            seller: msg.sender
        });
        ticketsOnSale.push(tokenId);
    }

    // ��ȡ��Ʊ��
    function getTicketPool() public view returns (TicketOnSale[] memory) {
        TicketOnSale[] memory pool = new TicketOnSale[](ticketsOnSale.length);
        for (uint256 i = 0; i < ticketsOnSale.length; i++) {
            pool[i] = ticketPool[ticketsOnSale[i]];
        }
        return pool;
    }

    // ��ȡ�
    function getActivities() public view returns (Activity[] memory) {
        Activity[] memory result = new Activity[](activitiesActive.length);
        for (uint256 i = 0; i < activitiesActive.length; i++) {
            result[i] = activities[activitiesActive[i]];
        }
        return result;
    }

    // �Ƴ���Ʊ����ĳԪ��
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

    // ���㣬���Ž���
    function settle(uint256 activityId, string memory choice_win) public onlyManager() {
        uint256 totalWinners = 0;
        uint totalPrize = activities[activityId].totalAmount;
        address[] memory winners = new address[](ticket.nextTokenId());

        // ͳ��
        for(uint256 tokenId = 0; tokenId < ticket.nextTokenId(); tokenId++) {
            (uint256 activityId_own, uint256 amount_, string memory choice) = ticket.getTicketInfo(tokenId);
            if(activityId_own == activityId && 
                keccak256(bytes(choice)) == keccak256(bytes(choice_win))) {
                winners[totalWinners] = ticket.ownerOf(tokenId);
                totalWinners++;
            }
        }

        // ����
        uint256 prize = totalPrize / totalWinners;
        for(uint256 i = 0; i < totalWinners; i++) {
            points.transfer(winners[i], prize);
        }

        delete activities[activityId];
        // �ӻ�б����Ƴ�
        uint256 length = activitiesActive.length;
        for (uint256 i = 0; i < length; i++) {
            if (activitiesActive[i] == activityId) {
                activitiesActive[i] = activitiesActive[length - 1];
                activitiesActive.pop();
                break;
            }
        }
    }

    function helloworld() pure external returns(string memory) {
        return "hello world";
    }

    // ...
    // TODO add any logic if you want
}