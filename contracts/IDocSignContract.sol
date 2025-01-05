// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title Contract interface for registering documents for signing
/// @author Laszlo Fazekas (https://github.com/TheBojda)
interface IDocSignContract {
    function createDocument(
        bytes32 hash,
        address[] calldata signers,
        bool revokableSignatures
    ) external;

    function signDocument(bytes32 hash, uint256 validToBlockNumber) external;

    function revokeDocumentSignature(bytes32 hash) external;

    function isDocumentSignedBy(
        bytes32 hash,
        address signer
    ) external view returns (bool);

    function isDocumentFullySigned(bytes32 hash) external view returns (bool);
}
