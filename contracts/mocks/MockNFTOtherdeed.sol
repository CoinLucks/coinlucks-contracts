// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract MockNFTOtherdeed is ERC721, Ownable {
    using Strings for uint256;
    uint256 private _tokenIdCounter;
    mapping(address => uint256) public userMinted;
    string public baseURI = "https://api.otherside.xyz/lands/";

    constructor(address mintTo, uint num) ERC721("Otherdeed", "OTHR") Ownable(msg.sender) {
        mint(mintTo, num);
    }

    function mint(address to, uint num) public {
        require(userMinted[to] + num <= 10, "mint limit");
        userMinted[to] += num;
        for (uint i = 0; i < num; i++) {
            safeMint(to);
        }
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(tokenId > 0 && tokenId <= _tokenIdCounter, "Nonexistent token");

        return string(abi.encodePacked(baseURI, tokenId.toString()));
    }

    function safeMint(address to) public {
        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;
        _safeMint(to, tokenId);
    }

    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter;
    }
}
