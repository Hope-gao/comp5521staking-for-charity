import React, { useState } from 'react';

const LockType = {
  Flex: 0,
  OneMonth: 1,
  OneYear: 2
};

function StakeForm({ loading, tokenAllowance, tokenInfo, rewardRates, onStake }) {
  const [amount, setAmount] = useState('');
  const [lockType, setLockType] = useState(LockType.Flex);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;
    onStake(amount, lockType);
    setAmount('');
  };

  const isApproved = parseFloat(tokenAllowance || 0) > 0;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md h-full">
      <h2 className="text-xl font-bold mb-4 text-blue-800">质押代币</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            质押金额
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="输入质押金额"
              disabled={!isApproved || loading}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
            />
            {tokenInfo && (
              <span className="absolute right-3 top-2 text-gray-500">
                {tokenInfo.symbol}
              </span>
            )}
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            锁定期
          </label>
          <select
            value={lockType}
            onChange={(e) => setLockType(Number(e.target.value))}
            disabled={!isApproved || loading}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
          >
            <option value={LockType.Flex}>活期 ({rewardRates[LockType.Flex] || 5}% 年化)</option>
            <option value={LockType.OneMonth}>1个月 ({rewardRates[LockType.OneMonth] || 8}% 年化)</option>
            <option value={LockType.OneYear}>1年 ({rewardRates[LockType.OneYear] || 15}% 年化)</option>
          </select>
        </div>
        
        <button
          type="submit"
          disabled={!isApproved || loading || !amount || parseFloat(amount) <= 0}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition disabled:opacity-70"
        >
          {loading ? '处理中...' : '质押代币'}
        </button>
        
        {!isApproved && (
          <p className="mt-2 text-sm text-red-600 text-center">
            请先授权代币
          </p>
        )}
      </form>
    </div>
  );
}

export default StakeForm;