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
      <h2 className="text-xl font-bold mb-4 text-blue-800">Stake Tokens</h2>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Stake Amount
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter stake amount"
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
            Lock Period
          </label>
          <select
            value={lockType}
            onChange={(e) => setLockType(Number(e.target.value))}
            disabled={!isApproved || loading}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
          >
            <option value={LockType.Flex}>Flexible ({rewardRates[LockType.Flex] || 5}% APR)</option>
            <option value={LockType.OneMonth}>1 Month ({rewardRates[LockType.OneMonth] || 8}% APR)</option>
            <option value={LockType.OneYear}>1 Year ({rewardRates[LockType.OneYear] || 15}% APR)</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={!isApproved || loading || !amount || parseFloat(amount) <= 0}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition disabled:opacity-70"
        >
          {loading ? 'Processing...' : 'Stake Tokens'}
        </button>

        {!isApproved && (
          <p className="mt-2 text-sm text-red-600 text-center">
            Please approve tokens first
          </p>
        )}
      </form>
    </div>
  );
}

export default StakeForm;
