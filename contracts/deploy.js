// Deploy BadgeMinter to Base Sepolia
// Run: npx hardhat run contracts/deploy.js --network base-sepolia
//
// hardhat.config.js (add to project root):
// require("@nomicfoundation/hardhat-toolbox");
// module.exports = {
//   solidity: "0.8.20",
//   networks: {
//     "base-sepolia": {
//       url: "https://sepolia.base.org",
//       accounts: [process.env.UGF_SPONSOR_PRIVATE_KEY]
//     }
//   }
// };

const { ethers } = require("hardhat");

async function main() {
  const BadgeMinter = await ethers.getContractFactory("BadgeMinter");
  const contract = await BadgeMinter.deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log("BadgeMinter deployed to:", address);
  console.log("\nAdd to frontend/.env:");
  console.log(`VITE_BADGE_CONTRACT=${address}`);
}

main().catch(e => { console.error(e); process.exit(1) });
