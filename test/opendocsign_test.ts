import { ethers } from "hardhat";
import { assert, expect } from "chai";
import { KYCContract } from "../typechain-types";
import { generateSignerProfile } from "../src/utils/signer_profile_utils"
import { hashTypedData } from "../src/utils/eip712utils"

describe("OpenDocSign test", () => {

    let KYC_OWNER: any
    let KYC_VALIDATOR: any
    let PROFILE_OWNER: any
    let ATTACKER: any
    let PROFILE_OWNER_2: any

    let kyc_contract: KYCContract

    let test_profile: any

    before(async () => {
        const signers = await ethers.getSigners()
        KYC_OWNER = signers[0]
        KYC_VALIDATOR = signers[1]
        PROFILE_OWNER = signers[2]
        ATTACKER = signers[3]
        PROFILE_OWNER_2 = signers[4]

        const KYCContract = await ethers.getContractFactory("KYCContract");
        kyc_contract = await KYCContract.deploy(KYC_OWNER.address);

        test_profile = {
            name: "Test User",
            address: "Test address",
            govID: "1234",
            ethereumAddress: PROFILE_OWNER.address
        }
    })

    it("Register validator", async () => {
        await kyc_contract.connect(KYC_OWNER).registerValidator(KYC_VALIDATOR.address)
        assert(await kyc_contract.isValidator(KYC_VALIDATOR.address))
    })

    it("Register validator by an attacker", async () => {
        await expect(kyc_contract.connect(ATTACKER).registerValidator(KYC_VALIDATOR.address))
            .to.be.revertedWith("Only owner can register validators!")
    })

    it("Register profile", async () => {
        const signer_profile = generateSignerProfile(await kyc_contract.getAddress(), 31337, test_profile)
        const owner_signature = await PROFILE_OWNER.signTypedData(
            signer_profile.domain,
            { "SignerProfile": signer_profile.types.SignerProfile },
            signer_profile.message
        )
        const validator_signature = await KYC_VALIDATOR.signTypedData(
            signer_profile.domain,
            { "SignerProfile": signer_profile.types.SignerProfile },
            signer_profile.message
        )
        const hash = hashTypedData(signer_profile)
        await expect(kyc_contract.connect(KYC_VALIDATOR).registerProfile(PROFILE_OWNER.address, hash, owner_signature, validator_signature))
            .to.emit(kyc_contract, "ProfileAdded")
            .withArgs(PROFILE_OWNER.address, KYC_VALIDATOR.address, hash, owner_signature, validator_signature)
    })

    it("Reregister profile", async () => {
        const signer_profile = generateSignerProfile(await kyc_contract.getAddress(), 31337, test_profile)
        const owner_signature = await PROFILE_OWNER.signTypedData(
            signer_profile.domain,
            { "SignerProfile": signer_profile.types.SignerProfile },
            signer_profile.message
        )
        const validator_signature = await KYC_VALIDATOR.signTypedData(
            signer_profile.domain,
            { "SignerProfile": signer_profile.types.SignerProfile },
            signer_profile.message
        )
        const hash = hashTypedData(signer_profile)
        await expect(kyc_contract.connect(KYC_VALIDATOR).registerProfile(PROFILE_OWNER.address, hash, owner_signature, validator_signature))
            .to.be.revertedWith("Profile already exists!")
    })

    it("Register profile by attacker", async () => {
        const signer_profile = generateSignerProfile(await kyc_contract.getAddress(), 31337, test_profile)
        const owner_signature = await PROFILE_OWNER.signTypedData(
            signer_profile.domain,
            { "SignerProfile": signer_profile.types.SignerProfile },
            signer_profile.message
        )
        const validator_signature = await KYC_VALIDATOR.signTypedData(
            signer_profile.domain,
            { "SignerProfile": signer_profile.types.SignerProfile },
            signer_profile.message
        )
        const hash = hashTypedData(signer_profile)
        await expect(kyc_contract.connect(ATTACKER).registerProfile(PROFILE_OWNER.address, hash, owner_signature, validator_signature))
            .to.be.revertedWith("Only validators can register profiles!")
    })

    it("Register profile with wrong owner signature", async () => {
        const signer_profile = generateSignerProfile(await kyc_contract.getAddress(), 31337, test_profile)
        const owner_signature = await ATTACKER.signTypedData(
            signer_profile.domain,
            { "SignerProfile": signer_profile.types.SignerProfile },
            signer_profile.message
        )
        const validator_signature = await KYC_VALIDATOR.signTypedData(
            signer_profile.domain,
            { "SignerProfile": signer_profile.types.SignerProfile },
            signer_profile.message
        )
        const hash = hashTypedData(signer_profile)
        await expect(kyc_contract.connect(KYC_VALIDATOR).registerProfile(PROFILE_OWNER_2.address, hash, owner_signature, validator_signature))
            .to.be.revertedWith("Invalid profile signature!")
    })

    it("Register profile with wrong validator signature", async () => {
        const signer_profile = generateSignerProfile(await kyc_contract.getAddress(), 31337, test_profile)
        const owner_signature = await PROFILE_OWNER_2.signTypedData(
            signer_profile.domain,
            { "SignerProfile": signer_profile.types.SignerProfile },
            signer_profile.message
        )
        const validator_signature = await ATTACKER.signTypedData(
            signer_profile.domain,
            { "SignerProfile": signer_profile.types.SignerProfile },
            signer_profile.message
        )
        const hash = hashTypedData(signer_profile)
        await expect(kyc_contract.connect(KYC_VALIDATOR).registerProfile(PROFILE_OWNER_2.address, hash, owner_signature, validator_signature))
            .to.be.revertedWith("Invalid validator signature!")
    })

})