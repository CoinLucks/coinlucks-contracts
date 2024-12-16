import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
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

//#region Test Datas

const tests = {
  success: [
    {
      description: "Should pass - raffleId:1",
      fn: (params: any) => ({
        sender: params.player1,
        inputs: {
          raffleId: 1n,
        },
      }),
    },
    {
      description: "Should pass - raffleId:2",
      fn: (params: any) => ({
        sender: params.player1,
        inputs: {
          raffleId: 2n,
        },
      }),
      beforeFn: async (params: any) => {
        // const [,,,endTime] = await params.raffleContract.raffles(...[2n]);
        // console.log(`blockTime: ${await time.latest()} endTime: ${endTime}`)
        // buy tickets
        await buy(params, { raffleId: 2n, sender: params.player2 });
        await buy(params, { raffleId: 2n, sender: params.accounts[4] });

        // increase blockTime
        await time.increase(BigInt(30 * 60));
      },
    },
    {
      description: "Should pass - raffleId:3",
      fn: (params: any) => ({
        sender: params.player1,
        inputs: {
          raffleId: 3n,
        },
      }),
    },
    {
      description: "Should pass - raffleId:4",
      fn: (params: any) => ({
        sender: params.player1,
        inputs: {
          raffleId: 4n,
        },
      }),
    },
  ],
  failure: [
    {
      description: "Should revert - Not open - raffleId:0",
      fn: (params: any) => ({
        sender: params.player1,
        inputs: {
          raffleId: BigInt(0),
        },
      }),
      revert: "Not open",
    },
    {
      description: "Should revert - Not ended - raffleId:1",
      fn: (params: any) => ({
        sender: params.player1,
        inputs: {
          raffleId: 1n,
        },
      }),
      revert: "Not ended",
    },
    {
      description: "Should revert - Only seller - raffleId:1",
      fn: (params: any) => ({
        sender: params.player2,
        inputs: {
          raffleId: 1n,
        },
      }),
      beforeFn: async (params: any) => {
        await time.increase(BigInt(30 * 60));
      },
      revert: "Only seller",
    },
  ],
};

//#endregion

describe("Raffle-close", function () {
  let fixture: any;

  before(async () => {
    fixture = await loadFixture(deployFixture);
    // setVerifyAddress
    const { raffleContract, mockUSDT, mockNFTMoonbirds, mockNFTFrontier, owner, player1 } = fixture;
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
        const { inputs, sender } = test.fn(fixture);
        try {
          if (test.beforeFn) {
            await expect(test.beforeFn(fixture)).to.be.fulfilled;
          }
          await expect(raffleContract.connect(sender).close(...Object.values(inputs))).to.be.rejectedWith(test.revert!);
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
        const { inputs, sender } = test.fn(fixture);

        try {
          if (test.beforeFn) {
            await expect(test.beforeFn(fixture)).to.be.fulfilled;
          }
          let nftOwner;
          if (inputs.raffleId == 3n) {
            nftOwner = await mockNFTMoonbirds.ownerOf(...[1]);
          }
          await expect(raffleContract.connect(sender).close(...Object.values(inputs))).to.emit(
            raffleContract,
            "RaffleClosed",
          );

          const [status] = await raffleContract.raffles(...Object.values(inputs));
          expect(status).to.not.equal(1);

          if (nftOwner) {
            const nftNewOwner = await mockNFTMoonbirds.ownerOf(...[1]);
            expect(nftNewOwner).to.not.equal(nftOwner);
            expect(nftNewOwner).to.equal(sender.address); // prize back to seller
          }
        } catch (ex) {
          printError(ex, test.description);
        }
      });
    });
  });
});
