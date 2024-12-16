import { expect } from "chai";
import { ethers } from "hardhat";

export const getTimestamp = function (timestampms: any) {
  timestampms = timestampms || Date.now();
  return Math.floor(timestampms / 1000);
};

export const printError = (error?: any, title?: string) => {
  const regex = /Details:\s+(.*)/;
  const match = regex.exec(error.actual);

  if (match) {
    const detailsContent = match[1];
    console.error("\x1b[31m%s\x1b[0m", `       ❌ ${title && title + " > "} Details error: ${detailsContent}`); //red color
  } else {
    console.error(error);
  }
};

export const tryRevert = async (tx: any, revert: any) => {
  let error;
  try {
    await expect(tx).to.be.rejectedWith(revert);
    return true;
  } catch (ex) {
    error = ex;
  }
  printError(error);
  return false;
};

export const tryCall = async (tx: any, wait = 0) => {
  let error;
  try {
    if (wait == 0) {
      await tx;
    } else {
      await (await tx).wait(wait);
    }

    return true;
  } catch (ex) {
    error = ex;
  }
  printError(error);
  return false;
};

export const getBalances = async (addrs: any[]) => {
  const balances: any[] = [];
  for (let i = 0; i < addrs?.length; i++) {
    if (addrs[i] != ethers.ZeroAddress) balances.push(await ethers.provider.getBalance(addrs[i]));
  }
  return balances;
};

module.exports = this;
