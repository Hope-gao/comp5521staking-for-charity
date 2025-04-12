// scripts/deploy.js
const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  // 获取部署账户
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);
  
  // ethers v6中getBalance方法已改变
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", balance.toString());

  try {
    // 部署MockToken合约
    console.log("Deploying MockToken contract...");
    const MockToken = await ethers.getContractFactory("MockToken");
    const mockToken = await MockToken.deploy();
    // ethers v6中不再使用deployed()方法
    await mockToken.waitForDeployment();
    // 获取合约地址的方式也变了
    const mockTokenAddress = await mockToken.getAddress();
    console.log("MockToken contract deployed to:", mockTokenAddress);

    // 部署Staking合约
    console.log("Deploying Staking contract...");
    const Staking = await ethers.getContractFactory("Staking");
    const staking = await Staking.deploy(mockTokenAddress);
    await staking.waitForDeployment();
    const stakingAddress = await staking.getAddress();
    console.log("Staking contract deployed to:", stakingAddress);

    // 为质押合约转入一些代币作为奖励池
    console.log("Approving tokens for deposit...");
    const approveAmount = ethers.parseEther("100000"); // 10万代币
    await mockToken.approve(stakingAddress, approveAmount);
    console.log(`Approved ${ethers.formatEther(approveAmount)} tokens for staking contract`);

    console.log("Depositing tokens to the staking contract...");
    const depositAmount = ethers.parseEther("50000"); // 5万代币作为初始奖励池
    await staking.depositReward(depositAmount);
    console.log(`Deposited ${ethers.formatEther(depositAmount)} tokens to the staking contract`);

    // 保存合约地址到文件
    const deploymentInfo = {
      network: network.name,
      tokenContract: mockTokenAddress,
      stakingContract: stakingAddress,
      deployer: deployer.address,
      timestamp: new Date().toISOString()
    };

    // 确保目录存在
    const deploymentsDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    // 写入部署信息到文件
    fs.writeFileSync(
      path.join(deploymentsDir, `${network.name}.json`),
      JSON.stringify(deploymentInfo, null, 2)
    );
    console.log(`Deployment info saved to deployments/${network.name}.json`);

    // 准备前端需要的地址信息
    const frontendAddresses = {
      tokenContract: mockTokenAddress,
      stakingContract: stakingAddress,
      networkId: network.config.chainId || getDefaultChainId(network.name)
    };

    // 确保frontend目录结构存在
    const frontendSrcDir = path.join(__dirname, "../frontend/src");
    if (!fs.existsSync(frontendSrcDir)) {
      fs.mkdirSync(frontendSrcDir, { recursive: true });
    }

    // 保存地址到前端项目
    fs.writeFileSync(
      path.join(frontendSrcDir, "addresses.json"),
      JSON.stringify(frontendAddresses, null, 2)
    );
    console.log("Frontend addresses.json updated successfully");

    // 复制合约ABI到前端项目
    const abiDir = path.join(frontendSrcDir, "abis");
    if (!fs.existsSync(abiDir)) {
      fs.mkdirSync(abiDir, { recursive: true });
    }

    // 定位编译后的合约ABI文件
    const tokenArtifact = require("../artifacts/contracts/MockToken.sol/MockToken.json");
    const stakingArtifact = require("../artifacts/contracts/staking.sol/Staking.json");

    // 保存ABI文件到前端
    fs.writeFileSync(
      path.join(abiDir, "MockToken.json"),
      JSON.stringify(tokenArtifact.abi, null, 2)
    );
    fs.writeFileSync(
      path.join(abiDir, "Staking.json"),
      JSON.stringify(stakingArtifact.abi, null, 2)
    );
    console.log("Contract ABIs copied to frontend/src/abis directory");

    console.log("Deployment completed successfully!");
  } catch (error) {
    console.error("Error during deployment:", error);
    process.exit(1);
  }
}

// 根据网络名称获取默认的链ID
function getDefaultChainId(networkName) {
  const networkMap = {
    mainnet: 1,
    goerli: 5,
    sepolia: 11155111,
    polygon: 137,
    mumbai: 80001,
    hardhat: 31337,
    localhost: 31337
  };
  return networkMap[networkName] || 1;
}

// 执行部署
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });