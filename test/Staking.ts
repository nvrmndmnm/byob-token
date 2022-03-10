import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Contract, ContractFactory } from "ethers";
import { ethers } from "hardhat";
import 'dotenv/config';

const { expect } = require("chai");

describe("UniStake contract", () => {
    let ByobToken: ContractFactory;
    let UniStake: ContractFactory;
    let byobTokenStake: Contract;
    let byobTokenReward: Contract;
    let uniStake: Contract;
    let owner: SignerWithAddress;
    let addr1: SignerWithAddress;
    let addr2: SignerWithAddress;

    beforeEach(async () => {
        ByobToken = await ethers.getContractFactory("ByobToken");
        UniStake = await ethers.getContractFactory("UniStake");

        [owner, addr1, addr2] = await ethers.getSigners();

        byobTokenStake = await ByobToken.deploy();
        byobTokenReward = await ByobToken.deploy();
        uniStake = await UniStake.deploy(byobTokenStake.address, byobTokenReward.address, 20, 600, 1200);

        await byobTokenStake.transfer(addr1.address, 1000);
        await byobTokenStake.connect(addr1).approve(uniStake.address, 1000);
        await byobTokenStake.transfer(addr2.address, 1000);
        await byobTokenStake.connect(addr2).approve(uniStake.address, 1000);
        await byobTokenReward.transfer(uniStake.address, 10000);
    });

    describe("Deployment", () => {
        it("Should have correct incentive", async () => {
            expect(await uniStake.incentive()).to.equal(20);
        });
        it("Should have correct yield period", async () => {
            expect(await uniStake.yieldPeriod()).to.equal(600);
        });
        it("Should have correct lock period", async () => {
            expect(await uniStake.lockPeriod()).to.equal(1200);
        });
        it("Should have correct total stakes", async () => {
            expect(await uniStake.totalStaked()).to.equal(0);
        });
    });

    describe("Staking operations", () => {
        it("Should stake set amount of tokens", async () => {
            await uniStake.connect(addr1).stake(50);
            await uniStake.connect(addr2).stake(100);
            expect(await uniStake.getAddressStake(addr1.address)).to.equal(50);
            expect(await uniStake.getAddressStake(addr2.address)).to.equal(100);
            expect(await uniStake.totalStaked()).to.equal(150);
        });

        it("Should let to stake twice", async () => {
            await uniStake.connect(addr1).stake(50);
            await uniStake.connect(addr1).stake(50);
            expect(await uniStake.getAddressStake(addr1.address)).to.equal(100);
            expect(await uniStake.totalStaked()).to.equal(100);
        });

        it("Should claim available rewards before second stake", async () => {
            await uniStake.connect(addr1).stake(100);
            await uniStake.setYieldPeriod(1);
            await new Promise(f => setTimeout(f, 1000));
            expect(await byobTokenReward.balanceOf(addr1.address)).to.equal(0);
            await uniStake.connect(addr1).stake(50);
            expect(await byobTokenReward.balanceOf(addr1.address)).to.equal(20);
            expect(await uniStake.getAddressStake(addr1.address)).to.equal(150);
            expect(await uniStake.getAddressReward(addr1.address)).to.equal(0);
            expect(await uniStake.totalStaked()).to.equal(150);
        });

        it("Should unstake all tokens", async () => {
            await uniStake.connect(addr1).stake(50);
            await uniStake.setLockPeriod(1);
            await new Promise(f => setTimeout(f, 1000));
            await uniStake.connect(addr1).unstake();
            expect(await uniStake.totalStaked()).to.equal(0);
        });
        it("Should revert if no tokens to unstake", async () => {
            await expect(uniStake.connect(addr1).unstake())
                .to.be.revertedWith('No tokens to unstake');
        });
        it("Should revert if not unlocked yet", async () => {
            await uniStake.connect(addr1).stake(50);
            await expect(uniStake.connect(addr1).unstake())
                .to.be.revertedWith('Staking is not unlocked yet');
        });
        it("Should revert if rewards not claimed", async () => {
            await uniStake.connect(addr1).stake(50);
            await uniStake.setYieldPeriod(1);
            await new Promise(f => setTimeout(f, 1000));
            await expect(uniStake.connect(addr1).unstake())
                .to.be.revertedWith('Claim your rewards first');
        });

        it("Should claim rewards", async () => {
            await uniStake.connect(addr1).stake(100);
            await uniStake.setYieldPeriod(1);
            await new Promise(f => setTimeout(f, 1000));
            await uniStake.connect(addr1).claim();
            expect(await uniStake.getAddressReward(addr1.address)).to.equal(0);
            expect(await byobTokenReward.balanceOf(addr1.address)).to.equal(20);
        });
        it("Should revert if no rewards added yet", async () => {
            await uniStake.connect(addr1).stake(50);
            await expect(uniStake.connect(addr1).claim())
                .to.be.revertedWith('No available rewards yet');
        });
    });

    describe("Admin setters", () => {
        it("Should set lock period", async () => {
            await uniStake.setLockPeriod(100);
            expect(await uniStake.lockPeriod()).to.equal(100);
        });
        it("Should revert non-admin setting lock period", async () => {
            await expect(uniStake.connect(addr1).setLockPeriod(10))
                .to.be.revertedWith('Ownable: caller is not the owner');
        });
        it("Should revert setting negative lock period", async () => {
            await expect(uniStake.setLockPeriod(0))
                .to.be.revertedWith('Unlock time cannot be negative');
        });

        it("Should set yield period", async () => {
            await uniStake.setYieldPeriod(70);
            expect(await uniStake.yieldPeriod()).to.equal(70);
        });
        it("Should revert non-admin setting yield period", async () => {
            await expect(uniStake.connect(addr1).setYieldPeriod(10))
                .to.be.revertedWith('Ownable: caller is not the owner');
        });
        it("Should revert setting negative yield period", async () => {
            await expect(uniStake.setYieldPeriod(0))
                .to.be.revertedWith('Yield period cannot be negative');
        });

        it("Should set incentive", async () => {
            await uniStake.setIncentiveValue(25);
            expect(await uniStake.incentive()).to.equal(25);
        });
        it("Should revert non-admin setting incentive", async () => {
            await expect(uniStake.connect(addr1).setIncentiveValue(10))
                .to.be.revertedWith('Ownable: caller is not the owner');
        });
        it("Should revert setting negative incentive", async () => {
            await expect(uniStake.setIncentiveValue(0))
                .to.be.revertedWith('Incentive cannot be negative');
        });
    });
});