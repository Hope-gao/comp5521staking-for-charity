import React from 'react';

function WalletConnect({ address, isAdmin, onLogout }) {
  return (
    <div className="flex items-center space-x-4">
      <div className="text-right mr-2">
        <p className="text-sm font-medium">
          {address.slice(0, 6)}...{address.slice(-4)}
        </p>
        <p className="text-xs text-gray-500">
          {isAdmin ? 'Administrator' : 'User'}
        </p>
      </div>
      <button
        onClick={onLogout}
        className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm transition"
      >
        Disconnect
      </button>
    </div>
  );
}

export default WalletConnect;
