import { task } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import 'dotenv/config';

const CONTRACT_ADDRESS = `${process.env.UNISTAKE_CONTRACT_ADDRESS}`;

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