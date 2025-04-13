import React from 'react';

const LockType = {
  Flex: 0,
  OneMonth: 1,
  OneYear: 2
};

function WithdrawButton({ stake, loading, onWithdraw }) {
  const now = new Date();

  // Check if it is unlocked
  const isUnlocked = stake.lockType === LockType.Flex || now >= stake.unlockTime;

  // Calculate remaining time
  const getRemainingTime = () => {
    if (stake.lockType === LockType.Flex) return null;

    const diff = stake.unlockTime - now;
    if (diff <= 0) return null;

    // Remaining days
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days > 0) {
      return `${days} days remaining`;
    } else {
      // Remaining hours
      const hours = Math.floor(diff / (1000 * 60 * 60));
      return `${hours} hours remaining`;
    }
  };

  const remainingTime = getRemainingTime();

  return (
    <div>
      <button
        onClick={onWithdraw}
        disabled={loading || !isUnlocked}
        className={`w-full py-2 px-4 rounded-md text-white font-medium ${isUnlocked
            ? 'bg-green-600 hover:bg-green-700'
            : 'bg-gray-400 cursor-not-allowed'
          } transition disabled:opacity-70`}
      >
        {loading ? 'Processing...' : (isUnlocked ? 'Withdraw' : 'Locked')}
      </button>

      {remainingTime && (
        <p className="text-xs text-center mt-1 text-gray-500">
          {remainingTime}
        </p>
      )}
    </div>
  );
}

export default WithdrawButton;
