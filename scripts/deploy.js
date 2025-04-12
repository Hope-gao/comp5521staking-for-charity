// scripts/deploy.js
const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", balance.toString());

  try {
    // 部署 MockToken 合约
    console.log("Deploying MockToken contract...");
    const MockToken = await ethers.getContractFactory("MockToken");
    const mockToken = await MockToken.deploy();
    await mockToken.waitForDeployment();
    const mockTokenAddress = await mockToken.getAddress();
    console.log("MockToken deployed at:", mockTokenAddress);

    // 部署 Staking 合约
    console.log("Deploying Staking contract...");
    const Staking = await ethers.getContractFactory("Staking");
    const staking = await Staking.deploy(mockTokenAddress);
    await staking.waitForDeployment();
    const stakingAddress = await staking.getAddress();
    console.log("Staking deployed at:", stakingAddress);

    // 授权 + 注资奖励池
    console.log("Approving tokens...");
    const approveAmount = ethers.parseEther("100000");
    await mockToken.approve(stakingAddress, approveAmount);
    console.log("Approved.");

    console.log("Depositing reward pool...");
    const depositAmount = ethers.parseEther("50000");
    await staking.depositReward(depositAmount);
    console.log("Deposited 50000 MKT to staking reward pool");

    // ✅ 批量发币
    console.log("Distributing 1000 MKT to user addresses...");
    const addresses = [
      "0xf39fd6e51aad88f6f4ce6ab8827279cfff92266",
      "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
      "0x3c44cddb6a900fa2b585dd299e03d12fa4293bc",
      "0x90f79bf6eb2c4f870365e785982e1f101e93b906",
      "0x15d34aaf54267db7d7c367839aaf71a00a2c6a65",
      "0x9965507d1a55bcc2695c58ba16fb37d819b0a4dc",
      "0x976ea74026e726554db657fa54763abd0c3a0aa9",
      "0x14dc79964da2c08b23698b3d3cc7ca32193d9955",
      "0x23618e81e3f5cdf7f54c3d65f7fbc0abf5b21e8f",
      "0xa0ee7a142d267c1f36714e4a8f75612f20a79720",
      "0xbcd4042de499d14e55001ccbb24a551f3b954096",
      "0x71be63f3384f5fb98995898a86b02fb2426c5788",
      "0xfabb0ac9d68b0b445fb7357272ff202c5651694a",
      "0x1cbd3b2770909d4e10f157cabc84c7264073c9ec",
      "0xdf3e18d64bc6a983f673ab319ccae4f1a57c7097",
      "0xcd3b766ccdd6ae721141f452c550ca635964ce71",
      "0x2546bcd3c84621e976d8185a91a922ae77ecec30",
      "0xbda5747bfd65f08deb54cb465eb87d40e51b197e",
      "0xdd2fd4581271e230360230f9337d5c0430bf44c0",
      "0x8626f6940e2eb28930efb4cef49b2d1f2c9c1199"
    ];
    const amount = ethers.parseUnits("1000", 18);
    for (const addr of addresses) {
      try {
        const tx = await mockToken.transfer(addr, amount);
        await tx.wait();
        console.log(`✅ Sent 1000 MKT to ${addr}`);
      } catch (e) {
        console.error(`❌ Failed to send to ${addr}:`, e.message);
      }
    }

    // 保存部署信息
    const deploymentInfo = {
      network: network.name,
      tokenContract: mockTokenAddress,
      stakingContract: stakingAddress,
      deployer: deployer.address,
      timestamp: new Date().toISOString()
    };

    const deploymentsDir = path.join(__dirname, "../deployments");
    if (!fs.existsSync(deploymentsDir)) {
      fs.mkdirSync(deploymentsDir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(deploymentsDir, `${network.name}.json`),
      JSON.stringify(deploymentInfo, null, 2)
    );

    // 保存前端地址文件
    const frontendAddresses = {
      tokenContract: mockTokenAddress,
      stakingContract: stakingAddress,
      networkId: network.config.chainId || 31337
    };
    const frontendDir = path.join(__dirname, "../frontend/src");
    if (!fs.existsSync(frontendDir)) {
      fs.mkdirSync(frontendDir, { recursive: true });
    }
    fs.writeFileSync(
      path.join(frontendDir, "addresses.json"),
      JSON.stringify(frontendAddresses, null, 2)
    );

    // 保存 ABI
    const abiDir = path.join(frontendDir, "abis");
    if (!fs.existsSync(abiDir)) {
      fs.mkdirSync(abiDir, { recursive: true });
    }
    const tokenArtifact = require("../artifacts/contracts/MockToken.sol/MockToken.json");
    const stakingArtifact = require("../artifacts/contracts/staking.sol/Staking.json");
    fs.writeFileSync(path.join(abiDir, "MockToken.json"), JSON.stringify(tokenArtifact.abi, null, 2));
    fs.writeFileSync(path.join(abiDir, "Staking.json"), JSON.stringify(stakingArtifact.abi, null, 2));

    console.log("🎉 Deployment completed successfully!");
  } catch (error) {
    console.error("❌ Error during deployment:", error);
    process.exit(1);
  }
}

main();
