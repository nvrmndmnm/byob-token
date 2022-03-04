// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "./ByobToken.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

interface IERC20 {
    function totalSupply() external view returns (uint256);

    function balanceOf(address account) external view returns (uint256);

    function transfer(address recipient, uint256 amount)
        external
        returns (bool);

    function allowance(address owner, address spender)
        external
        view
        returns (uint256);

    function approve(address spender, uint256 amount) external returns (bool);

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
}

contract UniStake is AccessControl {
    struct Stake {
        uint256 stakedAmount;
        uint256 rewardAmount;
        uint256 startTime;
        bool rewardClaimed;
    }
    Stake s_stake;
    mapping(address => Stake) internal stakes;

    IERC20 public stakingToken;
    ByobToken public rewardsToken;

    uint256 public incentive;
    uint256 public yieldPeriod;
    uint256 public lockPeriod;
    uint256 public totalStaked;

    constructor(address _stakingToken, address _rewardsToken) {
        stakingToken = IERC20(_stakingToken);
        rewardsToken = ByobToken(_rewardsToken);

        incentive = 20;
        yieldPeriod = 600;
        lockPeriod = 1200;
        totalStaked = 0;

        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function stake(uint256 _amount) public {
        require(
            stakes[msg.sender].stakedAmount == 0,
            "Cannot stake more than once"
        );
        stakingToken.transferFrom(msg.sender, address(this), _amount);
        s_stake = Stake(_amount, 0, block.timestamp, false);
        stakes[msg.sender] = s_stake;
        totalStaked += _amount;
    }

    function unstake() public calculateReward {
        require(
            stakes[msg.sender].rewardAmount == 0,
            "Claim your rewards first"
        );
        require(stakes[msg.sender].stakedAmount > 0, "No tokens to unstake");
        require(
            block.timestamp > stakes[msg.sender].startTime + lockPeriod,
            "Staking is not unlocked yet"
        );
        stakingToken.transfer(msg.sender, stakes[msg.sender].stakedAmount);
        totalStaked -= stakes[msg.sender].stakedAmount;
        stakes[msg.sender].stakedAmount = 0;
    }

    function claim() public calculateReward {
        require(
            stakes[msg.sender].rewardAmount > 0,
            "No available rewards yet"
        );
        rewardsToken.transfer(msg.sender, stakes[msg.sender].rewardAmount);
        stakes[msg.sender].rewardAmount = 0;
        stakes[msg.sender].rewardClaimed = true;
    }

    function getAddressReward(address _addr) public view returns (uint256) {
        return stakes[_addr].rewardAmount;
    }

    function getAddressStake(address _addr) public view returns (uint256) {
        return stakes[_addr].stakedAmount;
    }

    function setLockPeriod(uint256 _seconds) public {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Admin only function");
        require(_seconds > 0, "Unlock time cannot be negative");
        lockPeriod = _seconds;
    }

    function setYieldPeriod(uint256 _seconds) public {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Admin only function");
        require(_seconds > 0, "Yield period cannot be negative");
        yieldPeriod = _seconds;
    }

    function setIncentiveValue(uint256 _value) public {
        require(hasRole(DEFAULT_ADMIN_ROLE, msg.sender), "Admin only function");
        require(_value > 0, "Incentive cannot be negative");
        incentive = _value;
    }

    modifier calculateReward() {
        if (
            block.timestamp > stakes[msg.sender].startTime + yieldPeriod &&
            stakes[msg.sender].rewardClaimed == false
        ) {
            stakes[msg.sender].rewardAmount =
                (stakes[msg.sender].stakedAmount * incentive) /
                100;
        }
        _;
    }
}
