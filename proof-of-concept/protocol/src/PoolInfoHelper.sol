import {MixinResolver} from "niacin-contracts/mixins/MixinResolver.sol";
import {System, Pool} from "./System.sol";

contract PoolInfoHelper is 
    MixinResolver
{
    function getDependencies() public override pure returns (bytes32[] memory addresses) {
        bytes32[] memory requiredAddresses = new bytes32[](1);
        requiredAddresses[0] = bytes32("System");
        return requiredAddresses;
    }

    function system() internal view returns (System) {
        return System(requireAddress(bytes32("FeePool")));
    }

    

}