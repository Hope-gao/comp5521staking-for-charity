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

  //  MetaMask
  const connectWallet = async () => {
    try {
      setLoading(true);
      setError('');

      //  MetaMask
      if (!window.ethereum) {
        throw new Error('Please install the MetaMask plugin and try again!');
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      await provider.send('eth_requestAccounts', []);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      await checkIfAdmin(address, signer);

      setAccount(address);
    } catch (err) {
      console.error('Failed to connect to wallet:', err);
      setError(err.message || 'Failed connection');
    } finally {
      setLoading(false);
    }
  };

  const connectWithPrivateKey = async () => {
    try {
      setLoading(true);
      setError('');

      if (!privateKey || privateKey.trim() === '') {
        throw new Error('Please enter a valid private key');
      }

      let formattedKey = privateKey;
      if (!formattedKey.startsWith('0x')) {
        formattedKey = '0x' + formattedKey;
      }

      const provider = new ethers.JsonRpcProvider('http://localhost:8545');
      const wallet = new ethers.Wallet(formattedKey, provider);
      const address = await wallet.getAddress();

      await checkIfAdmin(address, wallet);

      setAccount(address);

      setPrivateKey(formattedKey);
    } catch (err) {
      console.error('Private key login failed.', err);
      setError(err.message || 'Login failed, please check if the private key is correct');
    } finally {
      setLoading(false);
    }
  };

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
      console.error('Contract call failure', err);
      throw new Error('Contract call failed, please make sure the contract address is correct.');
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
        throw new Error('Invalid login');
      }
      
      onLogin({
        address: account,
        isAdmin,
        signer
      });
    } catch (err) {
      console.error('Failed to initialise signer:', err);
      setError('Initialising the signer failed, please refresh the page or reconnect the wallet.');
    }
  };

  const toggleLoginMethod = () => {
    setLoginMethod(prevMethod => prevMethod === 'wallet' ? 'privateKey' : 'wallet');
    setAccount(null);
    setError('');
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-center text-blue-800 mb-6">
        Pledge DApp Login
        </h1>
        
        <div className="flex justify-center mb-6">
          <div className="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              onClick={() => setLoginMethod('privateKey')}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg ${
                loginMethod === 'privateKey' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
              }`}
            >
              Using private key
            </button>
          </div>
        </div>
        
        <p className="text-center text-gray-600 mb-8">
          {loginMethod === 'wallet' 
            ? 'Connecting with an Etherwallet to Access Pledge Functionality' 
            : 'Enter your private key to access the pledge function'}
        </p>

        {!account ? (
          <>
            {loginMethod === 'wallet' ? (
              <button
                onClick={connectWallet}
                disabled={loading}
                className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-300 disabled:opacity-70"
              >
                {loading ? 'Connecting...' : 'Connecting Wallets'}
              </button>
            ) : (
              <div>
                <div className="relative mb-4">
                  <input
                    type={showPrivateKey ? "text" : "password"}
                    value={privateKey}
                    onChange={(e) => setPrivateKey(e.target.value)}
                    placeholder="Enter your private key"
                    className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPrivateKey(!showPrivateKey)}
                    className="absolute inset-y-0 right-0 px-3 text-sm text-gray-500 hover:text-gray-700"
                  >
                    {showPrivateKey ? 'nestle' : 'demonstrate'}
                  </button>
                </div>
                <button
                  onClick={connectWithPrivateKey}
                  disabled={loading || !privateKey}
                  className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-300 disabled:opacity-70"
                >
                  {loading ? 'Connecting...' : 'Login with private key'}
                </button>
                <p className="mt-2 text-xs text-red-500">
                WARNING: Entering a private key is a security risk, make sure you use this feature in a secure environment.
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center">
            <p className="mb-2 text-gray-700">
            Connected to:<span className="font-mono">{account.slice(0, 6)}...{account.slice(-4)}</span>
            </p>
            <p className="mb-4 text-gray-700">
            Identity:{isAdmin ? 'administrator' : ' user'}
            </p>
            <div className="flex space-x-4">
              <button
                onClick={handleLogin}
                className="flex-1 py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700 transition duration-300"
              >
                Access to applications
              </button>
              <button
                onClick={() => {
                  setAccount(null);
                  setPrivateKey('');
                }}
                className="flex-1 py-2 px-4 bg-gray-400 text-white rounded hover:bg-gray-500 transition duration-300"
              >
                Switching Accounts
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md text-center">
            {error}
          </div>
        )}
        
        {/* Add instructions for installing MetaMask - only shown if wallet is in login mode and no wallet is detected */}
        {loginMethod === 'wallet' && !window.ethereum && !account && (
          <div className="mt-6 p-4 border border-yellow-300 bg-yellow-50 rounded-md">
            <p className="text-sm text-yellow-700 mb-2">
            Etherwallet not detected. Please follow the steps below:
            </p>
            <ol className="text-xs text-gray-700 list-decimal pl-4 space-y-1">
              <li>installed <a href="https://metamask.io/download/" target="_blank" rel="noreferrer" className="text-blue-600 underline">MetaMask 钱包插件</a></li>
              <li>Create or import your ethereum wallet</li>
              <li>Connection to an appropriate network (e.g. Sepolia test network)</li>
              <li>Refresh this page and try again</li>
            </ol>
            <p className="mt-2 text-xs text-blue-600">
            Alternatively, you can <button 
                onClick={toggleLoginMethod} 
                className="underline text-blue-700"
              >
                Login with private key
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;