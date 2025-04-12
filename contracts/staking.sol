// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ✅ input OpenZeppelin Ownable（v5.x）
import "@openzeppelin/contracts/access/Ownable.sol";

interface IERC20 {
    function transferFrom(address from, address to, uint amount) external returns (bool);
    function transfer(address to, uint amount) external returns (bool);
    function balanceOf(address account) external view returns (uint);
}

contract Staking is Ownable {
    IERC20 public token;

    enum LockType { Flex, OneMonth, OneYear }

    struct StakeInfo {
        uint amount;
        uint startTime;
        LockType lockType;
        bool claimed;
    }

    mapping(address => StakeInfo[]) public stakes;

    // Annualised rate of return (percentage)
    mapping(LockType => uint) public rewardRates;

    // ✅ 构造函数调用 Ownable(msg.sender)
    constructor(address _token) Ownable(msg.sender) {
        token = IERC20(_token);

        rewardRates[LockType.Flex] = 5;         // Callable at 5% p.a.
        rewardRates[LockType.OneMonth] = 8;     // 1-month fixed deposit 8% p.a.
        rewardRates[LockType.OneYear] = 15;     // 1-year fixed deposit 15% p.a.
    }

    function stake(uint amount, LockType lockType) external {
        require(amount > 0, "amount = 0");
        require(uint(lockType) <= uint(LockType.OneYear), "invalid lock type");

        require(token.transferFrom(msg.sender, address(this), amount), "transferFrom failed");


        stakes[msg.sender].push(StakeInfo({
            amount: amount,
            startTime: block.timestamp,
            lockType: lockType,
            claimed: false
        }));
    }

    function calcReward(StakeInfo memory info) public view returns (uint) {
        uint duration = block.timestamp - info.startTime;
        uint rate = rewardRates[info.lockType];
        return (info.amount * rate * duration) / (365 days * 100);
    }

    function withdraw(uint index) external {
        require(index < stakes[msg.sender].length, "invalid index");

        StakeInfo storage info = stakes[msg.sender][index];
        require(!info.claimed, "already claimed");

        if (info.lockType == LockType.OneMonth) {
            require(block.timestamp >= info.startTime + 30 days, "1 month lock");
        } else if (info.lockType == LockType.OneYear) {
            require(block.timestamp >= info.startTime + 365 days, "1 year lock");
        }

        uint reward = calcReward(info);
        uint total = info.amount + reward;

        require(token.balanceOf(address(this)) >= total, "insufficient contract balance");

        info.claimed = true;
        token.transfer(msg.sender, total);
    }

    // Only owner (administrator) can call for recharging reward pools
    function depositReward(uint amount) external onlyOwner {
        require(amount > 0, "amount = 0");
        token.transferFrom(msg.sender, address(this), amount);
    }

    // See how many pledges a user has
    function getStakeCount(address user) external view returns (uint) {
        return stakes[user].length;
    }

    // Get details of a pledge
    function getStake(address user, uint index) external view returns (
        uint amount,
        uint startTime,
        LockType lockType,
        bool claimed,
        uint reward,
        uint unlockTime
    ) {
        StakeInfo memory info = stakes[user][index];
        amount = info.amount;
        startTime = info.startTime;
        lockType = info.lockType;
        claimed = info.claimed;
        reward = calcReward(info);

        if (lockType == LockType.OneMonth) {
            unlockTime = info.startTime + 30 days;
        } else if (lockType == LockType.OneYear) {
            unlockTime = info.startTime + 365 days;
        } else {
            unlockTime = info.startTime;
        }
    }
}