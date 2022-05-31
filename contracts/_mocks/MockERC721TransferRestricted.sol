pragma solidity ^0.8.0;

import "../ERC721TransferRestricted.sol";

// MockERC721TransferRestricted is used for testing the ERC721TransferRestricted interface
contract MockERC721TransferRestricted is ERC721TransferRestricted {
    constructor(address admin, string memory name, string memory symbol) ERC721TransferRestricted(admin, name, symbol) {}

    function mint(address to, uint256 tokenId) public {
        _mint(to, tokenId);
    }
}