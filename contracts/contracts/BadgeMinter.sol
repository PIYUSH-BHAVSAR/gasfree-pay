// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * BadgeMinter - ERC-721 badge contract for GasFree Pay.
 *
 * Gas is sponsored by UGF, so minters do not need ETH for the mint action.
 */
contract BadgeMinter is ERC721, Ownable {
    uint256 private _tokenIdCounter;

    mapping(uint256 => string) public badgeType;
    mapping(address => mapping(string => bool)) public hasClaimed;

    event BadgeMinted(address indexed to, uint256 tokenId, string badgeId);

    constructor() ERC721("GasFree Badge", "GFB") Ownable(msg.sender) {}

    function mint(address to, string calldata badgeId) external returns (uint256) {
        require(!hasClaimed[to][badgeId], "Badge already claimed");

        uint256 tokenId = ++_tokenIdCounter;
        hasClaimed[to][badgeId] = true;
        badgeType[tokenId] = badgeId;

        _safeMint(to, tokenId);
        emit BadgeMinted(to, tokenId, badgeId);

        return tokenId;
    }

    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }
}
