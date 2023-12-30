// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IKYCContract {
    function getProfileHashOf(
        address profileOwner
    ) external view returns (bytes32);
}
