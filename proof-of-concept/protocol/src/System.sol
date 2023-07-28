// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {RewardModule, WorkInfo} from "./RewardModule.sol";

struct Pool {
    uint256 id;
    string name;
    string ticker;
    address owner;
    uint256 numTorrents;
    // Mapping of torrent.exactHash -> PoolTorrent.
    mapping(string => PoolTorrent) torrents;
    // Mapping of account -> upload.
    mapping(address => uint256) workMatrix;
    RewardModule rewardModule;
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

contract System {
    uint256 public poolCount;
    mapping(uint256 => Pool) public pools;
    address public operator;

    event PoolMember(uint256 indexed poolId, address indexed account, bool isMember);
    event Torrent(uint256 indexed poolId, string indexed exactTopic, string uri, bool live);
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
        require(poolId <= poolCount, "axon: Pool does not exist");
        Pool storage pool = pools[poolId];
        address account = msg.sender;
        pool.members[account].isMember = isMember;
        emit PoolMember(poolId, account, isMember);
    }

    function addRemoveTorrent(
        uint256 poolId,
        string memory exactTopic,
        string memory torrentURI,
        bool insert
    ) external {
        require(poolId <= poolCount, "axon: Pool does not exist");
        Pool storage pool = pools[poolId];
        require(pool.owner == msg.sender, "axon: Only owner can add torrent");
        require(TorrentUtils.validateExactTopic(exactTopic), "axon: torrent.exactTopic invalid");

        if(insert) {
            // Case: INSERT.
            pool.torrents[exactTopic] = PoolTorrent({
                exactTopic: exactTopic,
                uri: torrentURI
            });
            pool.numTorrents++;
        } else {
            // Case: DELETE.
            PoolTorrent memory emptyTorrent;
            pool.torrents[exactTopic] = emptyTorrent;
            if(pool.numTorrents == 0) {
                revert("axon: no torrents to remove");
            }
            pool.numTorrents--;
        }

        emit Torrent(poolId, exactTopic, torrentURI, insert);
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
