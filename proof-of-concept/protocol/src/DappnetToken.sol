import {ERC20} from "./ERC20.sol";

contract DappnetToken is ERC20 {
    constructor() ERC20("Dappnet", "DAPPNET", 18) public {
        _mint(msg.sender, 10000000000000000000 * (10 * 1e18));
    }
}