// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract MockNFTMoonbirds is ERC721, Ownable {
    using Strings for uint256;

    uint256 private tokenIdx;

    string public baseURI = "https://live---metadata-5covpqijaa-uc.a.run.app/metadata/";

    constructor(address mintTo, uint num) ERC721("Moonbirds", "MOONBIRD") Ownable(msg.sender) {
        mint(mintTo, num);
    }

    function mint(address to, uint num) public {
        for (uint i = 0; i < num; i++) {
            safeMint(to);
        }
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require((tokenId) <= tokenIdx, "Nonexistent token");

        return string(abi.encodePacked(baseURI, tokenId.toString()));
    }

    function safeMint(address to) public {
        tokenIdx++;
        _safeMint(to, tokenIdx);
    }

    function totalSupply() public view returns (uint256) {
        return tokenIdx;
    }
}
