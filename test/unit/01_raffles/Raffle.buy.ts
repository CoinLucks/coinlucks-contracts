import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { printError } from "@/utils/testUtil";
import {
  deployFixture,
  createERC1155Raffle,
  createERC20Raffle,
  createERC721Raffle,
  createNativeRaffle,
  defaultRaffle,
  defaultTicket,
} from "./utils";
import { TestCaseType } from "@/test/types";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";

//#region Test Datas

const tests = {
  success: [
    {
      description: "Should pass - raffleId:1",
      fn: (params: any) => {
        const tk = { ...defaultTicket };
        return {
          sender: params.player2,
          inputs: {
            ...tk,
          },
          value: tk.num * defaultRaffle.price,
        };
      },
    },
    {
      description: "Should pass - raffleId:1 buyTo",
      fn: (params: any) => {
        const tk = { ...defaultTicket };
        return {
          sender: params.player2,
          inputs: {
            ...tk,
            to: params.accounts[3].address,
          },
          value: tk.num * defaultRaffle.price,
        };
      },
    },
    {
      description: "Should pass - raffleId:1 bind ref -> player1 -> player1->2 --> player3",
      fn: (params: any) => {
        const tk = { ...defaultTicket };
        return {
          sender: params.player2,
          inputs: {
            ...tk,
            ref: params.player1.address,
          },
          value: tk.num * defaultRaffle.price,
          outputs: {
            event: "ReferralReward",
            args: [tk.raffleId, params.player2.address, params.player1.address, anyValue, anyValue],
          },
        };
      },
      // afterFn: async (params: any) => {
      //   // check referral shares
      //   const events = await params.raffleContract.getEvents.ReferralReward();
      //   expect(events).to.have.lengthOf(1);

      //   const args1 = events[0].args;
      //   expect(args1.referrer).to.equal(params.player1.address);
      // },
    },
    {
      description: "Should pass - raffleId:2 - bind ref2 -> player1 -> player1->2 --> player3",
      fn: (params: any) => {
        const tk = { ...defaultTicket };
        return {
          sender: params.player3,
          inputs: {
            ...tk,
            raffleId: 2n,
            ref: params.player2.address,
          },
          value: tk.num * defaultRaffle.price,
          outputs: {
            event: "ReferralReward",
            args: [2n, params.player3.address, params.player2.address, anyValue, anyValue],
          },
        };
      },
      // afterFn: async (params: any) => {
      //   // check referral shares
      //   const events = await params.raffleContract.getEvents.ReferralReward();
      //   expect(events).to.have.lengthOf(2);

      //   const args1 = events[0].args;
      //   const args2 = events[1].args;
      //   expect(args1.referrer).to.equal(params.player2.address);
      //   expect(args2.referrer).to.equal(params.player1.address);
      // },
    },
    {
      description: "Should pass - raffleId:3 player1 - take default ref -> player1->2 --> player3",
      fn: (params: any) => {
        const tk = { ...defaultTicket };
        return {
          sender: params.player3,
          inputs: {
            ...tk,
            raffleId: 3n,
          },
          value: tk.num * defaultRaffle.price,
          outputs: {
            event: "ReferralReward",
            args: [3n, params.player3.address, params.player2.address, anyValue, anyValue],
          },
        };
      },
      // afterFn: async (params: any) => {
      //   // check referral shares
      //   const events = await params.raffleContract.getEvents.ReferralReward();
      //   expect(events).to.have.lengthOf(2);

      //   const args1 = events[0].args;
      //   const args2 = events[1].args;
      //   expect(args1.referrer).to.equal(params.player2.address);
      //   expect(args2.referrer).to.equal(params.player1.address);
      // },
    },
    {
      description: "Should pass - raffleId:3 player1 - take right ref -> player1->2 --> player3",
      fn: (params: any) => {
        const tk = { ...defaultTicket };
        return {
          sender: params.player3,
          inputs: {
            ...tk,
            raffleId: 3n,
            to: params.player2.address,
          },
          value: tk.num * defaultRaffle.price,
          outputs: {
            event: "ReferralReward",
            args: [3n, params.player3.address, params.player2.address, anyValue, anyValue],
          },
        };
      },
      // afterFn: async (params: any) => {
      //   // check referral shares
      //   const events = await params.raffleContract.getEvents.ReferralReward();
      //   expect(events).to.have.lengthOf(2);

      //   const args1 = events[0].args;
      //   const args2 = events[1].args;
      //   expect(args1.referrer).to.equal(params.player2.address);
      //   expect(args2.referrer).to.equal(params.player1.address);
      // },
    },
  ] as TestCaseType[],
  failure: [
    {
      description: "Should revert - Not open - raffleId:0",
      fn: (params: any) => ({
        sender: params.player1,
        inputs: {
          ...defaultTicket,
          raffleId: BigInt(0),
        },
      }),
      revert: "Not open",
    },
    {
      description: "Should revert - Not allow seller - raffleId:1",
      fn: (params: any) => ({
        sender: params.player1,
        inputs: {
          ...defaultTicket,
        },
      }),
      revert: "Not allow seller",
    },
    {
      description: "Should revert - W num - raffleId:1",
      fn: (params: any) => ({
        sender: params.player2,
        inputs: {
          ...defaultTicket,
        },
      }),
      revert: "W num",
    },
    {
      description: "Should revert - W ref (self) - raffleId:1",
      fn: (params: any) => {
        const tk = { ...defaultTicket };
        return {
          sender: params.player2,
          inputs: {
            ...tk,
            ref: params.player2.address,
          },
          value: tk.num * defaultRaffle.price,
        };
      },
      revert: "W ref",
    },
    {
      description: "Should revert - W ref (contract) - raffleId:1",
      fn: (params: any) => {
        const tk = { ...defaultTicket };
        return {
          sender: params.player2,
          inputs: {
            ...tk,
            ref: params.raffleVRF.target,
          },
          value: tk.num * defaultRaffle.price,
        };
      },
      revert: "W ref",
    },
  ] as TestCaseType[],
};

//#endregion

describe("Raffle-buy", function () {
  let fixture: any;

  before(async () => {
    fixture = await loadFixture(deployFixture);
    // setVerifyAddress
    const { raffleContract, mockUSDT, mockNFTMoonbirds, mockNFTFrontier, owner, accounts } = fixture;
    await raffleContract
      .connect(owner)
      .setVerifyAddress([mockUSDT.target, mockNFTMoonbirds.target, mockNFTFrontier.target], true);

    // create raffles
    await createNativeRaffle(fixture); // raffleId: 1
    await createERC20Raffle(fixture); // raffleId: 2
    await createERC721Raffle(fixture); // raffleId: 3
    await createERC1155Raffle(fixture); // raffleId: 4
  });

  describe("🟥 failure", function () {
    tests.failure.forEach((test) => {
      it(test.description, async function () {
        const { raffleContract } = fixture;
        const { inputs, sender, value } = test.fn(fixture);
        try {
          if (test.beforeFn) {
            await expect(test.beforeFn(fixture)).to.be.fulfilled;
          }
          await expect(
            raffleContract.connect(sender).buy(...Object.values(inputs), {
              value: value,
            }),
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
        const { raffleContract, mockNFTMoonbirds } = fixture;
        const { inputs, sender, value, outputs } = test.fn(fixture);

        try {
          //before state
          const buyTo = inputs.to == ethers.ZeroAddress ? sender.address : inputs.to;
          const [counts, gotFree] = await raffleContract.userStates(...[inputs.raffleId, buyTo]);

          // buy
          let assert = expect(
            raffleContract.connect(sender).buy(...Object.values(inputs), {
              value: value,
            }),
          )
            .to.emit(raffleContract, "BuyTicket")
            .withArgs(inputs.raffleId, buyTo, anyValue, anyValue, anyValue, anyValue);

          if (outputs?.event) {
            assert = assert.and.to.emit(raffleContract, outputs?.event).withArgs(...outputs.args);
          }
          await assert;

          // check state
          const [counts2] = await raffleContract.userStates(...[inputs.raffleId, buyTo]);
          expect(counts2).to.equal(counts + inputs.num);

          if (test.afterFn) {
            await expect(test.afterFn(fixture)).to.be.fulfilled;
          }
        } catch (ex) {
          printError(ex, test.description);
        }
      });
    });
  });
});
