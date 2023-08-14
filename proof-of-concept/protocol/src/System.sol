// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {MixinInitializable} from "niacin-contracts/mixins/MixinInitializable.sol";
import {RewardModule, WorkInfo} from "./rewards/RewardModule.sol";
import {TorrentUtils} from "./lib/TorrentUtils.sol";

struct Pool {
    // Unique pool ID.
    uint256 id;
    
    // Name of pool.
    string name;
    
    // Ticker for pool.
    string ticker;

    // Description for pool.
    string description;

    // Owner of pool.
    address owner;

    // ---------
    // Torrents.
    // ---------

    // Number of torrents in pool.
    uint256 numTorrents;

    // Number of members of pool.
    uint256 numMembers;

    // Mapping of torrent.exactHash -> PoolTorrent.
    mapping(string => PoolTorrent) torrents;

    // ---------
    // Rewards.
    // ---------
    
    // Mapping of account -> upload.
    mapping(address => uint256) workMatrix;

    // User-defined reward module for pool.
    RewardModule rewardModule;
    
    // Members of pool.
    mapping(address => PoolMembership) members;
}

struct PoolMembership {
    bool isMember;
}

struct PoolTorrent {
    // Corresponds with the `xt` field in torrent URI scheme. [1]
    string exactTopic;

    // The full magnet URI of the torrent. [1]
    // Clients MUST validate exactTopic matches the `xt` field within this URI.
    string uri;

    // [1]: https://en.wikipedia.org/wiki/Magnet_URI_scheme
}

struct AggregatorInfo {
    // libp2p multiaddress for connecting to aggregator.
    // used by nodes to report their work.
    string multiaddr;
}


library StringUtils {
    function toBytes32(string memory self) internal pure returns (bytes32) {
        require(bytes(self).length <= 32, "Input string too long");
        
        bytes32 result;
        assembly {
            result := mload(add(self, 32))
        }
        return result;
    }
}


contract System {
    /// @notice State.
    uint256 public poolCount;
    mapping(uint256 => Pool) public pools;
    address public operator;
    AggregatorInfo public aggregator;

    /// @notice Events.
    /// @dev `name` is a string, although we type it as `bytes32` in order to extract it. [1]
    /// [1] https://ethereum.stackexchange.com/questions/6840/indexed-event-with-string-not-getting-logged 
    event PoolCreated(uint256 indexed poolId, bytes32 indexed name, string indexed ticker);
    event PoolMember(uint256 indexed poolId, address indexed account, bool isMember);
    event Torrent(uint256 indexed poolId, bytes32 indexed exactTopic, string uri, bool live);
    event WorkMatrixUpdate(uint256 poolId, uint256 blockNumber);

    constructor() {}

    // TODO AXON
    function configure(address _operator) external {
        require(operator == address(0), "axon: Already initialized");
        operator = _operator;
    }
    
    function createPool(
        string memory name,
        string memory ticker,
        string memory description,
        RewardModule rewardModule
    ) external returns (uint256) {
        Pool storage pool = pools[poolCount];
        pool.id = poolCount;
        pool.name = name;
        pool.ticker = ticker;
        pool.description = description;
        pool.owner = msg.sender;
        pool.rewardModule = rewardModule;
        emit PoolCreated(
            pool.id, 
            // name.toBytes32(),
            hex"",
            ticker
        );
        poolCount++;
        return pool.id;
    }

    function setAggregator(
        string calldata multiaddr
    ) external {
        require(msg.sender == operator, "axon: Only operator can set aggregator");
        aggregator = AggregatorInfo({
            multiaddr: multiaddr
        });
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

    function joinLeavePool(
        uint256 poolId,
        bool isMember
    )
        external
    {
        address account = msg.sender;
        emit PoolMember(poolId, account, isMember);
        
        require(poolId <= poolCount, "axon: Pool does not exist");

        Pool storage pool = pools[poolId];
        pool.members[account].isMember = isMember;

        if(isMember) {
            pool.numMembers++;
        } else {
            if(pool.numMembers == 0) {
                revert("axon: no members to leave");
            }
            pool.numMembers--;
        }
    }

    function addRemoveTorrent(
        uint256 poolId,
        string memory exactTopic,
        bytes32 xtBytes,
        string memory torrentURI,
        bool live
    ) external {
        require(poolId <= poolCount, "axon: Pool does not exist");
        Pool storage pool = pools[poolId];
        require(pool.owner == msg.sender, "axon: Only owner can add torrent");
        require(TorrentUtils.validateExactTopic(exactTopic), "axon: torrent.exactTopic invalid");

        if(live) {
            // Case: ADD.
            pool.torrents[exactTopic] = PoolTorrent({
                exactTopic: exactTopic,
                uri: torrentURI
            });
            pool.numTorrents++;
        } else {
            // Case: REMOVE.
            delete pool.torrents[exactTopic];
            if(pool.numTorrents == 0) {
                revert("axon: no torrents to remove");
            }
            pool.numTorrents--;
        }

        emit Torrent(
            poolId, 
            xtBytes,
            torrentURI, 
            live
        );
    }

    function getPoolInfo(
        uint256 poolId
    )
        external 
        view
        returns (
            string memory name,
            string memory ticker,
            string memory description,
            address owner,
            uint256 numTorrents,
            uint256 numMembers,
            address rewardModule
        )
    {
        Pool storage pool = pools[poolId];

        return (
            pool.name,
            pool.ticker,
            pool.description,
            pool.owner,
            pool.numTorrents,
            pool.numMembers,
            address(pool.rewardModule)
        );
    }

    function isMember(
        uint256 poolId,
        address account
    )
        external
        view
        returns (bool)
    {
        Pool storage pool = pools[poolId];
        return pool.members[account].isMember;
    }

    function getPoolInfoBatch(
        uint256[] memory poolIds
    )
        external 
        view
        returns (
            string[] memory names,
            string[] memory tickers,
            address[] memory owners,
            address[] memory rewardModules
        )
    {
        string[] memory _names = new string[](poolIds.length);
        string[] memory _tickers = new string[](poolIds.length);
        address[] memory _owners = new address[](poolIds.length);
        address[] memory _rewardModules = new address[](poolIds.length);

        for (uint256 i = 0; i < poolIds.length; i++) {
            Pool storage pool = pools[poolIds[i]];
            _names[i] = pool.name;
            _tickers[i] = pool.ticker;
            _owners[i] = pool.owner;
            _rewardModules[i] = address(pool.rewardModule);
        }

        return (_names, _tickers, _owners, _rewardModules);
    }

    function getPoolCount() external view returns (uint256) {
        return poolCount;
    }

    function getPoolRewardsModule(uint256 poolId) external view returns (address) {
        Pool storage pool = pools[poolId];
        return address(pool.rewardModule);
    }
}
