// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const { ethers } = require('hardhat');
const hre = require("hardhat");

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

async function main() {
  // get different dummy accounts;
  let buyer,seller,inspector,lender;
  [buyer,seller,inspector,lender]=await ethers.getSigners();
  // deploy smart contracts
  const RealEstate=await ethers.getContractFactory('RealEstate');
  const realEstate=await RealEstate.deploy();
  await realEstate.deployed();

  console.log(`Deployed real estate contract at: ${realEstate.address}`);
  console.log("Minting 3 properties.....");
  
  for(let i=0;i<3;i++){                                                      //QmQVcpsjrA6cr1iJjZAodYwmPekYgbnXGo4DFubJiLc2EB/1.json
    let transaction=await realEstate.connect(seller).mint(`https://ipfs.io/ipfs/QmQVcpsjrA6cr1iJjZAodYwmPekYgbnXGo4DFubJiLc2EB/${i+1}.json`);
    console.log("here is a mint transaction!!",transaction);
    await transaction.wait();
  }
  // deployed escrow
  const Escrow=await ethers.getContractFactory('Escrow');

  const escrow=await Escrow.deploy(
      realEstate.address,
      inspector.address,
      lender.address,
      seller.address
  );

  await escrow.deployed();
  console.log(`Deployed escrow contract at: ${escrow.address}`)
  for(let i=0;i<3;i++){
    let transaction=await realEstate.connect(seller).approve(escrow.address,i+1);
    await transaction.wait();
  }

  let transaction=await escrow.connect(seller).list(1,buyer.address,tokens(20),tokens(10));
  await transaction.wait();
  transaction=await escrow.connect(seller).list(2,buyer.address,tokens(15),tokens(10));
  await transaction.wait();
  transaction=await escrow.connect(seller).list(3,buyer.address,tokens(12),tokens(10));
  await transaction.wait();
  
  console.log("Finished");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
