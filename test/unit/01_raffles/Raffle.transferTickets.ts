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
  buy,
} from "./utils";
import { TestCaseType } from "@/test/types";

//#region Test Datas

const tests = {
  success: [
    {
      description: "Should pass - raffleId:1",
      fn: (params: any) => {
        return {
          sender: params.player2,
          inputs: {
            raffleId: 1n,
            to: params.player3.address,
            ids: [1n, 2n],
          },
        };
      },
    },
    // {
    //     description: "Should pass - raffleId:1",
    //     fn: (params: any) => {
    //         return {
    //             sender: params.player2,
    //             inputs: {
    //                 raffleId: 1n,
    //                 to: params.player3.address,
    //                 ids: [2n]
    //             },
    //         }
    //     },
    // },
  ] as TestCaseType[],
  failure: [
    {
      description: "Should revert - Not open - raffleId:0",
      fn: (params: any) => ({
        sender: params.player1,
        inputs: {
          raffleId: BigInt(0),
          to: ethers.ZeroAddress,
          ids: [],
        },
      }),
      revert: "Not open",
    },
    {
      description: "Should revert - W to - raffleId:1",
      fn: (params: any) => ({
        sender: params.player1,
        inputs: {
          raffleId: 1n,
          to: ethers.ZeroAddress,
          ids: [],
        },
      }),
      revert: "W to",
    },
    {
      description: "Should revert - Not your tk- raffleId:1",
      fn: (params: any) => ({
        sender: params.player1,
        inputs: {
          raffleId: 1n,
          to: params.player2.address,
          ids: [1n, 2n],
        },
      }),
      revert: "Not your tk",
    },
    // {
    //     description: "Should revert - W id- raffleId:1",
    //     fn: (params: any) => ({
    //         sender: params.player2,
    //         inputs: {
    //             raffleId: 1n,
    //             to:  params.player1.address,
    //             ids: [3n, 4n, BigInt(10)]
    //         }
    //     }),
    //     revert: "W id"
    // },
  ] as TestCaseType[],
};

//#endregion

describe("Raffle-transferTickets", function () {
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
    await buy(fixture, { raffleId: 1n, sender: player2 });
    await buy(fixture, { raffleId: 2n, sender: accounts[3] });
    await buy(fixture, { raffleId: 2n, sender: accounts[3] });

    await buy(fixture, { raffleId: 3n, sender: accounts[4] });
    await buy(fixture, { raffleId: 3n, sender: accounts[4] });
    await buy(fixture, { raffleId: 4n, sender: accounts[5] });
    await buy(fixture, { raffleId: 4n, sender: accounts[5] });
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
          await expect(raffleContract.connect(sender).transferTickets(...Object.values(inputs))).to.be.rejectedWith(
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
        const { raffleContract } = fixture;
        const { inputs, sender } = test.fn(fixture);

        try {
          //before state

          const [senderCount1] = await raffleContract.userStates(...[inputs.raffleId, sender.address]);
          const [toCount1] = await raffleContract.userStates(...[inputs.raffleId, inputs.to]);

          // const [user, id, fullCounts] = await raffleContract.tickets(...[inputs.raffleId, inputs.ids[0]]);

          // transfer
          await expect(raffleContract.connect(sender).transferTickets(...Object.values(inputs))).to.emit(
            raffleContract,
            "TransferTickets",
          );

          // check state

          let sumNum = BigInt(0);
          for (let i = 0; i < inputs.ids.length; i++) {
            const ticketId = inputs.ids[i];
            const [user2, , , fullCounts1] = await raffleContract.tickets(...[inputs.raffleId, ticketId - 1n]);
            expect(user2).to.equal(inputs.to);

            let num = fullCounts1;
            if (ticketId > 1n) {
              const [, , , fullCounts0] = await raffleContract.tickets(...[inputs.raffleId, ticketId - 2n]);
              num = fullCounts1 - fullCounts0;
            }
            sumNum += num;
          }

          const [senderCount2] = await raffleContract.userStates(...[inputs.raffleId, sender.address]);
          const [toCount2] = await raffleContract.userStates(...[inputs.raffleId, inputs.to]);
          expect(senderCount1 - senderCount2).to.equal(toCount2 - toCount1);
          expect(senderCount1 - senderCount2).to.equal(sumNum);

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
