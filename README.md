# ERC721TransferRestricted

An extension to the ERC721 standard that designates a `TRANSFER_APPROVER` role that must pre-authorize any token transfers. This may be useful for things like tickets, badges, certificates, or other such tokens where the ability to transfer them should be governed by an administrative entity.

The extension adds the following two functions:

```solidity
function approveTransfer(
    uint256 tokenId,
    address recipient
) external virtual onlyRole(TRANSFER_APPROVER_ROLE);

function revokeApproval(
    uint256 tokenId
) external virtual onlyRole(TRANSFER_APPROVER_ROLE);
```

The regular transfer semantics (`transferFrom()` and `safeTransferFrom()`) will behave as standard, with an additional prior check for authorization of the transfer before reassigning the owner.
