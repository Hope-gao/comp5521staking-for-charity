import React from 'react';

function UserPanel({
  address,
  isAdmin,
  tokenInfo,
  tokenBalance,
  tokenAllowance,
  rewardRates,
  loading,
  onApprove
}) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md h-full">
      <h2 className="text-xl font-bold mb-4 text-blue-800">Account Information</h2>

      <div className="mb-4 pb-4 border-b">
        <p className="text-sm font-medium text-gray-600">Wallet Address</p>
        <p className="font-mono text-sm truncate">
          {address}
        </p>
        <p className="mt-1 text-sm">
          <span className={`inline-block px-2 py-1 rounded-full text-xs ${isAdmin ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
            {isAdmin ? 'Administrator' : 'Regular User'}
          </span>
        </p>
      </div>

      {tokenInfo && (
        <div className="mb-4 pb-4 border-b">
          <p className="text-sm font-medium text-gray-600">Token Information</p>
          <p className="mt-1">
            <span className="text-gray-700">{tokenInfo.name}</span>
            <span className="ml-1 text-xs text-gray-500">({tokenInfo.symbol})</span>
          </p>
          <p className="mt-2 text-sm font-medium text-gray-600">Balance</p>
          <p className="text-lg font-semibold">
            {parseFloat(tokenBalance).toFixed(4)} {tokenInfo.symbol}
          </p>
        </div>
      )}

      <div className="mb-4">
        <p className="text-sm font-medium text-gray-600 mb-2">Token Approval</p>
        {parseFloat(tokenAllowance) > 0 ? (
          <div className="bg-green-50 text-green-700 px-3 py-2 rounded-md text-sm flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Approved
          </div>
        ) : (
          <button
            onClick={onApprove}
            disabled={loading}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded transition disabled:opacity-70"
          >
            {loading ? 'Processing...' : 'Approve Token'}
          </button>
        )}
      </div>

      {Object.keys(rewardRates).length > 0 && (
        <div className="pt-2">
          <p className="text-sm font-medium text-gray-600 mb-2">Reward Rates</p>
          <div className="bg-blue-50 p-3 rounded-md">
            <div className="flex justify-between text-sm mb-1">
              <span>Flexible</span>
              <span className="font-medium text-blue-800">{rewardRates[0]}% APR</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span>1-Month Fixed</span>
              <span className="font-medium text-blue-800">{rewardRates[1]}% APR</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>1-Year Fixed</span>
              <span className="font-medium text-blue-800">{rewardRates[2]}% APR</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserPanel;
