import hre from 'hardhat'

export const isLocal = () => {
    const network = hre.network.name;
    return network == "localhost" || network == "hardhat";
}

export const isBnbChain = ()=>{
    const network = hre.network.name.toLocaleLowerCase();
    return network.includes("bsc") || network.includes("bnb");
}