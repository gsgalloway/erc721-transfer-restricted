import chai, { expect } from "chai";
import { solidity } from "ethereum-waffle";
import { BigNumberish, Signer } from "ethers";
import { ethers } from "hardhat";
import { MockERC721TransferRestricted } from "../typechain";
chai.use(solidity);

describe("ERC721TransferRestricted", function () {
  let erc721TransferRestricted: MockERC721TransferRestricted;
  let admin: Signer;
  let tokenOwner: Signer;
  let tokenRecipient: Signer;
  let transferApprover: Signer;
  let nonApprovedRecipientAddr: string;

  const TOKEN_NAME = "Test ERC721";
  const TOKEN_SYMBOL = "TEST";
  const TOKEN_ID: BigNumberish = 42;

  beforeEach("deploy contract", async function () {
    // get signers
    let nonApprovedRecipient: Signer;
    [
      admin,
      tokenOwner,
      tokenRecipient,
      nonApprovedRecipient,
      transferApprover,
    ] = await ethers.getSigners();
    nonApprovedRecipientAddr = await nonApprovedRecipient.getAddress();

    // deploy contract
    const Erc721TransferRestricted = await ethers.getContractFactory(
      "MockERC721TransferRestricted"
    );
    erc721TransferRestricted = await Erc721TransferRestricted.deploy(
      await admin.getAddress(),
      TOKEN_NAME,
      TOKEN_SYMBOL
    );

    // grant TRANSFER_APPROVER role to a non-admin account
    await erc721TransferRestricted.grantRole(
      await erc721TransferRestricted.TRANSFER_APPROVER_ROLE(),
      await transferApprover.getAddress()
    );

    // mint a token for the tokenOwner
    await erc721TransferRestricted.mint(
      await tokenOwner.getAddress(),
      TOKEN_ID
    );
  });

  it("should allow transfer with prior authorization", async function () {
    await erc721TransferRestricted
      .connect(admin)
      .approveTransfer(TOKEN_ID, await tokenRecipient.getAddress());

    await erc721TransferRestricted
      .connect(tokenOwner)
      .transferFrom(
        await tokenOwner.getAddress(),
        await tokenRecipient.getAddress(),
        TOKEN_ID
      );

    const owner = await erc721TransferRestricted.ownerOf(TOKEN_ID);
    expect(owner).to.eq(await tokenRecipient.getAddress());
  });

  it("should allow non-admin with TRANSFER_APPROVER role to authorize transfers", async function () {
    // confirm transferApprover is not admin
    const isAdmin = await erc721TransferRestricted.hasRole(
      await erc721TransferRestricted.DEFAULT_ADMIN_ROLE(),
      await transferApprover.getAddress()
    );
    expect(isAdmin).to.be.false;

    // authorize transfer
    await erc721TransferRestricted
      .connect(transferApprover)
      .approveTransfer(TOKEN_ID, await tokenRecipient.getAddress());
  });

  it("should not allow transfer without prior authorization", async function () {
    const transferTx = erc721TransferRestricted
      .connect(tokenOwner)
      .transferFrom(
        await tokenOwner.getAddress(),
        await tokenRecipient.getAddress(),
        TOKEN_ID
      );
    await expect(transferTx).to.be.revertedWith(
      "ERC721TransferRestricted: transfer not approved"
    );
  });

  it("authorization of transfer one address should not permit transfer to a different address", async function () {
    await erc721TransferRestricted
      .connect(admin)
      .approveTransfer(TOKEN_ID, await tokenRecipient.getAddress());

    const transferTx = erc721TransferRestricted
      .connect(tokenOwner)
      .transferFrom(
        await tokenOwner.getAddress(),
        nonApprovedRecipientAddr,
        TOKEN_ID
      );

    await expect(transferTx).to.be.revertedWith(
      "ERC721TransferRestricted: transfer not approved"
    );
  });

  it("should delete prior authorization once transfer is completed", async function () {
    // authorize and conduct a transfer
    await erc721TransferRestricted
      .connect(admin)
      .approveTransfer(TOKEN_ID, await tokenRecipient.getAddress());
    await erc721TransferRestricted
      .connect(tokenOwner)
      .transferFrom(
        await tokenOwner.getAddress(),
        await tokenRecipient.getAddress(),
        TOKEN_ID
      );

    // attempt a second transfer of the same token
    const transferTx = erc721TransferRestricted
      .connect(tokenRecipient)
      .transferFrom(
        await tokenRecipient.getAddress(),
        await tokenOwner.getAddress(),
        TOKEN_ID
      );
    await expect(transferTx).to.be.revertedWith(
      "ERC721TransferRestricted: transfer not approved"
    );
  });

  it("should not allow actor without TRANSFER_APPROVER role to authorize transfers", async function () {
    // confirm tokenOwner does not have TRANSFER_APPROVER role
    const isTransferApprover = await erc721TransferRestricted.hasRole(
      await erc721TransferRestricted.TRANSFER_APPROVER_ROLE(),
      await tokenOwner.getAddress()
    );
    expect(isTransferApprover).to.be.false;

    // attempt as tokenOwner to approve a transfer
    const approveTx = erc721TransferRestricted
      .connect(tokenOwner)
      .approveTransfer(TOKEN_ID, await tokenRecipient.getAddress());
    await expect(approveTx).to.be.revertedWith(
      `AccessControl: account ${(
        await tokenOwner.getAddress()
      ).toLowerCase()} is missing role ${await erc721TransferRestricted.TRANSFER_APPROVER_ROLE()}`
    );
  });

  it("should allow revoking a prior authorization", async function () {
    // approve
    await erc721TransferRestricted
      .connect(transferApprover)
      .approveTransfer(TOKEN_ID, await tokenRecipient.getAddress());

    // revoke approval
    await erc721TransferRestricted
      .connect(transferApprover)
      .revokeApproval(TOKEN_ID);

    // attempt transfer
    const transferTx = erc721TransferRestricted
      .connect(tokenOwner)
      .transferFrom(
        await tokenOwner.getAddress(),
        await tokenRecipient.getAddress(),
        TOKEN_ID
      );
    await expect(transferTx).to.be.revertedWith(
      "ERC721TransferRestricted: transfer not approved"
    );
  });
});
