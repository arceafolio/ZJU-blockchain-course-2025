import Addresses from './contract-addresses.json'
import EasyBet from './abis/EasyBet.json'
import Points from './abis/Points.json'
import Tickets from './abis/Ticket.json'

import Web3 from 'web3';

// @ts-ignore
// 创建web3实例
// 可以阅读获取更多信息https://docs.metamask.io/guide/provider-migration.html#replacing-window-web3
let web3 = new Web3(window.web3.currentProvider)

// 修改地址为部署的合约地址
const easyBetAddress = Addresses.EasyBet
const easyBetABI = EasyBet.abi
const pointsAddress = Addresses.Points
const pointsABI = Points.abi
const ticketsAddress = Addresses.Ticket
const ticketsABI = Tickets.abi

// 获取合约实例
const easyBetContract = new web3.eth.Contract(easyBetABI, easyBetAddress);
const pointsContract = new web3.eth.Contract(pointsABI, pointsAddress);
const ticketsContract = new web3.eth.Contract(ticketsABI, ticketsAddress);

// 导出web3实例和其它部署的合约
export {web3, easyBetContract, pointsContract, ticketsContract}