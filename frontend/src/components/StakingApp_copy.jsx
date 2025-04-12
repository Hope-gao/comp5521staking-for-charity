import React, { useState, useEffect, useMemo } from 'react';
import { ethers } from 'ethers';
import addresses from '../addresses.json';
import WalletConnect from './WalletConnect.jsx';
import UserPanel from './UserPanel.jsx';
import StakeForm from './StakeForm.jsx';
import AdminPanel from './AdminPanel.jsx';
import WithdrawButton from './WithdrawButton.jsx';

// 质押类型枚举
const LockType = {
  Flex: 0,
  OneMonth: 1,
  OneYear: 2
};

// ABI 定义
const stakingAbi = [
  "function token() view returns (address)",
  "function owner() view returns (address)",
  "function rewardRates(uint8) view returns (uint256)",
  "function stake(uint256 amount, uint8 lockType) external",
  "function withdraw(uint256 index) external",
  "function depositReward(uint256 amount) external",
  "function getStakeCount(address user) view returns (uint256)",
  "function getStake(address user, uint256 index) view returns (uint256 amount, uint256 startTime, uint8 lockType, bool claimed, uint256 reward, uint256 unlockTime)"
];

const tokenAbi = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address account) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)"
];

function StakingApp({ user, onLogout }) {
  const [loading, setLoading] = useState(false);
  const [tokenInfo, setTokenInfo] = useState(null);
  const [tokenBalance, setTokenBalance] = useState("0");
  const [tokenAllowance, setTokenAllowance] = useState("0");
  const [stakes, setStakes] = useState([]);
  const [rewardRates, setRewardRates] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // 获取正确的合约地址
  const stakingAddress = useMemo(() => {
    // 尝试多种可能的键名
    const address = addresses.staking || addresses.stakingContract;
    if (!address) {
      console.error("无法找到质押合约地址，请检查addresses.json文件");
      setError("配置错误：未找到质押合约地址");
    }
    return address;
  }, []);

  // 创建合约实例
  const stakingContract = useMemo(() => {
    if (!user?.signer || !stakingAddress) return null;
    try {
      console.log("创建质押合约实例，地址:", stakingAddress);
      return new ethers.Contract(stakingAddress, stakingAbi, user.signer);
    } catch (err) {
      console.error("创建质押合约实例失败:", err);
      setError("初始化合约失败: " + err.message);
      return null;
    }
  }, [user, stakingAddress]);

  // 获取并设置代币合约
  const getTokenContract = async () => {
    if (!stakingContract || !user?.signer) return null;
    try {
      const tokenAddress = await stakingContract.token();
      console.log("获取到代币合约地址:", tokenAddress);
      return new ethers.Contract(tokenAddress, tokenAbi, user.signer);
    } catch (err) {
      console.error("获取代币合约失败:", err);
      setError("获取代币信息失败: " + err.message);
      return null;
    }
  };

  // 加载用户数据
  useEffect(() => {
    if (!stakingContract || !user?.address) return;

    const loadUserData = async () => {
      try {
        setLoading(true);
        setError("");
        console.log("开始加载用户数据...");

        // 获取代币合约
        const tokenContract = await getTokenContract();
        if (!tokenContract) {
          throw new Error("无法获取代币合约");
        }

        // 获取代币信息
        const [name, symbol, decimals] = await Promise.all([
          tokenContract.name(),
          tokenContract.symbol(),
          tokenContract.decimals()
        ]);

        setTokenInfo({ name, symbol, decimals });
        console.log("代币信息:", { name, symbol, decimals });

        // 获取余额和授权额度
        const [balance, allowance] = await Promise.all([
          tokenContract.balanceOf(user.address),
          tokenContract.allowance(user.address, stakingAddress)
        ]);

        // 使用 formatUnits 代替 ethers.utils.formatUnits (v6兼容)
        setTokenBalance(ethers.formatUnits(balance, decimals));
        setTokenAllowance(ethers.formatUnits(allowance, decimals));
        console.log("余额和授权:", {
          balance: ethers.formatUnits(balance, decimals),
          allowance: ethers.formatUnits(allowance, decimals)
        });

        // 获取质押记录
        await loadStakes();

        // 获取利率信息
        const [flexRate, oneMonthRate, oneYearRate] = await Promise.all([
          stakingContract.rewardRates(LockType.Flex),
          stakingContract.rewardRates(LockType.OneMonth),
          stakingContract.rewardRates(LockType.OneYear)
        ]);

        setRewardRates({
          [LockType.Flex]: flexRate,
          [LockType.OneMonth]: oneMonthRate,
          [LockType.OneYear]: oneYearRate
        });
        console.log("奖励利率:", {
          Flex: flexRate,
          OneMonth: oneMonthRate,
          OneYear: oneYearRate
        });
      } catch (err) {
        console.error("加载数据失败:", err);
        setError("加载数据失败: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [stakingContract, user, stakingAddress]);

  // 加载质押记录
  const loadStakes = async () => {
    if (!stakingContract || !user?.address) return;

    try {
      console.log("开始加载质押记录...");
      const count = await stakingContract.getStakeCount(user.address);
      console.log(`找到 ${count} 条质押记录`);
      
      if (count.toString() === "0") {
        setStakes([]);
        return;
      }
      
      const promises = [];
      for (let i = 0; i < count; i++) {
        promises.push(stakingContract.getStake(user.address, i));
      }

      const stakesData = await Promise.all(promises);
      
      const tokenContract = await getTokenContract();
      const decimals = await tokenContract.decimals();

      // 格式化质押数据
      const formattedStakes = stakesData.map((stake, index) => {
        const [amount, startTime, lockType, claimed, reward, unlockTime] = stake;
        return {
          index,
          amount: ethers.formatUnits(amount, decimals),
          startTime: new Date(Number(startTime) * 1000),
          lockType: Number(lockType),
          claimed,
          reward: ethers.formatUnits(reward, decimals),
          unlockTime: new Date(Number(unlockTime) * 1000)
        };
      });

      setStakes(formattedStakes);
      console.log("质押记录加载完成:", formattedStakes);
    } catch (err) {
      console.error("加载质押记录失败:", err);
      setError("加载质押记录失败: " + err.message);
    }
  };

  // 授权代币
  const approveToken = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const tokenContract = await getTokenContract();
      if (!tokenContract) return;

      const decimals = await tokenContract.decimals();
      // 使用 parseUnits 代替 ethers.utils.parseUnits (v6兼容)
      const amount = ethers.parseUnits("1000000", decimals); // 授权一个大数额

      console.log("授权代币中...");
      const tx = await tokenContract.approve(stakingAddress, amount);
      console.log("等待交易确认...", tx.hash);
      await tx.wait();

      // 更新授权额度
      const allowance = await tokenContract.allowance(user.address, stakingAddress);
      setTokenAllowance(ethers.formatUnits(allowance, decimals));
      setSuccess("代币授权成功");
      console.log("授权成功");
    } catch (err) {
      console.error("授权失败:", err);
      setError("授权失败: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 质押代币
  const handleStake = async (amount, lockType) => {
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      setError("请输入有效的质押金额");
      return;
    }
    if (typeof lockType !== "number" || lockType < 0 || lockType > 2) {
      setError("请选择正确的锁仓类型");
      return;
    }
    
    if (!stakingContract || !tokenInfo) return;
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // 使用 parseUnits 代替 ethers.utils.parseUnits (v6兼容)
      const amountInWei = ethers.parseUnits(amount, tokenInfo.decimals);
      console.log("开始质押:", { amount, lockType });
      const tx = await stakingContract.stake(amountInWei, lockType);
      console.log("等待交易确认...", tx.hash);
      await tx.wait();

      // 刷新数据
      await loadStakes();
      
      // 更新余额
      const tokenContract = await getTokenContract();
      const balance = await tokenContract.balanceOf(user.address);
      setTokenBalance(ethers.formatUnits(balance, tokenInfo.decimals));

      setSuccess("质押成功");
      console.log("质押成功");
    } catch (err) {
      console.error("质押失败:", err);
      setError("质押失败: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 提取质押
  const handleWithdraw = async (index) => {
    if (!stakingContract) return;
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      console.log("提取质押中...", { index });
      const tx = await stakingContract.withdraw(index);
      console.log("等待交易确认...", tx.hash);
      await tx.wait();

      // 刷新数据
      await loadStakes();
      
      // 更新余额
      if (tokenInfo) {
        const tokenContract = await getTokenContract();
        const balance = await tokenContract.balanceOf(user.address);
        setTokenBalance(ethers.formatUnits(balance, tokenInfo.decimals));
      }

      setSuccess("提取成功");
      console.log("提取成功");
    } catch (err) {
      console.error("提取失败:", err);
      setError("提取失败: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 存入奖励池
  const handleDepositReward = async (amount) => {
    if (!stakingContract || !tokenInfo || !user.isAdmin) return;
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // 使用 parseUnits 代替 ethers.utils.parseUnits (v6兼容)
      const amountInWei = ethers.parseUnits(amount, tokenInfo.decimals);
      console.log("充值奖励池中...", { amount });
      const tx = await stakingContract.depositReward(amountInWei);
      console.log("等待交易确认...", tx.hash);
      await tx.wait();

      // 更新余额
      const tokenContract = await getTokenContract();
      const balance = await tokenContract.balanceOf(user.address);
      setTokenBalance(ethers.formatUnits(balance, tokenInfo.decimals));

      setSuccess("奖励池充值成功");
      console.log("奖励池充值成功");
    } catch (err) {
      console.error("充值失败:", err);
      setError("充值失败: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 获取锁定类型名称
  const getLockTypeName = (type) => {
    switch (Number(type)) {
      case LockType.Flex: return "活期";
      case LockType.OneMonth: return "1个月";
      case LockType.OneYear: return "1年";
      default: return "未知";
    }
  };

  // 如果没有找到合约地址，显示错误信息
  if (!stakingAddress) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8 bg-gray-50">
        <div className="bg-red-100 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4 text-red-800">配置错误</h2>
          <p className="text-red-700 mb-4">未找到质押合约地址，请检查addresses.json文件配置。</p>
          <button
            onClick={onLogout}
            className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            返回登录
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8 bg-gray-50">
      {/* 顶部状态栏 */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-blue-800">质押 DApp</h1>
        <WalletConnect 
          address={user.address} 
          isAdmin={user.isAdmin} 
          onLogout={onLogout}
        />
      </div>

      {/* 提示信息 */}
      {(error || success) && (
        <div className={`mb-6 p-4 rounded ${error ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
          {error || success}
        </div>
      )}

      {/* 加载中状态 */}
      {loading && (
        <div className="mb-6 p-4 bg-blue-50 text-blue-700 rounded">
          加载中，请稍候...
        </div>
      )}

      {/* 主要内容区 */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 用户信息面板 */}
        <div className="lg:col-span-1">
          <UserPanel 
            address={user.address}
            isAdmin={user.isAdmin}
            tokenInfo={tokenInfo}
            tokenBalance={tokenBalance}
            tokenAllowance={tokenAllowance}
            rewardRates={rewardRates}
            loading={loading}
            onApprove={approveToken}
          />
        </div>

        {/* 质押操作面板 */}
        <div className="lg:col-span-1">
          <StakeForm 
            loading={loading}
            tokenAllowance={tokenAllowance}
            tokenInfo={tokenInfo}
            rewardRates={rewardRates}
            onStake={handleStake}
          />
        </div>

        {/* 管理员面板 (仅管理员可见) */}
        {user.isAdmin && (
          <div className="lg:col-span-1">
            <AdminPanel 
              loading={loading}
              tokenInfo={tokenInfo}
              tokenAllowance={tokenAllowance}
              onDepositReward={handleDepositReward}
            />
          </div>
        )}

        {/* 质押记录面板 */}
        <div className={user.isAdmin ? "lg:col-span-1" : "lg:col-span-2"}>
          <div className="bg-white p-6 rounded-lg shadow-md h-full">
            <h2 className="text-xl font-bold mb-4 text-blue-800">质押记录</h2>
            
            {loading ? (
              <p className="text-center text-gray-500 py-8">加载中...</p>
            ) : stakes.length === 0 ? (
              <p className="text-center text-gray-500 py-8">暂无质押记录</p>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {stakes.map(stake => (
                  <div key={stake.index} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold">{getLockTypeName(stake.lockType)}</span>
                      <span className={`px-2 py-1 rounded text-xs ${stake.claimed ? "bg-gray-200" : "bg-green-100 text-green-800"}`}>
                        {stake.claimed ? "已提取" : "活跃中"}
                      </span>
                    </div>
                    
                    <div className="text-sm space-y-1 mb-3">
                      <p><span className="text-gray-600">金额:</span> {parseFloat(stake.amount).toFixed(4)} {tokenInfo?.symbol}</p>
                      <p><span className="text-gray-600">开始时间:</span> {stake.startTime.toLocaleDateString()}</p>
                      {stake.lockType !== LockType.Flex && (
                        <p><span className="text-gray-600">到期时间:</span> {stake.unlockTime.toLocaleDateString()}</p>
                      )}
                      <p><span className="text-gray-600">当前收益:</span> {parseFloat(stake.reward).toFixed(6)} {tokenInfo?.symbol}</p>
                    </div>
                    
                    {!stake.claimed && (
                      <WithdrawButton 
                        stake={stake}
                        loading={loading}
                        onWithdraw={() => handleWithdraw(stake.index)}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StakingApp;