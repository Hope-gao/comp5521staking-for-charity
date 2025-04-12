# Staking for Charity Project

## Project Overview
This project is a staking - for - charity initiative based on the Ethereum blockchain, integrating smart contracts and a front - end interface. It utilizes Hardhat for the development, testing, and deployment of smart contracts, and React and Vite to build the front - end interface, enabling users to interact with smart contracts conveniently. The core functions of the project include the distribution of mock tokens, display of user account information, token authorization, and yield rate presentation.

## Project Structure
### Root Directory
- `package.json` and `package - lock.json`: Manage the project's dependencies.
- `hardhat.config.js`: The configuration file for Hardhat, used to configure networks, compiler versions, etc.
- `README.md`: The project's documentation file.

### Smart Contract Section
- `contracts` Folder: Contains the project's smart contract files, such as `Lock.sol`, `MockToken.sol`, and `staking.sol`.
- `test` Folder: Holds the test files for smart contracts, like `Lock.js`.
- `scripts` Folder: Includes scripts for deploying and operating the contracts, such as `deploy.js`, `deploy_old.js`, and `distributeMockToken.js`.
- `deployments` Folder: Stores information about contract deployments.
- `ignition` Folder: Contains the Hardhat Ignition module for advanced contract deployment and management.

### Front - End Section
- `frontend` Folder:
  - `package.json` and `package - lock.json`: Manage the front - end project's dependencies.
  - `index.html`: The entry file for the front - end project.
  - `src` Folder: Holds the source code of the front - end project.
  - `public` Folder: Stores static resources.
  - `vite.config.js`: The configuration file for Vite, used to configure the front - end project's development server and build options.
  - `tailwind.config.js` and `postcss.config.cjs`: Used to configure Tailwind CSS and PostCSS for style processing and optimization.

## Main Functions
### Smart Contracts
- **Mock Token Distribution**: Through the `distributeMockToken.js` script, mock tokens are distributed to specified addresses.
```javascript
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  const mockTokenAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Replace with the actual address
  const mockToken = await ethers.getContractAt("MockToken", mockTokenAddress);

  const addresses = [
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    // Other addresses...
  ];

  const amount = ethers.parseUnits("1000", 18); // Send 1000 MKT to each person
  
  for (const addr of addresses) {
    const tx = await mockToken.transfer(ethers.getAddress(addr), amount);
    await tx.wait();
    console.log(`📦 1000 MKT has been sent to ${addr}`);
  }

  console.log("🎉 Token distribution to all test addresses completed!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```
### Front - End Interface
- **User Panel**: Displays users' account information, token information, token balances, token authorization status, and yield rates.
```jsx
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
        <p className="text-sm font-medium text-gray-600 mb-2">Token Authorization</p>
        {parseFloat(tokenAllowance) > 0 ? (
          <div className="bg-green-50 text-green-700 px-3 py-2 rounded-md text-sm flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Authorized
          </div>
        ) : (
          <button
            onClick={onApprove}
            disabled={loading}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded transition disabled:opacity-70"
          >
            {loading ? 'Processing...' : 'Authorize Token'}
          </button>
        )}
      </div>
      
      {Object.keys(rewardRates).length > 0 && (
        <div className="pt-2">
          <p className="text-sm font-medium text-gray-600 mb-2">Yield Rates</p>
          <div className="bg-blue-50 p-3 rounded-md">
            <div className="flex justify-between text-sm mb-1">
              <span>Demand Deposit</span>
              <span className="font-medium text-blue-800">{rewardRates[0]}% Annualized</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span>1 - Month Fixed Deposit</span>
              <span className="font-medium text-blue-800">{rewardRates[1]}% Annualized</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>1 - Year Fixed Deposit</span>
              <span className="font-medium text-blue-800">{rewardRates[2]}% Annualized</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

## Running Steps
### Smart Contract Section
1. Compile the Contracts
```shell
npx hardhat compile
```
2. Start the Local Node
```shell
npx hardhat node
```
3. Deploy the Contracts to the Local Network
```shell
npx hardhat run scripts/deploy.js --network localhost
```

### Front - End Section
1. Enter the Front - End Project Directory
```shell
cd frontend
```
2. Start the Development Server
```shell
npm run dev
```

## Precautions
- When running the `distributeMockToken.js` script, replace `mockTokenAddress` with the actual deployed `MockToken` contract address.
- Ensure that Node.js and relevant dependencies are installed in the local environment. You can install the project - required dependencies via `npm install`.

## Dependency Information
The project uses the following main dependencies:
- **Smart Contracts**: `@openzeppelin/contracts`, `@nomicfoundation/hardhat-toolbox`, `hardhat`, etc.
- **Front - End**: `react`, `react-dom`, `@vitejs/plugin-react`, `vite`, etc.
For specific dependency versions, refer to the `package.json` and `package - lock.json` files. 