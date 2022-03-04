import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract, ContractFactory } from "ethers";
import { ethers } from "hardhat";
import 'dotenv/config';

const { expect } = require("chai");
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const STAKING_TOKEN_CONTRACT = `${process.env.TEST_STAKING_CONTRACT_ADDRESS}`;
const REWARD_TOKEN_CONTRACT = `${process.env.TEST_REWARD_CONTRACT_ADDRESS}`;

describe("UniStake contract", () => {
    let UniStake: ContractFactory;
    let uniStake: Contract;
    let owner: SignerWithAddress;
    let addr1: SignerWithAddress;
    let addr2: SignerWithAddress;

    beforeEach(async () => {
        UniStake = await ethers.getContractFactory("UniStake");
        [owner, addr1, addr2] = await ethers.getSigners();

        uniStake = await UniStake.deploy(STAKING_TOKEN_CONTRACT, REWARD_TOKEN_CONTRACT);
    });

    describe("Deployment", () => {
        it("Should have correct incentive", async () => {
            expect(await uniStake.incentive()).to.equal(20);
        });
    });
});