// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import {Vm} from "forge-std/Vm.sol";
import {System} from "../src/System.sol";
import {AxonToken} from "../src/token/AxonToken.sol";
import {FixedERC20RewardModule} from "../src/rewards/FixedERC20RewardModule.sol";

library NiacinLib {
    Vm private constant vm = Vm(address(uint160(uint256(keccak256("hevm cheat code")))));

    function getTarget(string memory manifest, string memory target) internal returns (address) {
        string memory root = vm.projectRoot();
        string memory path = string.concat(root, "/deployments/", manifest, ".json");
        string memory json = vm.readFile(path);
        address instanceAddress = stdJson.readAddress(json, string.concat(".", target, ".address"));
        return instanceAddress;
    }
}

contract InitScript is 
    Script
{
    System sys;
    AxonToken token;

    function setUp() public {
        sys = System(NiacinLib.getTarget("local", "System"));
        token = AxonToken(NiacinLib.getTarget("local", "AxonToken"));
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
            
            // sys.addRemoveTorrent(
            //     poolId, 
            //     "6a9759bffd5c0af65319979fb7832189f4f3c35d",
            //     "magnet:?xt=urn:btih:6a9759bffd5c0af65319979fb7832189f4f3c35d&dn=sintel.mp4&x.pe=localhost:24333",
            //     true
            // );
            sys.addRemoveTorrent(
                poolId, 
                "9b3d43a4f63f6a4b8e399e8d869db20f38647cd3",
                hex"9b3d43a4f63f6a4b8e399e8d869db20f38647cd3", 
                "magnet:?xt=urn:btih:9b3d43a4f63f6a4b8e399e8d869db20f38647cd3&dn=imlovingit.jpeg&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce&tr=wss%3A%2F%2Ftracker.openwebtorrent.com",
                true
            );

            sys.addRemoveTorrent(
                poolId, 
                "9dc84902a2500160c7b0f79e5335a4a374880d5c", 
                hex"9dc84902a2500160c7b0f79e5335a4a374880d5c", 
                "magnet:?xt=urn:btih:9dc84902a2500160c7b0f79e5335a4a374880d5c&dn=hi-its-jessica.jpg&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&tr=wss%3A%2F%2Ftracker.btorrent.xyz", 
                true
            );

            sys.addRemoveTorrent(
                poolId, 
                "1f4c4f170cd7314c55b13f4888f263fe4aab487d", 
                hex"1f4c4f170cd7314c55b13f4888f263fe4aab487d", 
                "magnet:?xt=urn:btih:1f4c4f170cd7314c55b13f4888f263fe4aab487d&dn=you-are-balenciaga-harry.mp4&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce&tr=wss%3A%2F%2Ftracker.openwebtorrent.com&tr=wss%3A%2F%2Ftracker.btorrent.xyz", 
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
