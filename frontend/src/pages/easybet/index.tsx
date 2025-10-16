import {Button, Image, Modal, Input, Space} from 'antd';
// Update the import path to the correct location of Header image or asset
import Header from "../../assets/header.png";
import {UserOutlined, PlusOutlined, MinusCircleOutlined} from "@ant-design/icons";
import {useEffect, useState} from 'react';
import {web3, easyBetContract, pointsContract, ticketsContract} from "../../utils/contracts";
import './index.css';

const GanacheTestChainId = '0x539' // Ganache默认的ChainId = 0x539 = Hex(1337)
// TODO change according to your configuration
const GanacheTestChainName = 'Ganache Test Chain'
const GanacheTestChainRpcUrl = 'http://127.0.0.1:8545'

const EasyBetPage = () => {

    const [account, setAccount] = useState('')
    const [accountBalance, setAccountBalance] = useState(0)
    const [managerAccount, setManagerAccount] = useState('')
    
    // 活动相关状态
    const [activities, setActivities] = useState<unknown[]>([])
    const [selectedActivity, setSelectedActivity] = useState(null)
    
    // 彩票相关状态
    const [myTickets, setMyTickets] = useState<any[]>([])
    const [ticketPool, setTicketPool] = useState<any[]>([])
    
    // 输入相关状态
    const [createActivityName, setCreateActivityName] = useState('')
    const [createActivityChoices, setCreateActivityChoices] = useState(['', ''])
    const [playAmount, setPlayAmount] = useState(0)
    const [playChoice, setPlayChoice] = useState('')
    const [listTicketId, setListTicketId] = useState(0)
    const [listTicketPrice, setListTicketPrice] = useState(0)
    const [settleActivityId, setSettleActivityId] = useState(0)
    const [settleWinChoice, setSettleWinChoice] = useState('')
    
    // Modal 状态
    const [isCreateActivityModalVisible, setIsCreateActivityModalVisible] = useState(false)
    const [isPlayActivityModalVisible, setIsPlayActivityModalVisible] = useState(false)
    const [selectedActivityForPlay, setSelectedActivityForPlay] = useState<any>(null)
    const [selectedActivityIdForPlay, setSelectedActivityIdForPlay] = useState(0)
    const [isMyTicketsModalVisible, setIsMyTicketsModalVisible] = useState(false)
    const [isListTicketModalVisible, setIsListTicketModalVisible] = useState(false)
    const [selectedTicketForList, setSelectedTicketForList] = useState<any>(null)
    const [isTicketMarketModalVisible, setIsTicketMarketModalVisible] = useState(false)
    const [isSettleModalVisible, setIsSettleModalVisible] = useState(false)
    const [selectedActivityForSettle, setSelectedActivityForSettle] = useState<any>(null)
    const [selectedActivityIdForSettle, setSelectedActivityIdForSettle] = useState(0)
    const [selectedWinChoice, setSelectedWinChoice] = useState('')

    useEffect(() => {
    // 初始化检查用户是否已经连接钱包
    // 查看window对象里是否有ethereum（metamask安装注入的）
        const initCheckAccounts = async () => {
            // @ts-ignore
            const {ethereum} = window;
            if (Boolean(ethereum && ethereum.isMetaMask)) {
                // 可以获取已连接的用户账号
                const accounts = await web3.eth.getAccounts()
                if(accounts && accounts.length) {
                    setAccount(accounts[0])
                }
            }
        }

        initCheckAccounts()
    }, [])

    useEffect(() => {
        const getContractInfo = async () => {
            if (easyBetContract) {
                try {
                    const ma = await easyBetContract.methods.manager().call()
                    setManagerAccount(String(ma))
                } catch (error: any) {
                    console.error('获取合约信息失败:', error)
                }
            }
        }

        getContractInfo()
    }, [])

    useEffect(() => {
        const getAccountInfo = async () => {
            if (pointsContract && account) {
                try {
                    const ab = await pointsContract.methods.balanceOf(account).call()
                    setAccountBalance(Number(ab))
                } catch (error: any) {
                    console.error('获取账户信息失败:', error)
                }
            }
        }

        if(account !== '') {
            getAccountInfo()
        }
    }, [account])
    
    // 加载活动列表
    const loadActivities = async () => {
        const activitiesResult = await easyBetContract.methods.getActivities().call()
        
        if (Array.isArray(activitiesResult)) {
            // 获取每个活动的真实ID
            const activitiesWithIds = []
            for (let i = 0; i < activitiesResult.length; i++) {
                const realId = await easyBetContract.methods.activitiesActive(i).call()
                const activity: any = activitiesResult[i]
                activitiesWithIds.push({
                    ...activity,
                    realId: Number(realId)
                })
            }
            setActivities(activitiesWithIds)
        } else {
            setActivities([])
        }
    }
    
    // 加载我的彩票
    const loadMyTickets = async (showModal: boolean = true) => {
        try {
            if (!account) {
                alert('请先连接钱包')
                return
            }
            
            // 获取彩票总数
            const totalTickets = await ticketsContract.methods.nextTokenId().call()
            const myTicketsList = []
            
            // 遍历所有彩票，找出属于当前用户的
            for (let tokenId = 0; tokenId < Number(totalTickets); tokenId++) {
                try {
                    const owner: any = await ticketsContract.methods.ownerOf(tokenId).call()
                    if (String(owner).toLowerCase() === account.toLowerCase()) {
                        // 获取彩票详细信息
                        const ticketInfo: any = await ticketsContract.methods.getTicketInfo(tokenId).call()
                        
                        // 获取活动信息
                        let activityName = '未知活动'
                        try {
                            const activityId = Number(ticketInfo[0])
                            // 直接从合约获取活动信息，使用真实ID
                            const activity: any = await easyBetContract.methods.activities(activityId).call()
                            activityName = activity.name || `活动 #${activityId}`
                        } catch (err) {
                            console.error('获取活动信息失败:', err)
                        }
                        
                        // 检查彩票是否已上架
                        let isListed = false
                        let listPrice = '0'
                        try {
                            const ticketOnSale: any = await easyBetContract.methods.ticketPool(tokenId).call()
                            // 如果 seller 不是零地址，说明已上架
                            if (ticketOnSale.seller && ticketOnSale.seller !== '0x0000000000000000000000000000000000000000') {
                                isListed = true
                                listPrice = String(ticketOnSale.price)
                            }
                        } catch (err) {
                            console.error('查询上架状态失败:', err)
                        }
                        
                        myTicketsList.push({
                            tokenId,
                            activityId: String(ticketInfo[0]),
                            activityName,
                            amount: String(ticketInfo[1]),
                            choice: String(ticketInfo[2]),
                            owner: String(owner),
                            isListed,
                            listPrice
                        })
                    }
                } catch (err) {
                    // 彩票可能已被销毁，跳过
                    continue
                }
            }
            
            setMyTickets(myTicketsList)
            if (showModal) {
                setIsMyTicketsModalVisible(true)
            }
        } catch (error: any) {
            console.error('加载我的彩票失败:', error)
            alert('加载我的彩票失败: ' + error.message)
        }
    }
    
    // 加载彩票池
    const loadTicketPool = async () => {
        const pool: any = await easyBetContract.methods.getTicketPool().call()
        const _ticketPool: any = []
        for (const item of pool) {
            // 获取彩票信息
            const ticketInfo: any = await ticketsContract.methods.getTicketInfo(item.tokenId).call()
            // 获取活动信息
            const activity: any = await easyBetContract.methods.activities(ticketInfo.activityId).call()
            
            _ticketPool.push({
                tokenId: item.tokenId,
                seller: item.seller,
                price: item.price,
                activityId: ticketInfo.activityId,
                activityName: activity.name,
                choice: ticketInfo.choice,
                amount: ticketInfo.amount
            })
        }
        setTicketPool(_ticketPool)
    }

    // ========== 用户功能 ==========
    
    // 刷新账号数据
    const onRefreshAccount = async () => {
        try {
            // @ts-ignore
            const {ethereum} = window;
            if (Boolean(ethereum && ethereum.isMetaMask)) {
                // 直接从 ethereum 请求当前账号（这会获取 MetaMask 当前选中的账号）
                const accounts = await ethereum.request({ method: 'eth_accounts' })
                if(accounts && accounts.length) {
                    const currentAccount = accounts[0]
                    
                    // 重要：更新 web3 实例的默认账号
                    // 这样所有后续的交易都会使用新账号
                    web3.eth.defaultAccount = currentAccount
                    
                    // 更新账号
                    setAccount(currentAccount)
                    
                    // 清空旧数据
                    setMyTickets([])
                    
                    // 刷新账户余额
                    if (pointsContract) {
                        const ab = await pointsContract.methods.balanceOf(currentAccount).call()
                        setAccountBalance(Number(ab))
                    }
                    
                    alert('账号数据已刷新\n当前账号：' + currentAccount)
                } else {
                    alert('未检测到连接的账号，请先在MetaMask中连接账号')
                }
            } else {
                alert('未检测到MetaMask')
            }
        } catch (error: any) {
            console.error('刷新账号数据失败:', error)
            alert('刷新失败：' + error.message)
        }
    }
    
    // 领取空投积分
    const onClaimTokenAirdrop = async () => {
        if(account === '') {
            alert('你还没有连接钱包。')
            return
        }
        await pointsContract.methods.airdrop().send({from: account})
    }
    
    // 显示参与活动对话框
    const showPlayActivityModal = (activity: any, activityId: number) => {
        if(account === '') {
            alert('你还没有连接钱包。')
            return
        }
        setSelectedActivityForPlay(activity)
        setSelectedActivityIdForPlay(activityId)
        setPlayAmount(0)
        setPlayChoice('')
        setIsPlayActivityModalVisible(true)
    }
    
    // 参与活动（投注）
    const onPlayActivity = async () => {
        if(account === '') {
            alert('你还没有连接钱包。')
            return
        }
        
        // 验证投注金额
        if (playAmount <= 0) {
            alert('请输入有效的投注金额')
            return
        }
        
        // 验证选项
        if (!playChoice || playChoice.trim() === '') {
            alert('请选择一个选项')
            return
        }
        
        // 检查余额
        if (accountBalance < playAmount) {
            alert('积分余额不足')
            return
        }
        
        try {
            // 1. 授权积分
            await pointsContract.methods.approve(easyBetContract.options.address, playAmount).send({from: account})
            // 2. 参与活动
            await easyBetContract.methods.play(playAmount, playChoice, selectedActivityIdForPlay).send({from: account})
            
            alert('参与活动成功')
            setIsPlayActivityModalVisible(false)
            // 刷新余额和活动列表
            const ab = await pointsContract.methods.balanceOf(account).call()
            setAccountBalance(Number(ab))
            await loadActivities()
        } catch (error: any) {
            alert('参与活动失败: ' + error.message)
        }
    }
    
    // 显示上架彩票对话框
    const showListTicketModal = (ticket: any) => {
        if(account === '') {
            alert('你还没有连接钱包。')
            return
        }
        setSelectedTicketForList(ticket)
        setListTicketPrice(0)
        setIsMyTicketsModalVisible(false) // 先关闭我的彩票弹窗
        setIsListTicketModalVisible(true)
    }
    
    // 上架彩票
    const onListTicket = async () => {
        if(account === '') {
            alert('你还没有连接钱包。')
            return
        }
        
        // 验证价格
        if (listTicketPrice <= 0) {
            alert('请输入有效的出售价格')
            return
        }
        
        try {
            console.log('开始上架彩票，tokenId:', selectedTicketForList.tokenId)
            
            // 1. 授权合约转移彩票（重要！）
            console.log('正在授权彩票转移...')
            await ticketsContract.methods.approve(easyBetContract.options.address, selectedTicketForList.tokenId).send({from: account})
            console.log('授权成功')
            
            // 2. 上架彩票（会将彩票转移到合约托管）
            console.log('正在上架彩票...')
            await easyBetContract.methods.listTicket(selectedTicketForList.tokenId, listTicketPrice).send({from: account})
            console.log('上架成功')
            
            alert('彩票上架成功')
            setIsListTicketModalVisible(false)
            // 刷新我的彩票列表并重新打开
            await loadMyTickets()
        } catch (error: any) {
            console.error('上架彩票失败:', error)
            alert('上架彩票失败: ' + (error.message || JSON.stringify(error)))
            // 如果失败，可以选择重新打开我的彩票弹窗
            setIsListTicketModalVisible(false)
            setIsMyTicketsModalVisible(true)
        }
    }
    
    // 购买彩票
    const onBuyTicket = async (tokenId: number, seller: string) => {
        if(account === '') {
            alert('你还没有连接钱包。')
            return
        }
        
        try {
            console.log('开始购买彩票，tokenId:', tokenId, '当前账号:', account)
            
            // 1. 获取彩票价格
            const ticketInfo: any = await easyBetContract.methods.ticketPool(tokenId).call()
            const price = Number(ticketInfo.price)
            console.log('彩票价格:', price, '当前余额:', accountBalance)
            
            // 检查余额是否足够
            if (accountBalance < price) {
                alert('积分余额不足')
                return
            }
            
            // 2. 授权积分给合约（注意：是给合约，不是给卖家）
            console.log('正在授权积分...')
            await pointsContract.methods.approve(easyBetContract.options.address, price).send({from: account})
            console.log('授权成功')
            
            // 3. 调用 easyBetContract.methods.tradeTicket(tokenId, account)
            console.log('正在购买彩票...')
            await easyBetContract.methods.tradeTicket(tokenId, account).send({from: account})
            console.log('购买成功')
            
            alert('购买彩票成功')
            // 刷新彩票池和我的彩票
            await loadTicketPool()
            await loadMyTickets(false)
        } catch (error: any) {
            console.error('购买彩票完整错误:', error)
            alert('购买彩票失败: ' + (error.message || JSON.stringify(error)))
        }
    }

    // ========== 管理员功能 ==========
    
    // 显示创建活动对话框
    const showCreateActivityModal = () => {
        if(account === '') {
            alert('你还没有连接钱包。')
            return
        }
        if(account !== managerAccount) {
            alert('只有管理员可以创建活动。')
            return
        }
        setCreateActivityName('')
        setCreateActivityChoices(['', ''])
        setIsCreateActivityModalVisible(true)
    }
    
    // 添加选项
    const addChoice = () => {
        setCreateActivityChoices([...createActivityChoices, ''])
    }
    
    // 删除选项
    const removeChoice = (index: number) => {
        if (createActivityChoices.length <= 2) {
            alert('至少需要两个选项')
            return
        }
        const newChoices = createActivityChoices.filter((_, i) => i !== index)
        setCreateActivityChoices(newChoices)
    }
    
    // 更新选项内容
    const updateChoice = (index: number, value: string) => {
        const newChoices = [...createActivityChoices]
        newChoices[index] = value
        setCreateActivityChoices(newChoices)
    }
    
    // 创建活动
    const onCreateActivity = async () => {
        // 验证活动名称已填写
        if (createActivityName.trim() === '') {
            alert('请填写活动名称')
            return
        }
        
        // 验证所有选项都已填写
        if (createActivityChoices.some(choice => choice.trim() === '')) {
            alert('请填写所有选项')
            return
        }
        
        try {
            await easyBetContract.methods.createActivity(createActivityChoices, createActivityName).send({from: account})
            alert('活动创建成功')
            setIsCreateActivityModalVisible(false)
            // 刷新活动列表
            await loadActivities()
        } catch (error: any) {
            alert('创建活动失败: ' + error.message)
        }
    }
    
    // 显示结算活动对话框
    const showSettleModal = () => {
        if(account === '') {
            alert('你还没有连接钱包。')
            return
        }
        if(account !== managerAccount) {
            alert('只有管理员可以结算活动。')
            return
        }
        setSelectedActivityForSettle(null)
        setSelectedActivityIdForSettle(0)
        setSelectedWinChoice('')
        setIsSettleModalVisible(true)
    }
    
    // 选择要结算的活动
    const selectActivityForSettle = (activity: any, activityId: number) => {
        setSelectedActivityForSettle(activity)
        setSelectedActivityIdForSettle(activityId)
        setSelectedWinChoice('') // 清空之前选择的胜利选项
    }
    
    // 结算活动
    const onSettleActivity = async () => {
        if(account === '') {
            alert('你还没有连接钱包。')
            return
        }
        if(account !== managerAccount) {
            alert('只有管理员可以结算活动。')
            return
        }
        
        // 验证是否选择了活动
        if (!selectedActivityForSettle) {
            alert('请先选择要结算的活动')
            return
        }
        
        // 验证是否选择了胜利选项
        if (!selectedWinChoice || selectedWinChoice.trim() === '') {
            alert('请选择胜利选项')
            return
        }
        
        try {
            console.log('开始结算活动，ID:', selectedActivityIdForSettle, '胜利选项:', selectedWinChoice)
            await easyBetContract.methods.settle(selectedActivityIdForSettle, selectedWinChoice).send({from: account})
            alert('活动结算成功')
            setIsSettleModalVisible(false)
            // 刷新活动列表
            await loadActivities()
        } catch (error: any) {
            console.error('结算活动失败:', error)
            alert('结算活动失败: ' + (error.message || JSON.stringify(error)))
        }
    }

    const onClickConnectWallet = async () => {
    // 查看window对象里是否有ethereum（metamask安装注入的）
        // @ts-ignore
        const {ethereum} = window;
        if (!Boolean(ethereum && ethereum.isMetaMask)) {
            alert('未安装MetaMask！');
            return
        }

        try {
            // 如果当前小狐狸不在本地链上，切换Metamask到本地链
            if (ethereum.chainId !== GanacheTestChainId) {
                const chain = {
                    chainId: GanacheTestChainId, // Chain-ID
                    chainName: GanacheTestChainName, // Chain-Name
                    rpcUrls: [GanacheTestChainRpcUrl], // RPC-URL
                };

                try {
                    // 尝试切换到本地链
                    await ethereum.request({method: "wallet_switchEthereumChain", params: [{chainId: chain.chainId}]})
                } catch (switchError: any) {
                    // 如果本地链还没加到Metamask，添加本地链
                    if (switchError.code === 4902) {
                        await ethereum.request({ method: 'wallet_addEthereumChain', params: [chain]
                        });
                    }
                }
            }

            // 小狐狸成功切换到本地链后，请求小狐狸授权
            await ethereum.request({method: 'eth_requestAccounts'});
            // 获取小狐狸已授权的用户列表
            const accounts = await ethereum.request({method: 'eth_accounts'});
            // 如果用户存在，显示account，否则显示未能获取账号信息
            setAccount(accounts[0] || '未能获取账号');
        } catch (error: any) {
            alert(error.message)
        }
    }

    /*
    TODO:
    管理员：
        创建活动，选择投注额度，添加至少两个的不定数选项；结束活动

    用户：
        领取积分；浏览活动；参与活动，选择选项进行投注
        浏览拥有的彩票；上架拥有的彩票；浏览其他上架彩票；购买其他上架彩票
    
    */ 
    return (
        <div className='container'>
            <Image
                width='100%'
                height='150px'
                preview={false}
                src={Header}
            />
            <div className='main'>
                <h1>彩票DEMO</h1>
                <Button onClick={onClaimTokenAirdrop}>领取空投积分</Button>
                <div>管理员地址：{managerAccount}</div>
                <div className='account'>
                    {account === '' && <Button onClick={onClickConnectWallet}>连接钱包</Button>}
                    {account !== '' && <Button onClick={onRefreshAccount} style={{marginLeft: '10px'}}>刷新账号数据</Button>}
                    <div>当前用户：{account === '' ? '尚未连接' : account}</div>
                    <div>当前用户拥有积分：{account === '' ? 0 : accountBalance}</div>
                </div>
                
                <div className='operation'>
                    <div style={{marginBottom: '20px'}}>用户操作区</div>
                    <div className='buttons'>
                        <Button style={{width: '200px'}} onClick={() => loadActivities()}>刷新活动列表</Button>
                        <Button style={{width: '200px'}} onClick={() => loadMyTickets()}>查看我的彩票</Button>
                        <Button style={{width: '200px'}} onClick={async () => {
                            await loadTicketPool()
                            setIsTicketMarketModalVisible(true)
                        }}>浏览彩票市场</Button>
                    </div>
                </div>
                
                {/* 活动列表 */}
                {activities.length > 0 && (
                    <div className='operation'>
                        <div style={{marginBottom: '20px'}}>活动列表</div>
                        <div style={{maxHeight: '300px', overflowY: 'auto'}}>
                            {activities.map((activity: any, index: number) => (
                                <div key={index} style={{
                                    padding: '15px',
                                    margin: '10px 0',
                                    border: '1px solid #d9d9d9',
                                    borderRadius: '4px',
                                    backgroundColor: '#fafafa'
                                }}>
                                    <div><strong>活动名称：</strong>{activity.name || '未命名活动'}</div>
                                    <div><strong>活动ID：</strong>{activity.realId}</div>
                                    <div><strong>创建者：</strong>{activity.owner}</div>
                                    <div><strong>选项：</strong>{activity.choices?.join(', ') || '无'}</div>
                                    <div>
                                        <strong>当前奖池：</strong>
                                        <span style={{color: '#ff4d4f', fontWeight: 'bold', fontSize: '16px'}}>
                                            {activity.totalAmount || 0} 积分
                                        </span>
                                    </div>
                                    <div style={{marginTop: '10px'}}>
                                        <Button 
                                            type="primary" 
                                            size="small"
                                            onClick={() => showPlayActivityModal(activity, activity.realId)}
                                        >
                                            参与活动
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {account === managerAccount && (
                    <div className='operation'>
                        <div style={{marginBottom: '20px'}}>管理员操作区</div>
                        <div className='buttons'>
                            <Button style={{width: '200px'}} onClick={showCreateActivityModal}>创建活动</Button>
                            <Button style={{width: '200px'}} onClick={showSettleModal}>结算活动</Button>
                        </div>
                    </div>
                )}
            </div>
            
            {/* 创建活动弹窗 */}
            <Modal
                title="创建活动"
                open={isCreateActivityModalVisible}
                onOk={onCreateActivity}
                onCancel={() => setIsCreateActivityModalVisible(false)}
                okText="创建"
                cancelText="取消"
                width={500}
            >
                <Space direction="vertical" style={{width: '100%'}} size="large">
                    <div>
                        <h4>活动名称</h4>
                        <Input
                            placeholder="请输入活动名称"
                            value={createActivityName}
                            onChange={(e) => setCreateActivityName(e.target.value)}
                            style={{width: '100%'}}
                        />
                    </div>
                    
                    <div>
                        <h4>活动选项（至少2个）</h4>
                        <Space direction="vertical" style={{width: '100%'}}>
                            {createActivityChoices.map((choice, index) => (
                                <Space key={index} style={{width: '100%'}}>
                                    <Input
                                        placeholder={`选项 ${index + 1}`}
                                        value={choice}
                                        onChange={(e) => updateChoice(index, e.target.value)}
                                        style={{width: '380px'}}
                                    />
                                    {createActivityChoices.length > 2 && (
                                        <MinusCircleOutlined 
                                            onClick={() => removeChoice(index)}
                                            style={{color: 'red', cursor: 'pointer'}}
                                        />
                                    )}
                                </Space>
                            ))}
                            <Button 
                                type="dashed" 
                                onClick={addChoice} 
                                icon={<PlusOutlined />}
                                style={{width: '100%'}}
                            >
                                添加选项
                            </Button>
                        </Space>
                    </div>
                </Space>
            </Modal>
            
            {/* 参与活动弹窗 */}
            <Modal
                title={`参与活动: ${selectedActivityForPlay?.name || '未命名活动'}`}
                open={isPlayActivityModalVisible}
                onOk={onPlayActivity}
                onCancel={() => setIsPlayActivityModalVisible(false)}
                okText="确认投注"
                cancelText="取消"
                width={500}
            >
                <Space direction="vertical" style={{width: '100%'}} size="large">
                    <div>
                        <h4>活动信息</h4>
                        <div style={{padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px'}}>
                            <div><strong>活动名称：</strong>{selectedActivityForPlay?.name}</div>
                            <div><strong>活动ID：</strong>{selectedActivityIdForPlay}</div>
                            <div><strong>可用余额：</strong>{accountBalance} 积分</div>
                        </div>
                    </div>
                    
                    <div>
                        <h4>投注金额</h4>
                        <Input
                            type="number"
                            placeholder="请输入投注金额"
                            value={playAmount || ''}
                            onChange={(e) => setPlayAmount(Number(e.target.value))}
                            style={{width: '100%'}}
                            min={1}
                        />
                    </div>
                    
                    <div>
                        <h4>选择选项</h4>
                        <Space direction="vertical" style={{width: '100%'}}>
                            {selectedActivityForPlay?.choices?.map((choice: string, index: number) => (
                                <Button
                                    key={index}
                                    type={playChoice === choice ? 'primary' : 'default'}
                                    onClick={() => setPlayChoice(choice)}
                                    style={{width: '100%', textAlign: 'left'}}
                                >
                                    {choice}
                                </Button>
                            ))}
                        </Space>
                    </div>
                </Space>
            </Modal>
            
            {/* 上架彩票弹窗 */}
            <Modal
                title="上架彩票"
                open={isListTicketModalVisible}
                onOk={onListTicket}
                onCancel={() => {
                    setIsListTicketModalVisible(false)
                    setIsMyTicketsModalVisible(true) // 取消时重新打开我的彩票弹窗
                }}
                okText="确认上架"
                cancelText="取消"
                width={500}
            >
                <Space direction="vertical" style={{width: '100%'}} size="large">
                    <div>
                        <h4>彩票信息</h4>
                        <div style={{padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px'}}>
                            <div><strong>彩票编号：</strong>#{selectedTicketForList?.tokenId}</div>
                            <div><strong>活动名称：</strong>{selectedTicketForList?.activityName}</div>
                            <div><strong>投注金额：</strong>{selectedTicketForList?.amount} 积分</div>
                            <div><strong>选择的选项：</strong>{selectedTicketForList?.choice}</div>
                        </div>
                    </div>
                    
                    <div>
                        <h4>出售价格</h4>
                        <Input
                            type="number"
                            placeholder="请输入出售价格（积分）"
                            value={listTicketPrice || ''}
                            onChange={(e) => setListTicketPrice(Number(e.target.value))}
                            style={{width: '100%'}}
                            min={1}
                            addonAfter="积分"
                        />
                        <div style={{marginTop: '8px', color: '#999', fontSize: '12px'}}>
                            提示：建议价格不低于投注金额 {selectedTicketForList?.amount} 积分
                        </div>
                    </div>
                </Space>
            </Modal>
            
            {/* 我的彩票弹窗 */}
            <Modal
                title="我的彩票"
                open={isMyTicketsModalVisible}
                onCancel={() => setIsMyTicketsModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setIsMyTicketsModalVisible(false)}>
                        关闭
                    </Button>
                ]}
                width={700}
            >
                {myTickets.length === 0 ? (
                    <div style={{textAlign: 'center', padding: '40px', color: '#999'}}>
                        暂无彩票
                    </div>
                ) : (
                    <div style={{maxHeight: '500px', overflowY: 'auto'}}>
                        {myTickets.map((ticket: any, index: number) => (
                            <div key={index} style={{
                                padding: '15px',
                                margin: '10px 0',
                                border: '1px solid #d9d9d9',
                                borderRadius: '4px',
                                backgroundColor: '#fafafa'
                            }}>
                                <div style={{marginBottom: '10px'}}>
                                    <strong style={{fontSize: '16px', color: '#1890ff'}}>彩票 #{ticket.tokenId}</strong>
                                </div>
                                <div style={{lineHeight: '1.8'}}>
                                    <div><strong>活动名称：</strong>{ticket.activityName}</div>
                                    <div><strong>活动ID：</strong>{ticket.activityId}</div>
                                    <div><strong>投注金额：</strong>{ticket.amount} 积分</div>
                                    <div><strong>选择的选项：</strong><span style={{color: '#52c41a', fontWeight: 'bold'}}>{ticket.choice}</span></div>
                                    <div>
                                        <strong>上架状态：</strong>
                                        {ticket.isListed ? (
                                            <span style={{color: '#ff4d4f', fontWeight: 'bold'}}>
                                                已上架（售价：{ticket.listPrice} 积分）
                                            </span>
                                        ) : (
                                            <span style={{color: '#999'}}>未上架</span>
                                        )}
                                    </div>
                                </div>
                                <div style={{marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #d9d9d9'}}>
                                    {ticket.isListed ? (
                                        <span style={{color: '#999', fontSize: '12px'}}>
                                            该彩票已在市场上架
                                        </span>
                                    ) : (
                                        <Button 
                                            size="small" 
                                            onClick={() => showListTicketModal(ticket)}
                                        >
                                            上架出售
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Modal>

            {/* 彩票市场 Modal */}
            <Modal
                title="彩票市场"
                open={isTicketMarketModalVisible}
                onCancel={() => setIsTicketMarketModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setIsTicketMarketModalVisible(false)}>
                        关闭
                    </Button>
                ]}
                width={800}
            >
                {ticketPool.length === 0 ? (
                    <div style={{textAlign: 'center', padding: '40px', color: '#999'}}>
                        市场上暂无彩票上架
                    </div>
                ) : (
                    <div style={{maxHeight: '500px', overflowY: 'auto'}}>
                        {ticketPool.map((ticket: any) => (
                            <div 
                                key={ticket.tokenId}
                                style={{
                                    border: '1px solid #d9d9d9',
                                    borderRadius: '4px',
                                    padding: '15px',
                                    marginBottom: '15px',
                                    backgroundColor: '#fafafa'
                                }}
                            >
                                <div style={{marginBottom: '10px'}}>
                                    <strong style={{fontSize: '16px', color: '#1890ff'}}>彩票 #{ticket.tokenId}</strong>
                                </div>
                                <div style={{lineHeight: '1.8'}}>
                                    <div><strong>活动名称：</strong>{ticket.activityName}</div>
                                    <div><strong>活动ID：</strong>{ticket.activityId}</div>
                                    <div><strong>投注金额：</strong>{ticket.amount} 积分</div>
                                    <div><strong>选择的选项：</strong><span style={{color: '#52c41a', fontWeight: 'bold'}}>{ticket.choice}</span></div>
                                    <div><strong>卖家地址：</strong><span style={{fontSize: '12px', color: '#666'}}>{ticket.seller}</span></div>
                                    <div><strong>售价：</strong><span style={{color: '#ff4d4f', fontWeight: 'bold', fontSize: '16px'}}>{ticket.price} 积分</span></div>
                                </div>
                                {ticket.seller.toLowerCase() !== account.toLowerCase() && (
                                    <div style={{marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #d9d9d9'}}>
                                        <Button 
                                            type="primary"
                                            size="small"
                                            onClick={() => onBuyTicket(ticket.tokenId, ticket.seller)}
                                        >
                                            购买
                                        </Button>
                                    </div>
                                )}
                                {ticket.seller.toLowerCase() === account.toLowerCase() && (
                                    <div style={{marginTop: '10px', paddingTop: '10px', borderTop: '1px dashed #d9d9d9'}}>
                                        <span style={{color: '#999', fontSize: '12px'}}>
                                            这是你上架的彩票
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </Modal>

            {/* 结算活动 Modal */}
            <Modal
                title="结算活动"
                open={isSettleModalVisible}
                onOk={onSettleActivity}
                onCancel={() => setIsSettleModalVisible(false)}
                okText="确认结算"
                cancelText="取消"
                width={800}
            >
                {activities.length === 0 ? (
                    <div style={{textAlign: 'center', padding: '40px', color: '#999'}}>
                        暂无活动可结算
                    </div>
                ) : (
                    <Space direction="vertical" style={{width: '100%'}} size="large">
                        <div>
                            <h4>选择要结算的活动</h4>
                            <div style={{maxHeight: '300px', overflowY: 'auto'}}>
                                {activities.map((activity: any, index: number) => (
                                    <div 
                                        key={index} 
                                        onClick={() => selectActivityForSettle(activity, activity.realId)}
                                        style={{
                                            padding: '15px',
                                            margin: '10px 0',
                                            border: selectedActivityIdForSettle === activity.realId ? '2px solid #1890ff' : '1px solid #d9d9d9',
                                            borderRadius: '4px',
                                            backgroundColor: selectedActivityIdForSettle === activity.realId ? '#e6f7ff' : '#fafafa',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s'
                                        }}
                                    >
                                        <div><strong>活动名称：</strong>{activity.name || '未命名活动'}</div>
                                        <div><strong>活动ID：</strong>{activity.realId}</div>
                                        <div><strong>创建者：</strong>{activity.owner}</div>
                                        <div><strong>选项：</strong>{activity.choices?.join(', ') || '无'}</div>
                                        <div>
                                            <strong>当前奖池：</strong>
                                            <span style={{color: '#ff4d4f', fontWeight: 'bold'}}>
                                                {activity.totalAmount || 0} 积分
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        {selectedActivityForSettle && (
                            <div>
                                <h4>选择胜利选项</h4>
                                <div style={{padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '4px', marginBottom: '10px'}}>
                                    <div><strong>已选择活动：</strong>{selectedActivityForSettle.name}</div>
                                    <div><strong>活动ID：</strong>{selectedActivityIdForSettle}</div>
                                    <div><strong>奖池总额：</strong>{selectedActivityForSettle.totalAmount || 0} 积分</div>
                                </div>
                                <Space direction="vertical" style={{width: '100%'}}>
                                    {selectedActivityForSettle.choices?.map((choice: string, index: number) => (
                                        <Button
                                            key={index}
                                            type={selectedWinChoice === choice ? 'primary' : 'default'}
                                            onClick={() => setSelectedWinChoice(choice)}
                                            style={{
                                                width: '100%', 
                                                textAlign: 'left',
                                                height: 'auto',
                                                padding: '10px 15px'
                                            }}
                                        >
                                            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                                <span>{choice}</span>
                                                {selectedWinChoice === choice && (
                                                    <span style={{color: '#52c41a', fontWeight: 'bold'}}>✓ 胜利选项</span>
                                                )}
                                            </div>
                                        </Button>
                                    ))}
                                </Space>
                            </div>
                        )}
                    </Space>
                )}
            </Modal>
        </div>
    )
}

export default EasyBetPage