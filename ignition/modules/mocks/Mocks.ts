import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { parseEther } from "ethers";

const MocksModule = buildModule("MocksModule", (m) => {
  // Mocks USDT
  const mockUSDT = m.contract("MockUSDT");
  for (let i = 0; i < 2; i++) {
    m.call(mockUSDT, "mint", [m.getAccount(i), parseEther("10000")], {
      after: [mockUSDT],
      id: `mockUSDT_mint_${i}`,
    });
  }

  // MockNFTMoonbirds contract
  const mockNFTMoonbirds = m.contract("MockNFTMoonbirds", [
    m.getAccount(1),
    10,
  ]);

  // MockNFTFrontier contract
  const mockNFTFrontier = m.contract("MockNFTFrontier", [
    m.getAccount(1),
    1,
    10,
  ]);

  // MockNFTBoredApeYachtClub contract
  const mockNFTBoredApeYachtClub = m.contract("MockNFTBoredApeYachtClub", [
    m.getAccount(1),
    10,
  ]);

  // MockNFTAzuki contract
  const mockNFTAzuki = m.contract("MockNFTAzuki", [m.getAccount(1), 10]);

  // MockNFTOtherdeed contract
  const mockNFTOtherdeed = m.contract("MockNFTOtherdeed", [
    m.getAccount(1),
    10,
  ]);

  return {
    mockUSDT,
    mockNFTMoonbirds, // 721
    mockNFTFrontier, // 1155
    mockNFTBoredApeYachtClub,
    mockNFTAzuki,
    mockNFTOtherdeed,
  };
});

export default MocksModule;
