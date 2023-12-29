import { TypedMessage, MessageTypes, MessageTypeProperty, TypedDataUtils, SignTypedDataVersion } from '@metamask/eth-sig-util'
import { fromRpcSig, ecrecover, publicToAddress } from '@ethereumjs/util';
import { bytesToHex, hexToBytes } from '@metamask/utils'

const eip712domain_type_definition = {
    "EIP712Domain": [
        {
            "name": "chainId",
            "type": "uint256"
        },
        {
            "name": "verifyingContract",
            "type": "address"
        }
    ]
}

export function generateTypedData(verifyingContract: string, chainId: number, primaryType: string, primaryTypeDefinition: MessageTypeProperty[], message: Record<string, unknown>): TypedMessage<MessageTypes> {
    return {
        types: {
            ...eip712domain_type_definition,
            [primaryType]: primaryTypeDefinition
        },
        primaryType: primaryType,
        domain: {
            chainId: chainId,
            verifyingContract: verifyingContract
        },
        message: message
    }
}

export function hashTypedData(data: TypedMessage<MessageTypes>): string {
    return bytesToHex(TypedDataUtils.eip712Hash(data, SignTypedDataVersion.V4))
}

export function recoverSignature(hash: string, signature: string): string {
    const sigParams = fromRpcSig(signature);
    const messageHash = hexToBytes(hash);
    return bytesToHex(publicToAddress(ecrecover(messageHash, sigParams.v, sigParams.r, sigParams.s)))
}