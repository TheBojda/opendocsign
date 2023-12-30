import { TypedMessage, MessageTypes, MessageTypeProperty } from '@metamask/eth-sig-util'
import { generateTypedData } from './eip712utils'

export const signer_profile_fields = [
    {
        name: "name",
        label: "Full name",
        required: true,
        description: "Name of the signer person",
    },
    {
        name: "address",
        label: "Full address",
        required: true,
        description: "Address of the signer person",
    },
    {
        name: "govID",
        label: "Government ID",
        required: true,
        description: "A government ID is uniquely identifies the signer person",
    },
    {
        name: "ethereumAddress",
        label: "Ethereum address",
        required: true,
        description:
            "The signer profile will be assigned to this Ethereum address",
    },
    { name: "organizationName", label: "Organization name", required: false },
    {
        name: "organizationAddress",
        label: "Organization address",
        required: false,
    },
    {
        name: "organizationID",
        label: "Organization registration number",
        required: false,
    },
    {
        name: "KYCContractChainID",
        label: "Chain ID of the KYC Contract",
        required: true,
    },
    {
        name: "KYCContractAddress",
        label: "KYC Contract address",
        required: true,
    },
];

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