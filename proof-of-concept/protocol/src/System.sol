// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {RewardModule, WorkInfo} from "./RewardModule.sol";

struct Pool {
    uint256 id;
    string name;
    string ticker;
    address owner;
    string[] torrents;
    mapping(address => uint256) workMatrix;
    RewardModule rewardModule;
}

contract System {
    uint256 public poolCount;
    mapping(uint256 => Pool) public pools;
    address public operator;

    event NewTorrent(uint256 poolId, string torrent);
    event WorkMatrixUpdate(uint256 poolId, uint256 blockNumber);

    constructor() {}

    function initialize(address _operator) external {
        require(operator == address(0), "axon: Already initialized");
        operator = _operator;
    }
    
    function createPool(
        string memory name,
        string memory ticker,
        RewardModule rewardModule 
    ) external returns (uint256) {
        poolCount++;
        Pool storage pool = pools[poolCount];
        pool.id = poolCount;
        pool.name = name;
        pool.ticker = ticker;
        pool.owner = msg.sender;
        pool.rewardModule = rewardModule;
        return pool.id;
    }

    function addTorrent(uint256 poolId, string memory torrent) external {
        Pool storage pool = pools[poolId];
        require(pool.owner == msg.sender, "axon: Only owner can add torrent");
        pool.torrents.push(torrent);
        emit NewTorrent(poolId, torrent);
    }

    function updateWorkMatrix(
        uint256 poolId,
        address[] memory accounts,
        uint256[] memory rewards
    ) external {
        require(msg.sender == operator, "axon: Only operator can update rewards matrix");
        require(poolId <= poolCount, "axon: Pool does not exist");
        Pool storage pool = pools[poolId];
        for(uint256 i = 0; i < accounts.length; i++) {
            pool.workMatrix[accounts[i]] = rewards[i];
        }
        emit WorkMatrixUpdate(poolId, block.number);
    }

    function claimRewards(
        uint256 poolId,
        address account
    )
        external
    {
        Pool storage pool = pools[poolId];
        uint256 upload = pool.workMatrix[account];
        if (address(pool.rewardModule) == address(0)) {
            revert("axon: no rewards module configured");
        }
        RewardModule rewardModule = RewardModule(pool.rewardModule);
        WorkInfo memory workInfo = WorkInfo({
            account: account,
            upload: upload
        });
        rewardModule.claimReward(workInfo);
    }

    function getTorrents(uint256 poolId) external view returns (string[] memory) {
        Pool storage pool = pools[poolId];
        return pool.torrents;
    }

    function getPoolCount() external view returns (uint256) {
        return poolCount;
    }

    function getPoolRewardsModule(uint256 poolId) external view returns (address) {
        Pool storage pool = pools[poolId];
        return address(pool.rewardModule);
    }
}
