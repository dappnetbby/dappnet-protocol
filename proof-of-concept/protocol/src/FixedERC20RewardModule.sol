
import "./RewardModule.sol";
import "./ERC20.sol";

contract FixedERC20RewardModule is RewardModule {
    address public operator;
    ERC20 public rewardToken;
    mapping(address => uint256) public claimed;

    event ClaimRewards(address indexed account, uint256 amount);

    function initialize(
        address _operator,
        address _rewardToken
    ) external {
        require(operator == address(0), "axon: Already initialized");
        operator = _operator;
        rewardToken = ERC20(_rewardToken);
    }

    function unclaimedRewards(
        address account,
        uint256 upload
    ) external view returns (uint256) {
        return upload - claimed[account];
    }
    
    function claimReward(WorkInfo memory workInfo) external override returns (uint256) {
        // TODO permission so only System can call.
        require(rewardToken.balanceOf(address(this)) >= workInfo.upload, "axon: Not enough reward tokens");
        
        uint256 award = this.unclaimedRewards(workInfo.account, workInfo.upload);
        if(award == 0) revert("axon: No rewards to claim");
        
        rewardToken.transfer(workInfo.account, award);
        emit ClaimRewards(workInfo.account, award);
        
        claimed[workInfo.account] += award;

        return award;
    }


}