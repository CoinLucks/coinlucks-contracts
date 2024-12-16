import hre, { ignition, ethers } from "hardhat";
import RaffleAllModule from "@/ignition/modules/raffles/RaffleAll";
import MocksModule from "@/ignition/modules/mocks/Mocks";
import { time } from "@nomicfoundation/hardhat-network-helpers";

import { getTimestamp } from "@/utils/testUtil";
import { randomInt } from "crypto";
import { parseEther } from "ethers";

/**
 * @tital Deploy contract fixture
 * @notice use case: await loadFixture(deployFixture);
 * loadFixture will share the same Inital-Statement of contracts for each it() test.
 * If you want to share the Full-Statement of contracts, use before() to loadFixture
 * @param signerIndex
 * @returns
 */
export async function deployFixture(signerIndex?: number) {
  // Contracts are deployed using the first signer/account by default
  const accounts = await ethers.getSigners();
  const [owner, player1, player2, player3] = accounts;
  const publicClient = await hre.ethers.provider;

  const mocks = await ignition.deploy(MocksModule, {
    defaultSender: signerIndex ? accounts[signerIndex].address : owner.address,
  });

  const deployments = await ignition.deploy(RaffleAllModule, {
    defaultSender: signerIndex ? accounts[signerIndex].address : owner.address,
  });

  // const dd = await deployments.raffleContract.tickets()
  //    const [aa]= (await deployments.raffleContract.raffles(...[1n]))
  // const events = await deployments.raffleContract.getEvents.RaffleCreated();
  const blockTime = await time.latest();
  const blockNumber = await publicClient.getBlockNumber();
  return {
    ...deployments,
    ...mocks,
    owner,
    player1,
    player2,
    player3,
    accounts,
    publicClient,
    blockTime,
    blockNumber,
  };
}

export async function deployFixtureByCaller() {
  return deployFixture(1);
}

export const emptyPrize = {
  prizeType: 0,
  token: ethers.ZeroAddress,
  amount: BigInt(0),
  tokenId: BigInt(0),
};
export const defaultRaffle = {
  hasFree: true,
  endTime: BigInt(getTimestamp(new Date().getTime() + 30 * 60 * 1000)), // 30min
  maxPerUser: BigInt(0),
  price: parseEther("0.01"),
  prize: emptyPrize,
  eligibility: [],
  note: "",
};

export const defaultTicket = {
  raffleId: 1n,
  num: BigInt(randomInt(1000)),
  ref: ethers.ZeroAddress,
  to: ethers.ZeroAddress,
  note: "",
};

export const printFixtureInfo = (fixture: any) => {
  const {
    blockTime,
    blockNumber,
    raffleContract,
    raffleVRF,
    referral,
    mockUSDT,
    mockNFTMoonbirds,
    mockNFTFrontier,
    owner,
    player1,
  } = fixture;
  console.log(`    ===============================================`);
  console.log(`    owner: ${owner.address}`);
  console.log(`    player1: ${player1.address}`);
  console.log(`    raffleContract: ${raffleContract.target}`);
  console.log(`    raffleVRF: ${raffleVRF.target}`);
  console.log(`    referral: ${referral.target}`);
  console.log(`    mockUSDT: ${mockUSDT.target}`);
  console.log(`    mockNFTMoonbirds: ${mockNFTMoonbirds.target}`);
  console.log(`    mockNFTFrontier: ${mockNFTFrontier.target}`);
  console.log(`    >>>>> blockTime: ${blockTime} > blockNumber: ${blockNumber}`);
  console.log(`    ===============================================`);
};

export const createNativeRaffle = (fixture: any) => {
  const { raffleContract, player1 } = fixture;
  return raffleContract.connect(player1).create(
    ...Object.values({
      ...defaultRaffle,
      prize: {
        ...emptyPrize,
        amount: parseEther("10"),
      },
    }),
    { value: parseEther("10") },
  );
};

export const createERC20Raffle = async (fixture: any) => {
  const { raffleContract, player1, mockUSDT } = fixture;

  await mockUSDT.connect(player1).approve(...[raffleContract.target, parseEther("1000")]);

  return raffleContract.connect(player1).create(
    ...Object.values({
      ...defaultRaffle,
      endTime: BigInt(getTimestamp(new Date().getTime() + 50 * 60 * 1000)), // 50min
      prize: {
        ...emptyPrize,
        prizeType: 1,
        token: mockUSDT.target,
        amount: parseEther("1000"),
      },
    }),
  );
};

export const createERC721Raffle = async (fixture: any) => {
  const { raffleContract, player1, mockNFTMoonbirds } = fixture;

  await mockNFTMoonbirds.connect(player1).setApprovalForAll(...[raffleContract.target, true]);

  return raffleContract.connect(player1).create(
    ...Object.values({
      ...defaultRaffle,
      prize: {
        ...emptyPrize,
        prizeType: 2,
        token: mockNFTMoonbirds.target,
        amount: 1n,
        tokenId: 1,
      },
    }),
  );
};

export const createERC1155Raffle = async (fixture: any) => {
  const { raffleContract, player1, mockNFTFrontier } = fixture;

  await mockNFTFrontier.connect(player1).setApprovalForAll(...[raffleContract.target, true]);

  return raffleContract.connect(player1).create(
    ...Object.values({
      ...defaultRaffle,
      prize: {
        ...emptyPrize,
        prizeType: 2,
        token: mockNFTFrontier.target,
        amount: 1n,
        tokenId: 1,
      },
    }),
  );
};

export const buy = async (fixture: any, params: any) => {
  const { raffleContract } = fixture;

  const num = randomInt(1000);
  await raffleContract.connect(params.sender).buy(
    ...Object.values({
      raffleId: params.raffleId,
      num: BigInt(num),
      ref: params.ref || ethers.ZeroAddress,
      to: ethers.ZeroAddress,
      note: "Hello",
    }),
    { value: defaultRaffle.price * BigInt(num) },
  );
};
