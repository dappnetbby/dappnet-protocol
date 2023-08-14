pragma solidity ^0.8.17;

import {MixinInitializable} from "niacin-contracts/mixins/MixinInitializable.sol";
import {ERC20} from "./ERC20.sol";

contract AxonToken is 
    MixinInitializable,
    ERC20
{
    constructor() {}
    
    function initialize() 
        public 
        override 
        initializer
    {
        ERC20.initialize("Axon", "AXON", 18);

        // Account #0: 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 (10000 ETH)
        // Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
        _mint(0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266, 10000000000000000000 * (10 * 1e18));
    }
}