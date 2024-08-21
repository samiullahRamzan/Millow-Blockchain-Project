//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract RealEstate is ERC721URIStorage {
    uint256 private _tokenIds;

    constructor() ERC721("Real State", "Real") {}

    function mint(string memory tokenURI) public returns (uint256) {
        uint256 newItemId = ++_tokenIds;
        _mint(msg.sender, newItemId);
        _setTokenURI(newItemId, tokenURI);

        return newItemId;
    }

    function totalSupply() public view returns (uint256) {
        return _tokenIds; // how many token is minted so far
    }
}
