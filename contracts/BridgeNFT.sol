// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "hardhat/console.sol";
// Last deployed contract to Rinkeby
//0x98472C7099675A82d9f8E65b67e5a0586FcCB284
//https://rinkeby.etherscan.io/address/0x98472c7099675a82d9f8e65b67e5a0586fccb284

contract BridgeNFT is ERC721Enumerable, Ownable {

    using Strings for uint256;

    // URIs
    string private _baseTokenURI;
    string private _contractURI;  // Opensea contract-level metadata
    
    // Authors
    // address private owner;
    address private artist = 0x2364e8B70a3746Bf5be6215596Df4F36DEe86cE0;
    address private dev = 0x2364e8B70a3746Bf5be6215596Df4F36DEe86cE0;
    address private manager = 0x2364e8B70a3746Bf5be6215596Df4F36DEe86cE0;

    // Token counting
    uint256 public tokenCounter;
    uint256 NFT_MAX = 10;
    uint256 public nftCurrentMax;
    uint256 private nftReserved = 2;
    
    // Token economics
    uint256 maxPurchase = 5;
    uint256 private PRICE = 0.07 ether;
    // uint16 private _royalties;

    // Sales variables
    bool public saleOpen = false;

    event NewNFTMinted(address sender, uint256 numTokens, uint256 lastTokenId);

    constructor(uint256 _nftCurrentMax) ERC721("BridgeNFT", "BRG") {
        Ownable(msg.sender);
        // setBaseURI(baseURI);
        //
        if (_nftCurrentMax > NFT_MAX || _nftCurrentMax == 0) {
            _nftCurrentMax = NFT_MAX;
        }
        nftCurrentMax = _nftCurrentMax;
        // _royalties = royalties;

        // // Pre-minted tokens for the team
        // _safeMint(artist, 0);
        // _safeMint(dev, 1);
        // _safeMint(manager, 2);
        // tokenCounter += 3;
    }


    // TokenURI methods
    //function setBaseURI(string calldata URI) external onlyOwner { // external?
    function setBaseURI(string calldata URI) public onlyOwner { // external?
        _baseTokenURI = URI;
    }

    function tokenURI(uint256 tokenId) public view override(ERC721) returns (string memory) {
        require(_exists(tokenId), "Cannot query non-existent token");
        
        return string(abi.encodePacked(_baseTokenURI, tokenId.toString()));
    }

    // Economics
    function setSaleOpen(bool _saleOpen) public onlyOwner {
        saleOpen = _saleOpen;
    }

    function buy(uint numTokens) public payable {
        require(saleOpen, "Sale closed");
        require(msg.value >= PRICE * numTokens, "Insufficient ETH");
        require(numTokens <= maxPurchase, "Exceeded maximum purchase");
        require(tokenCounter + numTokens <= nftCurrentMax, "Not enough tokens available");

        for(uint256 i; i < numTokens; i++){
            _safeMint(msg.sender, tokenCounter + i);
        }

        tokenCounter += numTokens;
        
        //NewNFTMinted(address sender, uint256 numTokens, uint256 lastTokenId);
        emit NewNFTMinted(msg.sender, numTokens, tokenCounter-1);
    }
    
    function setSaleCampaign(
        uint256 numTokens, string calldata baseUri
    ) public onlyOwner {
        setSaleOpen(true);
        nftCurrentMax += numTokens;
        if (nftCurrentMax > NFT_MAX) {
            nftCurrentMax = NFT_MAX;
        }
        setBaseURI(baseUri);
    }
    
    function withdraw(uint256 amount) external onlyOwner {
        uint256 currentBalance = address(this).balance;
        if (amount == 0) {
            amount = currentBalance;
        }
        require(amount <= currentBalance, "Not enough funds");
        payable(artist).transfer(amount / 2);
        payable(dev).transfer(amount / 4);
        payable(manager).transfer(amount / 4);
    }

    // Opensea contract-level metadata
    // https://docs.opensea.io/docs/contract-level-metadata
    function setContractURI(string calldata URI) external onlyOwner {
        _contractURI = URI;
    }

    function contractURI() public view returns (string memory) {
        return _contractURI;
    }

}