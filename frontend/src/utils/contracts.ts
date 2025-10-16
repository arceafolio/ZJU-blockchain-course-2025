import Addresses from './contract-addresses.json'
import EasyBet from './abis/EasyBet.json'
import Points from './abis/Points.json'
import Tickets from './abis/Ticket.json'

import Web3 from 'web3';

// @ts-ignore
// ����web3ʵ��
// �����Ķ���ȡ������Ϣhttps://docs.metamask.io/guide/provider-migration.html#replacing-window-web3
let web3 = new Web3(window.web3.currentProvider)

// �޸ĵ�ַΪ����ĺ�Լ��ַ
const easyBetAddress = Addresses.EasyBet
const easyBetABI = EasyBet.abi
const pointsAddress = Addresses.Points
const pointsABI = Points.abi
const ticketsAddress = Addresses.Ticket
const ticketsABI = Tickets.abi

// ��ȡ��Լʵ��
const easyBetContract = new web3.eth.Contract(easyBetABI, easyBetAddress);
const pointsContract = new web3.eth.Contract(pointsABI, pointsAddress);
const ticketsContract = new web3.eth.Contract(ticketsABI, ticketsAddress);

// ����web3ʵ������������ĺ�Լ
export {web3, easyBetContract, pointsContract, ticketsContract}