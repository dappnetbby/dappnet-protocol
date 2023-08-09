// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import {System} from "../src/System.sol";
import {AxonToken} from "../src/token/AxonToken.sol";
import {FixedERC20RewardModule} from "../src/rewards/FixedERC20RewardModule.sol";

contract InitScript is Script {
    System sys;
    AxonToken token;

    function getTarget(string memory manifest, string memory target) internal returns (address) {
        string memory root = vm.projectRoot();
        string memory path = string.concat(root, "/deployments/", manifest, ".json");
        string memory json = vm.readFile(path);
        address instanceAddress = stdJson.readAddress(json, string.concat(".", target, ".address"));
        return instanceAddress;
    }

    function setUp() public {
        sys = System(getTarget("local", "System"));
        token = AxonToken(getTarget("local", "AxonToken"));
    }

    function run() public {
        vm.startBroadcast(vm.envUint("PRIVATE_KEY"));
        // sys.configure(msg.sender);
        
        uint256 migrateFrom = 0;
        if(migrateFrom < 1) {
            // Setup token.
            // token = new DappnetToken();

            // Setup rewards module.
            FixedERC20RewardModule rewardModule = new FixedERC20RewardModule();
            rewardModule.initialize(msg.sender, address(token));
            
            /// @dev Transfer $AXON tokens to reward module.
            // This assumes the PRIVATE_KEY corresponds to the account 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266.
            token.transfer(address(rewardModule), 10000 * 1e18);
            
            // Setup pool.
            uint256 poolId = sys.createPool(
                "sintel", 
                "SINTEL", 
                "sharing on-chain intelligence to the globe", 
                rewardModule
            );
            
            sys.addRemoveTorrent(
                poolId, 
                "6a9759bffd5c0af65319979fb7832189f4f3c35d",
                "magnet:?xt=urn:btih:6a9759bffd5c0af65319979fb7832189f4f3c35d&dn=sintel.mp4&x.pe=localhost:24333",
                true
            );
        }

        if(migrateFrom < 2) {
            // Seed peers with ether for the local Forge testnet.
            // peer: seed.js
            (0x8c2183507a5908715322Ed0e1FC7a0D2e09816f4).call{value: 1 ether}("");
            (0x51f183d27560b3adE0AA43Fee3b4464Db2cE8104).call{value: 1 ether}("");
        }

    }
}
