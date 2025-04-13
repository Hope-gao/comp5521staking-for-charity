import React, { useState, useEffect, useMemo } from 'react';
import { ethers } from 'ethers';
import addresses from '../addresses.json';
import WalletConnect from './WalletConnect.jsx';
import UserPanel from './UserPanel.jsx';
import StakeForm from './StakeForm.jsx';
import AdminPanel from './AdminPanel.jsx';
import WithdrawButton from './WithdrawButton.jsx';

// Staking type enumeration
const LockType = {
  Flex: 0,
  OneMonth: 1,
  OneYear: 2
};

// ABI definitions
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

  // Get the correct contract address
  const stakingAddress = useMemo(() => {
    // Try multiple possible key names
    const address = addresses.staking || addresses.stakingContract;
    if (!address) {
      console.error("Unable to find staking contract address, please check addresses.json file");
      setError("Configuration error: Staking contract address not found");
    }
    return address;
  }, []);

  // Create contract instance
  const stakingContract = useMemo(() => {
    if (!user?.signer || !stakingAddress) return null;
    try {
      console.log("Creating staking contract instance, address:", stakingAddress);
      return new ethers.Contract(stakingAddress, stakingAbi, user.signer);
    } catch (err) {
      console.error("Failed to create staking contract instance:", err);
      setError("Failed to initialize contract: " + err.message);
      return null;
    }
  }, [user, stakingAddress]);

  // Get and set token contract
  const getTokenContract = async () => {
    if (!stakingContract || !user?.signer) return null;
    try {
      const tokenAddress = await stakingContract.token();
      console.log("Token contract address obtained:", tokenAddress);
      return new ethers.Contract(tokenAddress, tokenAbi, user.signer);
    } catch (err) {
      console.error("Failed to get token contract:", err);
      setError("Failed to get token information: " + err.message);
      return null;
    }
  };

  // Load user data
  useEffect(() => {
    if (!stakingContract || !user?.address) return;

    const loadUserData = async () => {
      try {
        setLoading(true);
        setError("");
        console.log("Starting to load user data...");

        // Get token contract
        const tokenContract = await getTokenContract();
        if (!tokenContract) {
          throw new Error("Unable to get token contract");
        }

        // Get token information
        const [name, symbol, decimals] = await Promise.all([
          tokenContract.name(),
          tokenContract.symbol(),
          tokenContract.decimals()
        ]);

        setTokenInfo({ name, symbol, decimals });
        console.log("Token information:", { name, symbol, decimals });

        // Get balance and allowance
        const [balance, allowance] = await Promise.all([
          tokenContract.balanceOf(user.address),
          tokenContract.allowance(user.address, stakingAddress)
        ]);

        // Use formatUnits instead of ethers.utils.formatUnits (v6 compatible)
        setTokenBalance(ethers.formatUnits(balance, decimals));
        setTokenAllowance(ethers.formatUnits(allowance, decimals));
        console.log("Balance and allowance:", {
          balance: ethers.formatUnits(balance, decimals),
          allowance: ethers.formatUnits(allowance, decimals)
        });

        // Load staking records
        await loadStakes();

        // Get reward rate information
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
        console.log("Reward rates:", {
          Flex: flexRate,
          OneMonth: oneMonthRate,
          OneYear: oneYearRate
        });
      } catch (err) {
        console.error("Failed to load data:", err);
        setError("Failed to load data: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [stakingContract, user, stakingAddress]);

  // Load staking records
  const loadStakes = async () => {
    if (!stakingContract || !user?.address) return;

    try {
      console.log("Starting to load staking records...");
      const count = await stakingContract.getStakeCount(user.address);
      console.log(`Found ${count} staking records`);

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

      // Format staking data
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
      console.log("Staking records loaded:", formattedStakes);
    } catch (err) {
      console.error("Failed to load staking records:", err);
      setError("Failed to load staking records: " + err.message);
    }
  };

  // Approve tokens
  const approveToken = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const tokenContract = await getTokenContract();
      if (!tokenContract) return;

      const decimals = await tokenContract.decimals();
      // Use parseUnits instead of ethers.utils.parseUnits (v6 compatible)
      const amount = ethers.parseUnits("1000000", decimals); // Approve a large amount

      console.log("Approving tokens...");
      const tx = await tokenContract.approve(stakingAddress, amount);
      console.log("Waiting for transaction confirmation...", tx.hash);
      await tx.wait();

      // Update allowance
      const allowance = await tokenContract.allowance(user.address, stakingAddress);
      setTokenAllowance(ethers.formatUnits(allowance, decimals));
      setSuccess("Token approval successful");
      console.log("Approval successful");
    } catch (err) {
      console.error("Approval failed:", err);
      setError("Approval failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Stake tokens
  const handleStake = async (amount, lockType) => {
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      setError("Please enter a valid staking amount");
      return;
    }
    if (typeof lockType !== "number" || lockType < 0 || lockType > 2) {
      setError("Please select a valid lock type");
      return;
    }

    if (!stakingContract || !tokenInfo) return;
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Use parseUnits instead of ethers.utils.parseUnits (v6 compatible)
      const amountInWei = ethers.parseUnits(amount, tokenInfo.decimals);
      console.log("Starting staking:", { amount, lockType });
      const tx = await stakingContract.stake(amountInWei, lockType);
      console.log("Waiting for transaction confirmation...", tx.hash);
      await tx.wait();

      // Refresh data
      await loadStakes();

      // Update balance
      const tokenContract = await getTokenContract();
      const balance = await tokenContract.balanceOf(user.address);
      setTokenBalance(ethers.formatUnits(balance, tokenInfo.decimals));

      setSuccess("Staking successful");
      console.log("Staking successful");
    } catch (err) {
      console.error("Staking failed:", err);
      setError("Staking failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Withdraw staking
  const handleWithdraw = async (index) => {
    if (!stakingContract) return;
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      console.log("Withdrawing staking...", { index });
      const tx = await stakingContract.withdraw(index);
      console.log("Waiting for transaction confirmation...", tx.hash);
      await tx.wait();

      // Refresh data
      await loadStakes();

      // Update balance
      if (tokenInfo) {
        const tokenContract = await getTokenContract();
        const balance = await tokenContract.balanceOf(user.address);
        setTokenBalance(ethers.formatUnits(balance, tokenInfo.decimals));
      }

      setSuccess("Withdrawal successful");
      console.log("Withdrawal successful");
    } catch (err) {
      console.error("Withdrawal failed:", err);
      setError("Withdrawal failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Deposit rewards
  const handleDepositReward = async (amount) => {
    if (!stakingContract || !tokenInfo || !user.isAdmin) return;
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Use parseUnits instead of ethers.utils.parseUnits (v6 compatible)
      const amountInWei = ethers.parseUnits(amount, tokenInfo.decimals);
      console.log("Depositing rewards...", { amount });
      const tx = await stakingContract.depositReward(amountInWei);
      console.log("Waiting for transaction confirmation...", tx.hash);
      await tx.wait();

      // Update balance
      const tokenContract = await getTokenContract();
      const balance = await tokenContract.balanceOf(user.address);
      setTokenBalance(ethers.formatUnits(balance, tokenInfo.decimals));

      setSuccess("Reward deposit successful");
      console.log("Reward deposit successful");
    } catch (err) {
      console.error("Deposit failed:", err);
      setError("Deposit failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Get lock type name
  const getLockTypeName = (type) => {
    switch (Number(type)) {
      case LockType.Flex: return "Flexible";
      case LockType.OneMonth: return "1 Month";
      case LockType.OneYear: return "1 Year";
      default: return "Unknown";
    }
  };

  // If no contract address is found, display error message
  if (!stakingAddress) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8 bg-gray-50">
        <div className="bg-red-100 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4 text-red-800">Configuration Error</h2>
          <p className="text-red-700 mb-4">Staking contract address not found, please check the addresses.json file configuration.</p>
          <button
            onClick={onLogout}
            className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-8 bg-gray-50">
      {/* Top status bar */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-blue-800">Staking DApp</h1>
        <WalletConnect
          address={user.address}
          isAdmin={user.isAdmin}
          onLogout={onLogout}
        />
      </div>

      {/* Notification messages */}
      {(error || success) && (
        <div className={`mb-6 p-4 rounded ${error ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
          {error || success}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="mb-6 p-4 bg-blue-50 text-blue-700 rounded">
          Loading, please wait...
        </div>
      )}

      {/* Main content area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* User information panel */}
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

        {/* Staking operation panel */}
        <div className="lg:col-span-1">
          <StakeForm
            loading={loading}
            tokenAllowance={tokenAllowance}
            tokenInfo={tokenInfo}
            rewardRates={rewardRates}
            onStake={handleStake}
          />
        </div>

        {/* Admin panel (visible only to admins) */}
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

        {/* Staking records panel */}
        <div className={user.isAdmin ? "lg:col-span-1" : "lg:col-span-2"}>
          <div className="bg-white p-6 rounded-lg shadow-md h-full">
            <h2 className="text-xl font-bold mb-4 text-blue-800">Staking Records</h2>

            {loading ? (
              <p className="text-center text-gray-500 py-8">Loading...</p>
            ) : stakes.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No staking records</p>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {stakes.map(stake => (
                  <div key={stake.index} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold">{getLockTypeName(stake.lockType)}</span>
                      <span className={`px-2 py-1 rounded text-xs ${stake.claimed ? "bg-gray-200" : "bg-green-100 text-green-800"}`}>
                        {stake.claimed ? "Withdrawn" : "Active"}
                      </span>
                    </div>

                    <div className="text-sm space-y-1 mb-3">
                      <p><span className="text-gray-600">Amount:</span> {parseFloat(stake.amount).toFixed(4)} {tokenInfo?.symbol}</p>
                      <p><span className="text-gray-600">Start Time:</span> {stake.startTime.toLocaleDateString()}</p>
                      {stake.lockType !== LockType.Flex && (
                        <p><span className="text-gray-600">Unlock Time:</span> {stake.unlockTime.toLocaleDateString()}</p>
                      )}
                      <p><span className="text-gray-600">Current Reward:</span> {parseFloat(stake.reward).toFixed(6)} {tokenInfo?.symbol}</p>
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
