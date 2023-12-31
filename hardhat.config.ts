import { HardhatUserConfig, task } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-gas-reporter"
import { KYCContract } from "./typechain-types";

task("deploy:kyc", "Deploy KYC contract")
  .setAction(async (taskArgs, hre) => {
    const [deployer] = await hre.ethers.getSigners();
    const KYCContract = await hre.ethers.getContractFactory("KYCContract");
    const kyc_contract = await KYCContract.deploy(deployer.address);

    console.log("KYCContract owner:", deployer.address);
    console.log("KYCContract address:", await kyc_contract.getAddress());
  })

task("registerValidator", "Register validator")
  .addParam("contractAddress", "Contract address")
  .addParam("validatorAddress", "Validator address")
  .setAction(async (taskArgs, hre) => {
    const KYCContract = await hre.ethers.getContractFactory("KYCContract");
    const kyc_contract = KYCContract.attach(taskArgs.contractAddress) as KYCContract
    await kyc_contract.registerValidator(taskArgs.validatorAddress)
    if (await kyc_contract.isValidator(taskArgs.validatorAddress)) {
      console.log(`Register ${taskArgs.validatorAddress} as validator was successful!`)
    } else {
      console.error("Something bad happened! :(")
    }
  })

task("unregisterValidator", "Register validator")
  .addParam("contractAddress", "Contract address")
  .addParam("validatorAddress", "Validator address")
  .setAction(async (taskArgs, hre) => {
    const KYCContract = await hre.ethers.getContractFactory("KYCContract");
    const kyc_contract = KYCContract.attach(taskArgs.contractAddress) as KYCContract
    await kyc_contract.unregisterValidator(taskArgs.validatorAddress)
    if (await kyc_contract.isValidator(taskArgs.validatorAddress)) {
      console.error("Something bad happened! :(")
    } else {
      console.log(`Unregister ${taskArgs.validatorAddress} as validator was successful!`)
    }
  })

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 2000,
        details: {
          yul: true,
          yulDetails: {
            stackAllocation: true,
            optimizerSteps: "dhfoDgvulfnTUtnIf"
          }
        }
      }
    }
  },
  gasReporter: {
    enabled: true,
  }
};

export default config;
