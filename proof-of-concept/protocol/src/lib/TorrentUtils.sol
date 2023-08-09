// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

library TorrentUtils {
    function validateExactTopic(string memory exactTopic) internal pure returns (bool) {
        
        // 
        // Validate exactTopic matches a hex or base32 string.
        // This matches all modern magnet link content addressing schemes:
        // 
        // SHA-1                               xt=urn:sha1:[ SHA-1 Hash (Base32) ]
        // BitTorrent info hash (BTIH)         xt=urn:btih:[ BitTorrent Info Hash (Hex) ]
        // BitTorrent info hash v2 (BTMH)      xt=urn:btmh:[ BitTorrent Info Hash (Hex) ]
        // Direct Connect, Gnutella            xt=urn:tree:tiger:[ TTH Hash (Base32) ]
        // 
        for (uint256 i = 0; i < bytes(exactTopic).length; i++) {
            bytes1 char = bytes(exactTopic)[i];
            if (
                !(char >= bytes1("0") && char <= bytes1("9")) &&
                !(char >= bytes1("a") && char <= bytes1("f")) &&
                !(char >= bytes1("A") && char <= bytes1("F")) &&
                !(char >= bytes1("2") && char <= bytes1("7"))
            ) {
                return false;
            }
        }
        return true;
    }
}