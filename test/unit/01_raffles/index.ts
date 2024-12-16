import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { deployFixture, printFixtureInfo } from "./utils";

describe("Raffle", async function () {
  it("Raffle Info", async function () {
    const fixture = await loadFixture(deployFixture);
    printFixtureInfo(fixture);
  });
});
