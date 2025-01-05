// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

import "./IDocSignContract.sol";

/// @title Contract for registering documents for signing
/// @author Laszlo Fazekas (https://github.com/TheBojda)
contract DocSignContract is IDocSignContract, EIP712 {
    // -- state --

    mapping(bytes32 => address[]) private _documentSigners;
    mapping(bytes32 => bool) private _documentRevokableSignatures;
    mapping(bytes32 => mapping(address => uint256)) private _documentSignatures;
    mapping(address => uint256) private _nonces;

    // -- events --

    event DocumentCreated(
        bytes32 indexed hash,
        address[] signers,
        bool revokable
    );

    event DocumentSigned(
        bytes32 indexed hash,
        address indexed signer,
        uint256 validToBlockNumber
    );

    event DocumentSignatureRevoked(
        bytes32 indexed hash,
        address indexed signer
    );

    // -- constructor --

    constructor() EIP712("DocSignContract", "1") {}

    // -- public functions --

    function createDocument(
        bytes32 hash,
        address[] calldata signers,
        bool revokableSignatures
    ) public {
        require(signers.length > 0, "At least one signer is required!");
        require(_documentSigners[hash].length == 0, "Document already exists!");

        for (uint256 i = 0; i < signers.length; i++) {
            _documentSigners[hash].push(signers[i]);
        }
        _documentRevokableSignatures[hash] = revokableSignatures;

        emit DocumentCreated(hash, signers, revokableSignatures);
    }

    function signDocument(bytes32 hash, uint256 validToBlockNumber) public {
        _signDocument(msg.sender, hash, validToBlockNumber);
    }

    function revokeDocumentSignature(bytes32 hash) public {
        _revokeDocumentSignature(msg.sender, hash);
    }

    // -- view functions --

    function isDocumentSignedBy(
        bytes32 hash,
        address signer
    ) public view returns (bool) {
        return _documentSignatures[hash][signer] != 0;
    }

    function isDocumentFullySigned(bytes32 hash) public view returns (bool) {
        for (uint256 i = 0; i < _documentSigners[hash].length; i++) {
            if (
                _documentSignatures[hash][_documentSigners[hash][i]] == 0 ||
                _documentSignatures[hash][_documentSigners[hash][i]] <
                block.number
            ) {
                return false;
            }
        }
        return true;
    }

    // -- inner functions --

    function _signDocument(
        address signer,
        bytes32 hash,
        uint256 validToBlockNumber
    ) internal {
        require(
            _documentSignatures[hash][signer] == 0,
            "Document already signed!"
        );
        _documentSignatures[hash][signer] = validToBlockNumber;
        emit DocumentSigned(hash, signer, validToBlockNumber);
    }

    function _revokeDocumentSignature(address signer, bytes32 hash) internal {
        require(
            _documentRevokableSignatures[hash],
            "Document signatures are not revokable!"
        );
        require(
            _documentSignatures[hash][signer] != 0,
            "Document not signed by the signer!"
        );
        _documentSignatures[hash][signer] = 0;
        emit DocumentSignatureRevoked(hash, signer);
    }

    // -- EIP-712 metatransaction support --

    function getNonce(address owner) public view virtual returns (uint256) {
        return _nonces[owner];
    }

    function _useNonce(
        address owner,
        uint256 nonce
    ) internal virtual returns (uint256) {
        uint256 currentNonce = _nonces[owner];
        require(currentNonce == nonce, "Invalid nonce");
        return _nonces[owner]++;
    }

    bytes32 constant SIGN_DOCUMENT_TYPEHASH =
        keccak256(
            "SignDocument(address signer,bytes32 hash,uint256 validToBlockNumber,uint256 nonce)"
        );

    bytes32 constant REVOKE_DOCUMENT_SIGNATURE_TYPEHASH =
        keccak256(
            "RevokeDocumentSignature(address signer,bytes32 hash,uint256 nonce)"
        );

    // -- EIP-712 metatransaction functions --

    function signDocumentMetaTX(
        address signer,
        bytes32 hash,
        uint256 validToBlockNumber,
        uint256 nonce,
        bytes calldata signature
    ) public {
        uint256 currentNonce = _useNonce(signer, nonce);
        (address recoveredAddress, ECDSA.RecoverError err, ) = ECDSA.tryRecover(
            _hashTypedDataV4(
                keccak256(
                    abi.encode(
                        SIGN_DOCUMENT_TYPEHASH,
                        signer,
                        hash,
                        validToBlockNumber,
                        currentNonce
                    )
                )
            ),
            signature
        );

        require(
            err == ECDSA.RecoverError.NoError && recoveredAddress == signer,
            "Signature error"
        );

        _signDocument(signer, hash, validToBlockNumber);
    }

    function revokeDocumentSignatureMetaTX(
        address signer,
        bytes32 hash,
        uint256 nonce,
        bytes calldata signature
    ) public {
        uint256 currentNonce = _useNonce(signer, nonce);
        (address recoveredAddress, ECDSA.RecoverError err, ) = ECDSA.tryRecover(
            _hashTypedDataV4(
                keccak256(
                    abi.encode(
                        REVOKE_DOCUMENT_SIGNATURE_TYPEHASH,
                        signer,
                        hash,
                        currentNonce
                    )
                )
            ),
            signature
        );

        require(
            err == ECDSA.RecoverError.NoError && recoveredAddress == signer,
            "Signature error"
        );

        _revokeDocumentSignature(signer, hash);
    }
}
