// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * BadgeMinter — ERC-721 badge contract for GasFree Pay
 *
 * Deploy to Base Sepolia:
 *   npx hardhat run scripts/deploy.js --network base-sepolia
 *
 * After deploy, set VITE_BADGE_CONTRACT=<address> in frontend/.env
 *
 * Gas is sponsored by UGF — minters never need ETH.
 */
contract BadgeMinter is ERC721, Ownable {
    uint256 private _tokenIdCounter;

    // tokenId => badgeId (e.g. "pioneer", "builder")
    mapping(uint256 => string) public badgeType;

    // address => badgeId => claimed
    mapping(address => mapping(string => bool)) public hasClaimed;

    event BadgeMinted(address indexed to, uint256 tokenId, string badgeId);

    constructor() ERC721("GasFree Badge", "GFB") Ownable(msg.sender) {}

    /**
     * Mint a badge. Called via UGF sponsorAndExecute — no ETH needed by caller.
     * One badge type per address.
     */
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
