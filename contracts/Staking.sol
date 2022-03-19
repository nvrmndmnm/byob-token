// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "./ByobToken.sol";
import "./IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract UniStake is Ownable {
    struct Stake {
        uint256 stakedAmount;
        uint256 startTime;
        bool rewardClaimed;
    }
    mapping(address => Stake) internal stakes;
    mapping(address => uint256) internal rewards;

    IERC20 public stakingToken;
    ByobToken public rewardsToken;

    uint256 public incentive;
    uint256 public yieldPeriod;
    uint256 public lockPeriod;
    uint256 public totalStaked;

    constructor(
        address _stakingToken,
        address _rewardsToken,
        uint256 initialIncentive,
        uint256 initialYieldPeriod,
        uint256 initialLockPeriod
    ) {
        stakingToken = IERC20(_stakingToken);
        rewardsToken = ByobToken(_rewardsToken);

        incentive = initialIncentive;
        yieldPeriod = initialYieldPeriod;
        lockPeriod = initialLockPeriod;
        totalStaked = 0;
    }

    function stake(uint256 _amount) public {
        calculateReward();
        if (rewards[msg.sender] > 0) {
            claim();
        }
        stakingToken.transferFrom(msg.sender, address(this), _amount);
        stakes[msg.sender] = Stake(
            stakes[msg.sender].stakedAmount + _amount,
            block.timestamp,
            false
        );
        totalStaked += _amount;
    }

    function unstake() public {
        calculateReward();
        require(rewards[msg.sender] == 0, "Claim your rewards first");
        require(stakes[msg.sender].stakedAmount > 0, "No tokens to unstake");
        require(
            block.timestamp > stakes[msg.sender].startTime + lockPeriod,
            "Staking is not unlocked yet"
        );
        stakingToken.transfer(msg.sender, stakes[msg.sender].stakedAmount);
        totalStaked -= stakes[msg.sender].stakedAmount;
        stakes[msg.sender].stakedAmount = 0;
    }

    function claim() public {
        calculateReward();
        require(rewards[msg.sender] > 0, "No available rewards yet");
        rewardsToken.transfer(msg.sender, rewards[msg.sender]);
        rewards[msg.sender] = 0;
        stakes[msg.sender].rewardClaimed = true;
    }

    function getAddressReward(address _addr) public view returns (uint256) {
        return rewards[_addr];
    }

    function getAddressStake(address _addr) public view returns (uint256) {
        return stakes[_addr].stakedAmount;
    }

    function setLockPeriod(uint256 _seconds) public onlyOwner {
        require(_seconds > 0, "Unlock time cannot be negative");
        lockPeriod = _seconds;
    }

    function setYieldPeriod(uint256 _seconds) public onlyOwner {
        require(_seconds > 0, "Yield period cannot be negative");
        yieldPeriod = _seconds;
    }

    function setIncentiveValue(uint256 _value) public onlyOwner {
        require(_value > 0, "Incentive cannot be negative");
        incentive = _value;
    }

    function calculateReward() internal {
        if (
            block.timestamp > stakes[msg.sender].startTime + yieldPeriod &&
            stakes[msg.sender].rewardClaimed == false
        ) {
            rewards[msg.sender] =
                (stakes[msg.sender].stakedAmount * incentive) /
                100;
        }
    }
}
