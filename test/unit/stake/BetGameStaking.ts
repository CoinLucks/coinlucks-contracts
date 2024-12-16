// import { expect } from "chai";
// import hre from "hardhat";
// import { getAddress, parseEther } from "viem";
// import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

// describe("BetGameStaking", function () {
//   async function deployBetGameStakingFixture() {
//     const [owner, user1, user2, user3] = await ethers.getSigners();
//     const publicClient = await hre.ethers.provider;

//     const ignition = await hre.ignition.deploy("deploy/deploy.ts");
//     const betGameStaking = ignition.result.betGameStaking;
//     const mockBetGame = ignition.result.mockBetGame;

//     return { betGameStaking, mockBetGame, owner, user1, user2, user3, publicClient };
//   }

//   async function stakeEth(client, contract, amount) {
//     await client.writeContract({
//       address: contract.address,
//       abi: contract.abi,
//       functionName: "stake",
//       value: amount,
//     });
//   }

//   describe("Staking", function () {
//     it("Should allow users to stake", async function () {
//       const { betGameStaking, user1, publicClient } = await loadFixture(deployBetGameStakingFixture);
//       await stakeEth(user1, betGameStaking, parseEther("1"));
//       const stake = await publicClient.readContract({
//         address: betGameStaking.address,
//         abi: betGameStaking.abi,
//         functionName: "stakes",
//         args: [await user1.address],
//       });
//       expect(stake[0]).to.equal(parseEther("1"));
//     });

//     it("Should update user level based on stake amount", async function () {
//       const { betGameStaking, user1, publicClient } = await loadFixture(deployBetGameStakingFixture);
//       await stakeEth(user1, betGameStaking, parseEther("10"));
//       const stake = await publicClient.readContract({
//         address: betGameStaking.address,
//         abi: betGameStaking.abi,
//         functionName: "stakes",
//         args: [await user1.address],
//       });
//       expect(stake[2]).to.equal(2n); // level
//     });

//     it("Should not allow staking when paused", async function () {
//       const { betGameStaking, owner, user1 } = await loadFixture(deployBetGameStakingFixture);
//       await owner.writeContract({
//         address: betGameStaking.address,
//         abi: betGameStaking.abi,
//         functionName: "pause",
//       });
//       await expect(stakeEth(user1, betGameStaking, parseEther("1"))).to.be.revertedWith("Pausable: paused");
//     });
//   });

//   describe("Unstaking", function () {
//     it("Should allow users to unstake after lock period", async function () {
//       const { betGameStaking, user1, publicClient } = await loadFixture(deployBetGameStakingFixture);
//       await stakeEth(user1, betGameStaking, parseEther("1"));
//       await time.increase(7 * 24 * 60 * 60 + 1); // 7 days + 1 second
//       await user1.writeContract({
//         address: betGameStaking.address,
//         abi: betGameStaking.abi,
//         functionName: "unstake",
//       });
//       const stake = await publicClient.readContract({
//         address: betGameStaking.address,
//         abi: betGameStaking.abi,
//         functionName: "stakes",
//         args: [await user1.address],
//       });
//       expect(stake[0]).to.equal(0n);
//     });

//     it("Should apply early unstake fee", async function () {
//       const { betGameStaking, user1, publicClient } = await loadFixture(deployBetGameStakingFixture);
//       await stakeEth(user1, betGameStaking, parseEther("1"));
//       const balanceBefore = await publicClient.getBalance({ address: await user1.address });
//       await user1.writeContract({
//         address: betGameStaking.address,
//         abi: betGameStaking.abi,
//         functionName: "unstake",
//       });
//       const balanceAfter = await publicClient.getBalance({ address: await user1.address });
//       expect(balanceAfter).to.be.lessThan(balanceBefore + parseEther("1"));
//     });
//   });

//   describe("Rewards", function () {
//     it("Should distribute rewards correctly", async function () {
//       const { betGameStaking, owner, user1, user2, publicClient } = await loadFixture(deployBetGameStakingFixture);
//       await stakeEth(user1, betGameStaking, parseEther("1"));
//       await stakeEth(user2, betGameStaking, parseEther("10"));
//       await owner.writeContract({
//         address: betGameStaking.address,
//         abi: betGameStaking.abi,
//         functionName: "addRewards",
//         value: parseEther("1"),
//       });
//       const user1Reward = await publicClient.readContract({
//         address: betGameStaking.address,
//         abi: betGameStaking.abi,
//         functionName: "calculateRewards",
//         args: [await user1.address],
//       });
//       const user2Reward = await publicClient.readContract({
//         address: betGameStaking.address,
//         abi: betGameStaking.abi,
//         functionName: "calculateRewards",
//         args: [await user2.address],
//       });
//       expect(user2Reward).to.be.greaterThan(user1Reward);
//     });

//     // 添加更多奖励相关的测试...
//   });

//   describe("Admin functions", function () {
//     it("Should allow owner to set levels", async function () {
//       const { betGameStaking, owner, publicClient } = await loadFixture(deployBetGameStakingFixture);
//       await owner.writeContract({
//         address: betGameStaking.address,
//         abi: betGameStaking.abi,
//         functionName: "setLevels",
//         args: [[5], [parseEther("100")], [200]],
//       });
//       const level = await publicClient.readContract({
//         address: betGameStaking.address,
//         abi: betGameStaking.abi,
//         functionName: "levels",
//         args: [5],
//       });
//       expect(level[0]).to.equal(parseEther("100")); // threshold
//       expect(level[1]).to.equal(200n); // rewardMultiplier
//     });

//     // 添加更多管理员功能的测试...
//   });

//   // 可以继续添加更多测试用例...
// });
