import React, { useState } from 'react';
import { ethers } from 'ethers';
import addresses from '../addresses.json';

function Login({ onLogin }) {
  const [account, setAccount] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginMethod, setLoginMethod] = useState('wallet'); // 'wallet' 或 'privateKey'
  const [privateKey, setPrivateKey] = useState('');
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  // 连接到 MetaMask
  const connectWallet = async () => {
    try {
      setLoading(true);
      setError('');

      // 检查是否安装了 MetaMask
      if (!window.ethereum) {
        throw new Error('请安装 MetaMask 插件后再试！');
      }

      // 请求账户访问
      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      // 检查是否是管理员
      await checkIfAdmin(address, signer);

      setAccount(address);
    } catch (err) {
      console.error('连接钱包失败:', err);
      setError(err.message || '连接失败');
    } finally {
      setLoading(false);
    }
  };

  // 使用私钥登录
  const connectWithPrivateKey = async () => {
    try {
      setLoading(true);
      setError('');

      if (!privateKey || privateKey.trim() === '') {
        throw new Error('请输入有效的私钥');
      }

      // 验证私钥格式
      let formattedKey = privateKey;
      if (!formattedKey.startsWith('0x')) {
        formattedKey = '0x' + formattedKey;
      }

      // 创建钱包实例
      const provider = new ethers.JsonRpcProvider('http://localhost:8545');
      const wallet = new ethers.Wallet(formattedKey, provider);
      const address = await wallet.getAddress();

      // 检查是否是管理员
      await checkIfAdmin(address, wallet);

      setAccount(address);
      // 保存格式化后的私钥
      setPrivateKey(formattedKey);
    } catch (err) {
      console.error('私钥登录失败:', err);
      setError(err.message || '登录失败，请检查私钥是否正确');
    } finally {
      setLoading(false);
    }
  };

  // 检查是否是管理员账户
  const checkIfAdmin = async (address, signerOrWallet) => {
    try {
      const stakingAbi = ["function owner() view returns (address)"];
      const stakingContract = new ethers.Contract(
        addresses.stakingContract, 
        stakingAbi, 
        signerOrWallet
      );
      const owner = await stakingContract.owner();
      const isOwner = address.toLowerCase() === owner.toLowerCase();
      setIsAdmin(isOwner);
    } catch (err) {
      console.error('合约调用失败', err);
      throw new Error('合约调用失败，请确认合约地址是否正确');
    }
  };

  const handleLogin = async () => {
    if (!account) return;
  
    try {
      let signer;
      
      if (loginMethod === 'wallet' && window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        signer = await provider.getSigner();
      } else if (loginMethod === 'privateKey') {
        const provider = new ethers.JsonRpcProvider('http://localhost:8545');
        signer = new ethers.Wallet(privateKey, provider);
      } else {
        throw new Error('无效的登录方式');
      }
      
      onLogin({
        address: account,
        isAdmin,
        signer
      });
    } catch (err) {
      console.error('初始化 signer 失败:', err);
      setError('初始化 signer 失败，请刷新页面或重新连接钱包。');
    }
  };

  const toggleLoginMethod = () => {
    setLoginMethod(prevMethod => prevMethod === 'wallet' ? 'privateKey' : 'wallet');
    setAccount(null);
    setError('');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-800 mb-2">
            质押 DApp
          </h1>
          <div className="h-1 w-20 bg-indigo-600 mx-auto rounded-full mb-4"></div>
          <p className="text-gray-600">安全连接您的账户</p>
        </div>
        
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-lg shadow-sm" role="group">
            <button
              type="button"
              onClick={() => setLoginMethod('wallet')}
              className={`px-6 py-3 text-sm font-medium rounded-l-lg transition-all duration-200 ${
                loginMethod === 'wallet' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 7H5C3.89543 7 3 7.89543 3 9V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V9C21 7.89543 20.1046 7 19 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M16 15H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M3 10H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                以太坊钱包
              </span>
            </button>
            <button
              type="button"
              onClick={() => setLoginMethod('privateKey')}
              className={`px-6 py-3 text-sm font-medium rounded-r-lg transition-all duration-200 ${
                loginMethod === 'privateKey' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 7H18C19.1046 7 20 7.89543 20 9V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V9C4 7.89543 4.89543 7 6 7H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 15V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 6L12 3L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                私钥登录
              </span>
            </button>
          </div>
        </div>
        
        <p className="text-center text-gray-600 mb-6">
          {loginMethod === 'wallet' 
            ? '使用您的以太坊钱包连接以访问质押功能' 
            : '输入您的私钥以访问质押功能（仅用于测试环境）'}
        </p>

        {!account ? (
          <>
            {loginMethod === 'wallet' ? (
              <button
                onClick={connectWallet}
                disabled={loading}
                className="w-full py-3 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-300 disabled:opacity-70 flex items-center justify-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    连接中...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                    连接钱包
                  </>
                )}
              </button>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <input
                    type={showPrivateKey ? "text" : "password"}
                    value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value)}
                    placeholder="输入您的私钥"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 bg-gray-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPrivateKey(!showPrivateKey)}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-sm text-gray-500 hover:text-gray-700"
                  >
                    {showPrivateKey ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                      </svg>
                    )}
                  </button>
                </div>
                <button
                  onClick={connectWithPrivateKey}
                  disabled={loading || !privateKey}
                  className="w-full py-3 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-300 disabled:opacity-70 flex items-center justify-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      连接中...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                      </svg>
                      使用私钥登录
                    </>
                  )}
                </button>
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-lg">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-amber-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-xs text-amber-700">
                        警告：输入私钥存在安全风险，请确保在安全环境中使用此功能。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center">
            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
              </svg>
            </div>
            <p className="mb-2 text-gray-700">
              已连接至：<span className="font-mono bg-gray-100 px-2.5 py-0.5 rounded-full">{account.slice(0, 6)}...{account.slice(-4)}</span>
            </p>
            <p className="mb-6 text-gray-700 flex items-center justify-center">
              身份：
              {isAdmin ? (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                  </svg>
                  管理员
                </span>
              ) : (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                  普通用户
                </span>
              )}
            </p>
            <div className="flex space-x-4">
              <button
                onClick={handleLogin}
                className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-300 flex items-center justify-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                </svg>
                进入应用
              </button>
              <button
                onClick={() => {
                  setAccount(null);
                  setPrivateKey('');
                }}
                className="flex-1 py-3 px-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition duration-300 flex items-center justify-center shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
                </svg>
                切换账户
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* 添加安装 MetaMask 的指导 - 仅在钱包登录模式且未检测到钱包时显示 */}
        {loginMethod === 'wallet' && !window.ethereum && !account && (
          <div className="mt-6 p-4 border border-blue-300 bg-blue-50 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700 font-medium mb-2">
                  未检测到以太坊钱包
                </p>
                <ol className="text-xs text-gray-700 list-decimal pl-4 space-y-1">
                  <li>安装 <a href="https://metamask.io/download/" target="_blank" rel="noreferrer" className="text-blue-600 underline hover:text-blue-800">MetaMask 钱包插件</a></li>
                  <li>创建或导入您的以太坊钱包</li>
                  <li>连接到适当的网络</li>
                  <li>刷新此页面并重试</li>
                </ol>
                <p className="mt-3 text-xs text-blue-600">
                  或者，您可以 
                  <button 
                    onClick={toggleLoginMethod} 
                    className="ml-1 underline text-blue-700 hover:text-blue-900 font-medium"
                  >
                    使用私钥登录
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
          质押 DApp © {new Date().getFullYear()} | 安全连接，放心质押
        </div>
      </div>
    </div>
  );
}

export default Login;