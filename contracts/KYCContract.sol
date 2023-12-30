// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import "./IKYCContract.sol";

contract KYCContract is IKYCContract {
    address private _owner;
    mapping(address => bool) private _validators;
    mapping(address => bytes32) private _profileHashes;

    event ProfileAdded(
        address indexed profileOwner,
        address indexed validator,
        bytes32 hash,
        bytes profileSignature,
        bytes validatorSignature
    );
    event ProfileRemoved(
        address indexed profileOwner,
        address indexed validator
    );

    constructor(address owner) {
        _owner = owner;
    }

    function registerValidator(address validator) public {
        require(_owner == msg.sender, "Only owner can register validators!");
        _validators[validator] = true;
    }

    function unregisterValidator(address validator) public {
        require(_owner == msg.sender, "Only owner can unregister validators!");
        _validators[validator] = false;
    }

    function isValidator(address validator) external view returns (bool) {
        return _validators[validator];
    }

    function registerProfile(
        address profileOwner,
        bytes32 hash,
        bytes calldata profileSignature,
        bytes calldata validatorSignature
    ) public {
        require(
            _validators[msg.sender],
            "Only validators can register profiles!"
        );
        require(
            _profileHashes[profileOwner] == bytes32(0),
            "Profile already exists!"
        );
        require(
            SignatureChecker.isValidSignatureNow(
                profileOwner,
                hash,
                profileSignature
            ),
            "Invalid profile signature!"
        );
        require(
            SignatureChecker.isValidSignatureNow(
                msg.sender,
                hash,
                validatorSignature
            ),
            "Invalid validator signature!"
        );

        _profileHashes[profileOwner] = hash;
        emit ProfileAdded(
            profileOwner,
            msg.sender,
            hash,
            profileSignature,
            validatorSignature
        );
    }

    function removeProfile(address profileOwner) public {
        require(
            _validators[msg.sender],
            "Only validators can remove profiles!"
        );
        require(
            _profileHashes[profileOwner] != bytes32(0),
            "Profile doesn't exists!"
        );

        _profileHashes[profileOwner] = bytes32(0);
        emit ProfileRemoved(profileOwner, msg.sender);
    }

    function getProfileHashOf(
        address profileOwner
    ) external view returns (bytes32) {
        return _profileHashes[profileOwner];
    }
}
