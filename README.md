# OpenDocSign - Sign Any Document on the Ethereum Blockchain

OpenDocSign is a simple document signing service based on a [smart contract](contracts/DocSignContract.sol).

## Smart Contract Methods

### createDocument(bytes32 hash, address[] calldata signers, bool revokableSignatures)

Registers the document by its hash. The hash can be any keccak256 hash, such as a hash of a PDF document, a JSON file, a full tar file, or a Sparse Merkle Tree that contains the document in key/value format and is on-chain provable.

Parameters:
- **hash** - The hash of the document.
- **signers** - List of the document signer addresses (EOAs or smart contracts).
- **revokableSignatures** - True if signatures are revokable.

### signDocument(bytes32 hash, uint256 validTo)

Signers can sign the document using this method. The document is identified by its hash. This method must be called by the signer.

Parameters:
- **hash** - The hash of the document.
- **validTo** - The signature is valid only until this timestamp. If the signature should always be valid, use MAX_UINT256 (2^256-1).

### revokeDocumentSignature(bytes32 hash)

Revokes the signature. Can be called only if the document is registered with revokableSignatures.

Parameters:
- **hash** - The hash of the document.

### isDocumentSignedBy(bytes32 hash, address signer) returns (bool)

Checks if the document is signed by a given address.

Parameters:
- **hash** - The hash of the document.
- **signer** - Address of the signer.

### isDocumentFullySigned(bytes32 hash) returns (bool)

Checks if the document is fully signed by all of the registered signers.

Parameters:
- **hash** - The hash of the document.

### signDocumentMetaTX(address signer, bytes32 hash, uint256 validTo, uint256 nonce, bytes calldata signature)

Signs the document using a meta-transaction. This method allows a third party to submit the signature on behalf of the signer.

Parameters:
- **signer** - Address of the signer.
- **hash** - The hash of the document.
- **validTo** - The signature is valid only until this timestamp. If the signature should always be valid, use MAX_UINT256 (2^256-1).
- **nonce** - A unique value to prevent replay attacks.
- **signature** - The signature of the signer.

### revokeDocumentSignatureMetaTX(address signer, bytes32 hash, uint256 nonce, bytes calldata signature)

Revokes the signature using a meta-transaction. This method allows a third party to submit the revocation on behalf of the signer.

Parameters:
- **signer** - Address of the signer.
- **hash** - The hash of the document.
- **nonce** - A unique value to prevent replay attacks.
- **signature** - The signature of the signer.



