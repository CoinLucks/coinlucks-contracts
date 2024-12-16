import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { deployFixture, printFixtureInfo } from "./utils";

describe("Scratch69", async function () {
  it("Deployment", async function () {
    const fixture = await loadFixture(deployFixture);
    printFixtureInfo(fixture);
  });
});
