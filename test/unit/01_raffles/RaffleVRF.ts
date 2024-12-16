import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { deployFixture } from "./utils";

describe("RaffleVRF", function () {
  let fixture: any;

  before(async () => {
    fixture = await loadFixture(deployFixture);
  });

  describe("Deployment", function () {
    it("Should set the right Operator", async function () {
      const { raffleContract, raffleVRF } = fixture;
      expect(await raffleVRF.EXECUTOR()).to.equal(raffleContract.target);
    });
  });

  describe("reqRandomNumber", function () {
    it("Should revert - Only executor", async function () {
      const { raffleVRF, player1 } = fixture;
      await expect(raffleVRF.connect(player1).reqRandomNumber(1n, BigInt(10), 1)).to.be.rejectedWith("Only executor");
    });
  });
});
