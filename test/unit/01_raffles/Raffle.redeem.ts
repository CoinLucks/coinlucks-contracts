import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { printError } from "@/utils/testUtil";
import {
  deployFixture,
  buy,
  createERC1155Raffle,
  createERC20Raffle,
  createERC721Raffle,
  createNativeRaffle,
  defaultRaffle,
  emptyPrize,
  printFixtureInfo,
} from "./utils";
import { randomInt } from "crypto";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";

//#region Test Datas

const tests = {
  success: [
    {
      description: "Should pass - raffleId:1",
      fn: (params: any) => ({
        sender: params.player2,
        inputs: {
          raffleId: 1n,
        },
      }),
    },
    {
      description: "Should pass - raffleId:2",
      fn: (params: any) => ({
        sender: params.player2,
        inputs: {
          raffleId: 2n,
        },
      }),
      beforeFn: async (params: any) => {
        // close raffle
        await params.raffleContract.connect(params.player2).close(...[2n]);
        // // vrf callbackRandomWords
        // await params.raffleVRF
        //   .connect(params.owner)
        //   .callbackRandomWords(...[2n, BigInt(randomInt(1000)), 1]);
      },
    },
    {
      description: "Should pass - raffleId:3",
      fn: (params: any) => ({
        sender: params.owner,
        inputs: {
          raffleId: 3n,
        },
      }),
      beforeFn: async (params: any) => {
        // close raffle
        await params.raffleContract.connect(params.owner).close(...[3n]);
        // vrf callbackRandomWords
        // await params.raffleVRF
        //   .connect(params.owner)
        //   .callbackRandomWords(...[3n, BigInt(randomInt(1000)), 1]);
      },
    },
  ],
  failure: [
    {
      description: "Should revert - Not close - raffleId:0",
      fn: (params: any) => ({
        sender: params.player1,
        inputs: {
          raffleId: BigInt(0),
        },
      }),
      revert: "Not close",
    },
    {
      description: "Should revert - Not close - raffleId:1",
      fn: (params: any) => ({
        sender: params.player1,
        inputs: {
          raffleId: 1n,
        },
      }),
      revert: "Not close",
    },
    {
      description: "Should revert - Not close (cancel) - raffleId:4",
      fn: (params: any) => ({
        sender: params.player2,
        inputs: {
          raffleId: 4n,
        },
      }),
      beforeFn: (params: any) => {
        // close raffle (cancel cuz not tickets)
        return params.raffleContract.connect(params.player1).close(...[4n]);
      },
      revert: "Not close",
    },
    {
      description: "Should revert - Invalid draw numbers (not draw) - raffleId:1",
      fn: (params: any) => ({
        sender: params.player2,
        inputs: {
          raffleId: 1n,
        },
      }),
      beforeFn: (params: any) => {
        // close raffle
        return params.raffleContract.connect(params.player1).close(...[1n]);
      },
      revert: "Invalid draw numbers",
    },
  ],
};

//#endregion

describe("Raffle-redeem", function () {
  let fixture: any;

  before(async () => {
    fixture = await loadFixture(deployFixture);
    // setVerifyAddress
    const { raffleContract, mockUSDT, mockNFTMoonbirds, mockNFTFrontier, owner, player2, accounts } = fixture;
    await raffleContract
      .connect(owner)
      .setVerifyAddress([mockUSDT.target, mockNFTMoonbirds.target, mockNFTFrontier.target], true);

    // create raffles
    await createNativeRaffle(fixture); // raffleId: 1
    await createERC20Raffle(fixture); // raffleId: 2
    await createERC721Raffle(fixture); // raffleId: 3
    await createERC1155Raffle(fixture); // raffleId: 4

    // buy tickets
    await buy(fixture, { raffleId: 1n, sender: player2 });
    await buy(fixture, { raffleId: 2n, sender: player2 });
    await buy(fixture, { raffleId: 3n, sender: player2 });
    //await buy(fixture, { raffleId: 4n, sender: player2 });

    await buy(fixture, { raffleId: 1n, sender: accounts[3] });
    await buy(fixture, { raffleId: 2n, sender: accounts[3] });
    await buy(fixture, { raffleId: 3n, sender: accounts[3] });
    //await buy(fixture, { raffleId: 4n, sender: accounts[3] });

    // increate blockTime for close raffle
    await time.increase(60 * 60);
  });

  describe("🟥 failure", function () {
    tests.failure.forEach((test) => {
      it(test.description, async function () {
        const { raffleContract } = fixture;
        const { inputs, sender } = test.fn(fixture);
        try {
          if (test.beforeFn) {
            await expect(test.beforeFn(fixture)).to.be.fulfilled;
          }
          await expect(raffleContract.connect(sender).redeem(...Object.values(inputs))).to.be.rejectedWith(
            test.revert!,
          );
        } catch (ex) {
          printError(ex, test.description);
        }
      });
    });
  });

  describe("✅ success", function () {
    tests.success.forEach((test) => {
      it(test.description, async function () {
        const { raffleContract, raffleVRF, owner, mockNFTMoonbirds } = fixture;
        const { inputs, sender } = test.fn(fixture);

        try {
          if (test.beforeFn) {
            await expect(test.beforeFn(fixture)).to.be.fulfilled;
          }
          let nftOwner;
          if (inputs.raffleId == 3n) {
            nftOwner = await mockNFTMoonbirds.ownerOf(...[1]);
          }
          await expect(
            raffleVRF.connect(owner).callbackRandomWords(...[inputs.raffleId, BigInt(randomInt(1000)), 1]),
            // raffleContract.connect(sender).redeem(...Object.values(inputs)),
          )
            .to.emit(raffleContract, "RaffleEnded")
            .withArgs(inputs.raffleId, anyValue, anyValue, anyValue, anyValue, anyValue);

          const [status] = await raffleContract.raffles(...Object.values(inputs));
          expect(status).to.not.equal(1);

          if (nftOwner) {
            const nftNewOwner = await mockNFTMoonbirds.ownerOf(...[1]);
            expect(nftNewOwner).to.not.equal(nftOwner);
            expect(nftNewOwner).to.not.equal(sender.address); // prize back to seller
          }
        } catch (ex) {
          printError(ex, test.description);
        }
      });
    });
  });
});
