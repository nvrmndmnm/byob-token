import { task } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import 'dotenv/config';

const CONTRACT_ADDRESS = `${process.env.UNISTAKE_CONTRACT_ADDRESS}`;
const ROUTER_ADDRESS = `${process.env.UNISWAP_ROUTER_ADDRESS}`;

task("stake", "Stake set amount of tokens from the caller address")
    .addParam("address", "Spender address")
    .addParam("value", "Amount of tokens to stake")
    .setAction(async (args, hre) => {
        const staking = await hre.ethers.getContractAt("UniStake", CONTRACT_ADDRESS);
        const signer = await hre.ethers.getSigner(args.address);
        await staking.connect(signer).stake(args.value);
        console.log(`Staked ${args.value} tokens from ${args.address}.`);
    });
task("unstake", "Unstake all tokens of the caller address")
    .addParam("address", "Caller address")
    .setAction(async (args, hre) => {
        const staking = await hre.ethers.getContractAt("UniStake", CONTRACT_ADDRESS);
        const signer = await hre.ethers.getSigner(args.address);
        await staking.connect(signer).unstake();
        console.log(`Unstaked tokens of ${args.address}`);
    });
task("claim", "Transfers all reward tokens the caller")
    .addParam("address", "Caller address")
    .setAction(async (args, hre) => {
        const staking = await hre.ethers.getContractAt("UniStake", CONTRACT_ADDRESS);
        const signer = await hre.ethers.getSigner(args.address);
        await staking.connect(signer).claim();
        console.log(`Claimed all reward tokens of ${args.address}`);
    });
task("add-liquidity", "Add Uniswap v2 liquidity")
    .addParam("tokenA", "A pool token")
    .addParam("tokenB", "A pool token")
    .addParam("amountADesired", "The amount of token A to add as liquidity")
    .addParam("amountBDesired", "The amount of token B to add as liquidity")
    .addParam("amountAMin", "Bounds the extent to which the tokenA/tokenB price can go up before the transaction reverts")
    .addParam("amountBMin", "Bounds the extent to which the tokenB/tokenA price can go up before the transaction reverts")
    .addParam("to", "Recipient of the liquidity tokens")
    .addParam("deadline", "Unix timestamp after which the transaction will revert")
    .setAction(async (args, hre) => {
        const router = await hre.ethers.getContractAt("IUniswapV2Router02", ROUTER_ADDRESS);
        const signer = await hre.ethers.getSigner(args.address);
        await router.connect(signer).addLiquidity(
            args.tokenA,
            args.tokenB,
            args.amountADesired,
            args.amountBDesired,
            args.amountAMin,
            args.amountBMin,
            args.to,
            args.deadline
        );
    });