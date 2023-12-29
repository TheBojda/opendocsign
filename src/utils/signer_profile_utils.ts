import { TypedMessage, MessageTypes, MessageTypeProperty } from '@metamask/eth-sig-util'
import { generateTypedData } from './eip712utils'

const signer_profile_type_definition: MessageTypeProperty[] = [
    {
        name: "name",
        type: "string"
    },
    {
        name: "address",
        type: "string"
    },
    {
        name: "govID",
        type: "string"
    },
    {
        name: "ethereumAddress",
        type: "string"
    },
    {
        name: "organizationName",
        type: "string"
    },
    {
        name: "organizationAddress",
        type: "string"
    },
    {
        name: "organizationID",
        type: "string"
    }
]

export function generateSignerProfile(verifyingContract: string, chainId: number, data: Record<string, unknown>): TypedMessage<MessageTypes> {
    const validFields = signer_profile_type_definition.map(field => field.name);
    let filteredData = {}

    for (const field of validFields) {
        if (data.hasOwnProperty(field)) {
            filteredData[field] = data[field]
        } else {
            filteredData[field] = ''
        }
    }

    return generateTypedData(verifyingContract, chainId, "SignerProfile", signer_profile_type_definition, filteredData)
}