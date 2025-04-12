import React from 'react';

const LockType = {
  Flex: 0,
  OneMonth: 1,
  OneYear: 2
};

function WithdrawButton({ stake, loading, onWithdraw }) {
  const now = new Date();
  
  // 检查是否已到期
  const isUnlocked = stake.lockType === LockType.Flex || now >= stake.unlockTime;
  
  // 计算剩余时间
  const getRemainingTime = () => {
    if (stake.lockType === LockType.Flex) return null;
    
    const diff = stake.unlockTime - now;
    if (diff <= 0) return null;
    
    // 剩余天数
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days > 0) {
      return `还剩 ${days} 天`;
    } else {
      // 剩余小时
      const hours = Math.floor(diff / (1000 * 60 * 60));
      return `还剩 ${hours} 小时`;
    }
  };
  
  const remainingTime = getRemainingTime();
  
  return (
    <div>
      <button
        onClick={onWithdraw}
        disabled={loading || !isUnlocked}
        className={`w-full py-2 px-4 rounded-md text-white font-medium ${
          isUnlocked 
            ? 'bg-green-600 hover:bg-green-700' 
            : 'bg-gray-400 cursor-not-allowed'
        } transition disabled:opacity-70`}
      >
        {loading ? '处理中...' : (isUnlocked ? '提取' : '锁定中')}
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