import { ethers } from "hardhat";

async function main() {
  const EasyBet = await ethers.getContractFactory("EasyBet");
  const easyBet = await EasyBet.deploy();
  await easyBet.deployed();

  console.log(`EasyBet deployed to ${easyBet.address}`);

  const Points = await easyBet.points();
  console.log(`Points deployed to ${Points}`);

  const Tickets = await easyBet.ticket();
  console.log(`Tickets deployed to ${Tickets}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});