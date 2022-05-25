//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

abstract contract ERC721TransferRestricted is ERC721, AccessControlEnumerable {
    bytes32 public constant TRANSFER_APPROVER_ROLE = keccak256("TRANSFER_APPROVER");
    
    mapping(uint256 => address) public approvedTransferRecipients;


    constructor(address admin) ERC721("MyToken", "MTK") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }


    function approveTransfer(
        uint256 tokenId,
        address recipient
    ) external virtual onlyRole(TRANSFER_APPROVER_ROLE) {
        approvedTransferRecipients[tokenId] = recipient;
    }

    function _transfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override {
        require(approvedTransferRecipients[tokenId] == to, "ERC721TransferRestricted: transfer not approved");
        delete approvedTransferRecipients[tokenId];
        super._transfer(from, to, tokenId);
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(AccessControlEnumerable, ERC721)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
