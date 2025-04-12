import React, { useState } from 'react';

function AdminPanel({ loading, tokenInfo, tokenAllowance, onDepositReward }) {
  const [amount, setAmount] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;
    onDepositReward(amount);
    setAmount('');
  };

  const isApproved = parseFloat(tokenAllowance || 0) > 0;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md h-full">
      <h2 className="text-xl font-bold mb-4 text-blue-800">Administrator Tools</h2>
      
      <div className="mb-4 pb-3 border-b">
        <p className="text-sm text-gray-600">
        As an administrator, you can top up the reward pool with tokens to ensure that users are able to receive pledge earnings.
        </p>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
          Top-up Reward Pool
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter the top-up amount"
              disabled={!isApproved || loading}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100 disabled:text-gray-500"
            />
            {tokenInfo && (
              <span className="absolute right-3 top-2 text-gray-500">
                {tokenInfo.symbol}
              </span>
            )}
          </div>
        </div>
        
        <button
          type="submit"
          disabled={!isApproved || loading || !amount || parseFloat(amount) <= 0}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition disabled:opacity-70"
        >
          {loading ? 'process ...' : 'Top-up Reward Pool'}
        </button>
        
        {!isApproved && (
          <p className="mt-2 text-sm text-red-600 text-center">
            Please authorise tokens first
          </p>
        )}
      </form>
    </div>
  );
}

export default AdminPanel;