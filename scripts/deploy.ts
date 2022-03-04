import {ethers} from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
  
    console.log("Deploying contracts with the account:", deployer.address);
  
    console.log("Account balance:", (await deployer.getBalance()).toString());
  
    const ByobToken = await ethers.getContractFactory("ByobToken");
    const byobToken = await ByobToken.deploy();
    await byobToken.deployed();
    
    console.log("Contract address:", byobToken.address);

    //Deploy staking contract
    const STAKING_TOKEN_CONTRACT = byobToken.address;
    const REWARD_TOKEN_CONTRACT = byobToken.address;

    console.log("Deploying contracts with the account:", deployer.address);
  
    console.log("Account balance:", (await deployer.getBalance()).toString());
  
    const UniStake = await ethers.getContractFactory("UniStake");
    const uniStake = await UniStake.deploy(STAKING_TOKEN_CONTRACT, REWARD_TOKEN_CONTRACT);
    await uniStake.deployed();
    byobToken.transfer(uniStake.address, 10000);
    console.log("Contract address:", uniStake.address);
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });