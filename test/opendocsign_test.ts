import { ethers } from "hardhat";
import { assert } from "chai";
import { BigNumber } from '@ethersproject/bignumber'
import { DocSignContract } from "../typechain-types";

describe("OpenDocSign test", () => {

    const MAX_UINT256 = BigNumber.from(2).pow(256).sub(1).toBigInt();

    let DOCUMENT_SIGNER_1: any
    let DOCUMENT_SIGNER_2: any
    let DOCUMENT_SIGNER_3: any
    let DOCUMENT_SIGNER_4: any
    let DOCUMENT_MANAGER_SERVICE: any

    let contract: DocSignContract
    let documentHash: string
    let domain: any

    function extractLog(receipt: any, eventName: string) {
        const iface = new ethers.Interface(contract.interface.fragments);

        const parsedLogs = receipt.logs.map((log) => {
            try {
                return iface.parseLog(log as any);
            } catch (err) {
                return null;
            }
        }).filter(log => log !== null);

        return parsedLogs.find(log => log.name === eventName);
    }

    async function signDocument(signer: any) {
        const tx = await contract.connect(signer).signDocument(documentHash, MAX_UINT256);

        const receipt = await tx.wait();
        assert(receipt);

        const documentSignedLog = extractLog(receipt, "DocumentSigned");
        assert(documentSignedLog);
        assert(documentSignedLog.args[0] === documentHash);
        assert(documentSignedLog.args[1] === signer.address);
        assert(documentSignedLog.args[2] === MAX_UINT256);
    }

    before(async () => {
        const signers = await ethers.getSigners()
        DOCUMENT_SIGNER_1 = signers[0]
        DOCUMENT_SIGNER_2 = signers[1]
        DOCUMENT_SIGNER_3 = signers[2]
        DOCUMENT_SIGNER_4 = signers[3]
        DOCUMENT_MANAGER_SERVICE = signers[4]

        const DocSignContract = await ethers.getContractFactory("DocSignContract");
        contract = await DocSignContract.deploy();

        const document = "Hello World!";
        documentHash = ethers.keccak256(ethers.toUtf8Bytes(document));

        domain = {
            name: "DocSignContract",
            version: "1",
            chainId: 31337,
            verifyingContract: await contract.getAddress(),
        }
    })

    it("Create document", async () => {
        const tx = await contract.connect(DOCUMENT_SIGNER_1).createDocument(
            documentHash,
            [DOCUMENT_SIGNER_1.address, DOCUMENT_SIGNER_2.address, DOCUMENT_SIGNER_3.address, DOCUMENT_SIGNER_4.address],
            true
        )

        const receipt = await tx.wait();
        assert(receipt);

        const documentCreatedLog = extractLog(receipt, "DocumentCreated");
        assert(documentCreatedLog);
        assert(documentCreatedLog.args[0] === documentHash);
        assert(documentCreatedLog.args[1][0] === DOCUMENT_SIGNER_1.address);
        assert(documentCreatedLog.args[1][1] === DOCUMENT_SIGNER_2.address);
        assert(documentCreatedLog.args[1][2] === DOCUMENT_SIGNER_3.address);
        assert(documentCreatedLog.args[1][3] === DOCUMENT_SIGNER_4.address);
        assert(documentCreatedLog.args[2] === true);
    })

    it("Sign document by SIGNER 1 and SIGNER 2", async () => {
        await signDocument(DOCUMENT_SIGNER_1);
        await signDocument(DOCUMENT_SIGNER_2);
    })

    it("Document should not be fully signed", async () => {
        const isSigned = await contract.isDocumentFullySigned(documentHash);
        assert(!isSigned);
    })

    it("Sign document by SIGNER 3 and SIGNER 4", async () => {
        await signDocument(DOCUMENT_SIGNER_3);
        await signDocument(DOCUMENT_SIGNER_4);
    })

    it("Document should be fully signed", async () => {
        const isSigned = await contract.isDocumentFullySigned(documentHash);
        assert(isSigned);
    })

    it("Revoke document signature by SIGNER 1", async () => {
        const tx = await contract.connect(DOCUMENT_SIGNER_1).revokeDocumentSignature(documentHash);

        const receipt = await tx.wait();
        assert(receipt);

        const documentSignatureRevokedLog = extractLog(receipt, "DocumentSignatureRevoked");
        assert(documentSignatureRevokedLog);
        assert(documentSignatureRevokedLog.args[0] === documentHash);
        assert(documentSignatureRevokedLog.args[1] === DOCUMENT_SIGNER_1.address);
    })

    it("Document should not be fully signed", async () => {
        const isSigned = await contract.isDocumentFullySigned(documentHash);
        assert(!isSigned);
    })

    it("Sign document by EIP-712 signature", async () => {
        const nonce = await contract.getNonce(DOCUMENT_SIGNER_1.address);
        const types = {
            "SignDocument": [
                { name: "signer", type: "address" },
                { name: "hash", type: "bytes32" },
                { name: "validToBlockNumber", type: "uint256" },
                { name: "nonce", type: "uint256" },
            ]
        }
        const message = {
            signer: DOCUMENT_SIGNER_1.address,
            hash: documentHash,
            validToBlockNumber: MAX_UINT256,
            nonce: nonce,
        };

        const signature = await DOCUMENT_SIGNER_1.signTypedData(domain, types, message);
        const tx = await contract.connect(DOCUMENT_MANAGER_SERVICE).signDocumentMetaTX(DOCUMENT_SIGNER_1.address, documentHash, MAX_UINT256, nonce, signature);

        const receipt = await tx.wait();
        assert(receipt);

        const documentSignedLog = extractLog(receipt, "DocumentSigned");
        assert(documentSignedLog);
        assert(documentSignedLog.args[0] === documentHash);
        assert(documentSignedLog.args[1] === DOCUMENT_SIGNER_1.address);
        assert(documentSignedLog.args[2] === MAX_UINT256);
    })

    it("Document should be fully signed", async () => {
        const isSigned = await contract.isDocumentFullySigned(documentHash);
        assert(isSigned);
    })

    it("Revoke document signature by EIP-712 signature", async () => {
        const nonce = await contract.getNonce(DOCUMENT_SIGNER_1.address);
        const types = {
            "RevokeDocumentSignature": [
                { name: "signer", type: "address" },
                { name: "hash", type: "bytes32" },
                { name: "nonce", type: "uint256" },
            ]
        }
        const message = {
            signer: DOCUMENT_SIGNER_1.address,
            hash: documentHash,
            nonce: nonce,
        };

        const signature = await DOCUMENT_SIGNER_1.signTypedData(domain, types, message);
        const tx = await contract.connect(DOCUMENT_MANAGER_SERVICE).revokeDocumentSignatureMetaTX(DOCUMENT_SIGNER_1.address, documentHash, nonce, signature);

        const receipt = await tx.wait();
        assert(receipt);

        const documentSignatureRevokedLog = extractLog(receipt, "DocumentSignatureRevoked");
        assert(documentSignatureRevokedLog);
        assert(documentSignatureRevokedLog.args[0] === documentHash);
        assert(documentSignatureRevokedLog.args[1] === DOCUMENT_SIGNER_1.address);
    })

    it("Document should not be fully signed", async () => {
        const isSigned = await contract.isDocumentFullySigned(documentHash);
        assert(!isSigned);
    })

})