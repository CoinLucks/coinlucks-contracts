import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { getAddress, parseEther } from "ethers";
import { getTimestamp, printError } from "@/utils/testUtil";
import { deployFixture, defaultRaffle, emptyPrize } from "./utils";
import { ethers } from "hardhat";
import { TestCaseType } from "@/test/types";

//#region Test Datas

const tests = {
  success: [
    {
      description: "Should pass - NAVITE",
      fn: (params: any) => ({
        sender: params.player1,
        inputs: {
          ...defaultRaffle,
          prize: {
            ...emptyPrize,
            amount: parseEther("10"),
          },
        },
        value: parseEther("10"),
      }),
    },
    {
      description: "Should pass - NAVITE2",
      fn: (params: any) => ({
        sender: params.player1,
        inputs: {
          ...defaultRaffle,
          prize: {
            ...emptyPrize,
            amount: parseEther("1"),
          },
        },
        value: parseEther("1"),
      }),
    },
    {
      description: "Should pass - USDT",
      fn: (params: any) => ({
        sender: params.player1,
        inputs: {
          ...defaultRaffle,
          prize: {
            ...emptyPrize,
            prizeType: 1,
            token: params.mockUSDT.target,
            amount: parseEther("1000"),
          },
        },
      }),
      beforeFn: (params: any) => {
        return params.mockUSDT.connect(params.player1).approve(...[params.raffleContract.target, parseEther("1000")]);
      },
    },
    {
      description: "Should pass - NFT",
      fn: (params: any) => ({
        sender: params.player1,
        inputs: {
          ...defaultRaffle,
          prize: {
            ...emptyPrize,
            prizeType: 2,
            token: params.mockNFTMoonbirds.target,
            amount: 1n,
            tokenId: 1,
          },
        },
      }),
      beforeFn: (params: any) => {
        return params.mockNFTMoonbirds
          .connect(params.player1)
          .setApprovalForAll(...[params.raffleContract.target, true]);
      },
    },
  ] as TestCaseType[],
  failure: [
    {
      description: "Should revert - W endTime -  < 3min",
      fn: (params: any) => ({
        sender: params.player1,
        inputs: {
          ...defaultRaffle,
          endTime: BigInt(getTimestamp(new Date().getTime() + 2.5 * 60 * 1000)),
        },
      }),
      revert: "W endTime",
    },
    {
      description: "Should revert - W endTime - > 90 days",
      fn: (params: any) => ({
        sender: params.player1,
        inputs: {
          ...defaultRaffle,
          endTime: BigInt(getTimestamp(new Date().getTime() + 91 * 24 * 60 * 60 * 1000)),
        },
      }),
      revert: "W endTime",
    },
    {
      description: "Should revert -W price - > free maxPerUser:0",
      fn: (params: any) => ({
        sender: params.player1,
        inputs: {
          ...defaultRaffle,
          price: BigInt(0),
        },
      }),
      revert: "W price",
    },
    {
      description: "Should revert -W price - > free maxPerUser:2",
      fn: (params: any) => ({
        sender: params.player1,
        inputs: {
          ...defaultRaffle,
          price: BigInt(0),
          maxPerUser: 2,
        },
      }),
      revert: "W price",
    },
    {
      description: "Should revert - Note too long",
      fn: (params: any) => ({
        sender: params.player1,
        inputs: {
          ...defaultRaffle,
          note: `Hardhat Ignition is a declarative system for deploying smart contracts on Ethereum. It enables you to define smart contract instances you want to deploy, and any operation you want to run on them. By taking over the deployment and execution, Hardhat Ignition lets you focus on your project instead of getting caught up in the deployment details.

                In Hardhat Ignition, deployments are defined through Ignition Modules. These modules serve as abstractions, helping you outline and describe the system that you want to deploy. Each Ignition Module encapsulates a group of smart contract instances and operations within your system.
                
                You can think of Ignition Modules as being conceptually similar to JavaScript modules. In JavaScript, you create a module to group definitions of functions, classes, and values, and then you export some of them. In Hardhat Ignition, you create a module where you group definitions of smart contract instances and operations, and you export some of those contracts. 
                
                Creating a module does`,
        },
      }),
      revert: "Note too long",
    },
    {
      description: "Should revert - W prize amt",
      fn: (params: any) => ({
        sender: params.player1,
        inputs: {
          ...defaultRaffle,
        },
      }),
      revert: "W prize amt",
    },
    {
      description: "Should revert - NAVITE - W value",
      fn: (params: any) => ({
        sender: params.player1,
        inputs: {
          ...defaultRaffle,
          prize: {
            ...emptyPrize,
            amount: 1n,
          },
        },
      }),
      revert: "W value",
    },
    {
      description: "Should revert - USDT -Unlisted prize - address(0)",
      fn: (params: any) => ({
        sender: params.player1,
        inputs: {
          ...defaultRaffle,
          prize: {
            ...emptyPrize,
            prizeType: 1,
            amount: 1n,
          },
        },
      }),
      revert: "Unlisted prize",
    },
    {
      description: "Should revert - USDT - Unlisted prize - unverify",
      fn: (params: any) => ({
        sender: params.player1,
        inputs: {
          ...defaultRaffle,
          prize: {
            ...emptyPrize,
            token: params.player1.address,
            prizeType: 1,
            amount: 1n,
          },
        },
      }),
      revert: "Unlisted prize",
    },
    {
      description: "Should revert - USDT - Insufficient balance",
      fn: (params: any) => ({
        sender: params.player1,
        inputs: {
          ...defaultRaffle,
          prize: {
            ...emptyPrize,
            token: params.mockUSDT.target,
            prizeType: 1,
            amount: BigInt(parseEther("10001")),
          },
        },
      }),
      revert: "Insufficient balance",
    },
    {
      description: "Should revert - USDT - Insufficient allowance",
      fn: (params: any) => ({
        sender: params.player1,
        inputs: {
          ...defaultRaffle,
          prize: {
            ...emptyPrize,
            token: params.mockUSDT.target,
            prizeType: 1,
            amount: BigInt(parseEther("1000")),
          },
        },
      }),
      revert: "Insufficient allowance",
    },
    {
      description: "Should revert - NFT - W nft",
      fn: (params: any) => ({
        sender: params.player1,
        inputs: {
          ...defaultRaffle,
          prize: {
            ...emptyPrize,
            token: params.mockUSDT.target,
            prizeType: 2,
            amount: 1n,
          },
        },
      }),
      revert: "W nft",
    },
    {
      description: "Should revert - NFT - W tokenId",
      fn: (params: any) => ({
        sender: params.player1,
        inputs: {
          ...defaultRaffle,
          prize: {
            ...emptyPrize,
            token: params.mockNFTMoonbirds.target,
            prizeType: 2,
            amount: 1n,
          },
        },
      }),
      revert: "W tokenId",
    },
    {
      description: "Should revert - Eligib zero addr - address(0)",
      fn: (params: any) => ({
        sender: params.player1,
        inputs: {
          ...defaultRaffle,
          prize: {
            ...emptyPrize,
            amount: parseEther("10"),
          },
          eligibility: [
            {
              token: ethers.ZeroAddress,
              amount: 1n,
              tokenId: BigInt(0),
            },
          ],
        },
        value: parseEther("10"),
      }),
      revert: "Eligib zero addr",
    },
    {
      description: "Should revert - Eligib token - other contract",
      fn: (params: any) => ({
        sender: params.player1,
        inputs: {
          ...defaultRaffle,
          prize: {
            ...emptyPrize,
            amount: parseEther("10"),
          },
          eligibility: [
            {
              token: params.raffleVRF.target,
              amount: 1n,
              tokenId: BigInt(0),
            },
          ],
        },
        value: parseEther("10"),
      }),
      revert: "Eligib token",
    },
    {
      description: "Should revert - Eligib amt - USDT",
      fn: (params: any) => ({
        sender: params.player1,
        inputs: {
          ...defaultRaffle,
          prize: {
            ...emptyPrize,
            amount: parseEther("10"),
          },
          eligibility: [
            {
              token: params.mockUSDT.target,
              amount: BigInt(0),
              tokenId: BigInt(0),
            },
          ],
        },
        value: parseEther("10"),
      }),
      revert: "Eligib amt",
    },
    {
      description: "Should revert - Eligib amt - NFT 1155",
      fn: (params: any) => ({
        sender: params.player1,
        inputs: {
          ...defaultRaffle,
          prize: {
            ...emptyPrize,
            amount: parseEther("10"),
          },
          eligibility: [
            {
              token: params.mockNFTFrontier.target,
              amount: 1n,
              tokenId: BigInt(0),
            },
          ],
        },
        value: parseEther("10"),
      }),
      revert: "Eligib amt",
    },
    {
      description: "Should revert - Eligib amt - NFT 1155 2",
      fn: (params: any) => ({
        sender: params.player1,
        inputs: {
          ...defaultRaffle,
          prize: {
            ...emptyPrize,
            amount: parseEther("10"),
          },
          eligibility: [
            {
              token: params.mockNFTFrontier.target,
              amount: BigInt(0),
              tokenId: 1n,
            },
          ],
        },
        value: parseEther("10"),
      }),
      revert: "Eligib amt",
    },
    {
      description: "Should revert - Eligib amt - 721",
      fn: (params: any) => ({
        sender: params.player1,
        inputs: {
          ...defaultRaffle,
          prize: {
            ...emptyPrize,
            amount: parseEther("10"),
          },
          eligibility: [
            {
              token: params.mockNFTFrontier.target,
              amount: BigInt(0),
              tokenId: 1n,
            },
          ],
        },
        value: parseEther("10"),
      }),
      revert: "Eligib amt",
    },
  ] as TestCaseType[],
};

//#endregion

describe("Raffle-create", function () {
  let fixture: any;

  before(async () => {
    fixture = await loadFixture(deployFixture);
    // setVerifyAddress
    const { raffleContract, mockUSDT, mockNFTMoonbirds, mockNFTFrontier, owner } = fixture;
    await raffleContract
      .connect(owner)
      .setVerifyAddress([mockUSDT.target, mockNFTMoonbirds.target, mockNFTFrontier.target], true);
  });

  describe("Deployment", function () {
    it("Should set the right VRF", async function () {
      const { raffleContract, raffleVRF } = fixture;
      const [VRF,,,] = await raffleContract.gameInfo();
      expect(VRF).to.equal(raffleVRF.target);
    });

    it("Should set the right REFERRAL", async function () {
      const { raffleContract, referral } = fixture;
      const [,REFERRAL,,] = await raffleContract.gameInfo();
      expect(REFERRAL).to.equal(referral.target);
    });

    it("Should set the right Mock addressVerify", async function () {
      const { raffleContract, mockUSDT, mockNFTMoonbirds, owner } = fixture;
      expect(await raffleContract.connect(owner).addressVerify(...[mockUSDT.target])).to.equal(true);
      expect(await raffleContract.connect(owner).addressVerify(...[mockNFTMoonbirds.target])).to.equal(true);
    });

    it("Should set the right owner", async function () {
      const { raffleContract, raffleVRF, referral, owner } = fixture;

      expect(await raffleContract.owner()).to.equal(getAddress(owner.address));
      expect(await raffleVRF.owner()).to.equal(getAddress(owner.address));
      expect(await referral.owner()).to.equal(getAddress(owner.address));
    });
  });

  describe("🟥 failure", function () {
    tests.failure.forEach((test) => {
      it(test.description, async function () {
        const { raffleContract } = fixture;
        const { inputs, sender, value } = test.fn(fixture);
        try {
          await expect(
            raffleContract.connect(sender).create(...Object.values(inputs), { value: value }),
          ).to.be.rejectedWith(test.revert!);
        } catch (ex) {
          printError(ex, test.description);
        }
      });
    });
  });

  describe("✅ success", function () {
    tests.success.forEach((test) => {
      it(test.description, async function () {
        const { raffleContract } = fixture;
        const { inputs, sender, value } = test.fn(fixture);
        if (test.beforeFn) {
          await expect(test.beforeFn(fixture)).to.be.fulfilled;
        }

        const [,,rid,] = await raffleContract.gameInfo();
        try {
          // check tx
          await expect(raffleContract.connect(sender).create(...Object.values(inputs), { value: value }))
            .to.emit(raffleContract, "RaffleCreated")
            .withArgs(rid + 1n, sender.address, inputs.endTime, inputs.note);
        } catch (ex) {
          printError(ex, test.description);
        }
      });
    });
  });
});
