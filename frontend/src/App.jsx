// App.jsx
import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import StakingApp from './components/StakingApp';
import ErrorBoundary from './components/ErrorBoundary';
import addresses from './addresses.json';

function App() {
  const [user, setUser] = useState(null);
  const [addressesValid, setAddressesValid] = useState(null);
  
  // 验证地址配置
  useEffect(() => {
    const validateAddresses = () => {
      try {
        if (!addresses) {
          return { valid: false, error: '找不到addresses.json文件' };
        }
        
        if (!addresses.tokenContract || !addresses.stakingContract) {
          return { 
            valid: false, 
            error: '合约地址不完整',
            details: {
              tokenContract: addresses.tokenContract ? '已设置' : '未设置',
              stakingContract: addresses.stakingContract ? '已设置' : '未设置'
            }
          };
        }
        
        // 验证地址格式
        const isValidAddress = (addr) => /^0x[a-fA-F0-9]{40}$/.test(addr);
        
        if (!isValidAddress(addresses.tokenContract) || !isValidAddress(addresses.stakingContract)) {
          return {
            valid: false,
            error: '合约地址格式不正确',
            details: {
              tokenContract: isValidAddress(addresses.tokenContract) ? '格式正确' : '格式错误',
              stakingContract: isValidAddress(addresses.stakingContract) ? '格式正确' : '格式错误'
            }
          };
        }
        
        return { valid: true };
      } catch (error) {
        return { valid: false, error: error.message };
      }
    };
    
    setAddressesValid(validateAddresses());
  }, []);

  const handleLogin = (userData) => {
    console.log("登录成功，用户数据:", userData);
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  // 如果地址验证失败，显示错误信息
  if (addressesValid && !addressesValid.valid) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-xl font-bold text-red-600 mb-4">配置错误</h2>
          <p className="text-gray-700 mb-4">应用程序配置有误:</p>
          <div className="p-4 bg-red-50 border border-red-200 rounded-md mb-4">
            <p className="text-red-600">{addressesValid.error}</p>
            {addressesValid.details && (
              <ul className="mt-2 text-sm text-gray-700">
                <li>代币合约: {addressesValid.details.tokenContract}</li>
                <li>质押合约: {addressesValid.details.stakingContract}</li>
              </ul>
            )}
          </div>
          <p className="text-sm text-gray-500 mb-4">
            请检查您的addresses.json文件，确保合约地址正确设置。
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {!user ? (
        <Login onLogin={handleLogin} />
      ) : (
        <ErrorBoundary>
          <StakingApp user={user} onLogout={handleLogout} />
        </ErrorBoundary>
      )}
    </div>
  );
}

export default App;