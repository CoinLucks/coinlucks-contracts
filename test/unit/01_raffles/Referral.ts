import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { deployFixture, deployFixtureByCaller } from "./utils";

describe("Referral", function () {
  let fixture: any;

  before(async () => {
    fixture = await loadFixture(deployFixture);
  });

  describe("Deployment", function () {
    it("Should set the right operators", async function () {
      const { raffleContract, raffleVRF, referral } = fixture;
      expect(await referral.operators(raffleContract.target)).to.equal(true);
      expect(await referral.operators(raffleVRF.target)).to.equal(false);
    });
  });

  describe("🟥 BindReferrer-failure", function () {
    it("Should revert - Invalid referrer", async function () {
      const { referral, owner } = fixture;
      await expect(referral.connect(owner).setReferrer(owner.address, owner.address)).to.be.rejectedWith(
        "Invalid referrer",
      );
    });
    it("Should revert - No permission", async function () {
      // only raffle contract can call
      const { referral, owner, player1 } = fixture;
      await expect(referral.connect(player1).setReferrer(owner.address, player1.address)).to.be.rejectedWith(
        "No permission",
      );
    });
    it("Should revert - Only EOA", async function () {
      const { referral, owner } = fixture;
      await expect(referral.connect(owner).setReferrer(owner.address, referral.target)).to.be.rejectedWith("Only EOA");
    });
  });

  describe("✅ BindReferrer-success", function () {
    it("Should pass - Bind success owner -> player1", async function () {
      const { referral, owner, player1 } = fixture;
      await expect(referral.connect(owner).setReferrer(player1.address, owner.address)).to.be.fulfilled;
      const values = await referral.getReferrer(player1.address);
      expect(values[0]).to.equal(owner.address);
    });

    it("Should pass - Bind success owner -> player1 2", async function () {
      const { referral, owner, accounts } = fixture;
      await expect(referral.connect(owner).setReferrer(accounts[2].address, owner.address)).to.be.fulfilled;
      const values = await referral.getReferrer(accounts[2].address);
      expect(values[0]).to.equal(owner.address);
    });

    it("Should revert - Already Bind player1 -> owner", async function () {
      const { referral, owner, player1 } = fixture;
      const values = await referral.getReferrer(owner.address);
      await expect(referral.connect(owner).setReferrer(owner.address, player1.address)).to.be.rejectedWith(
        "Already Bind",
      );
    });

    it("Should revert - Already Bind player1 2 -> player1", async function () {
      const { referral, accounts, owner, player1 } = fixture;
      const values = await referral.getReferrer(player1.address);
      await expect(referral.connect(owner).setReferrer(accounts[2].address, player1.address)).to.be.rejectedWith(
        "Already Bind",
      );
    });
  });
});
