const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MyLittleBridge contract", async () => {
    let owner, user1, factory, contract, numTokens
    let baseTokenURI = "ipfs/abc/"

    const PRICE = 0.07
    const NFT_MAX = 10
    let nftCurrentMax = 5
    const USER_INITIAL_BALANCE = 1000

    beforeEach(async () => {
        [owner, user1, user2] = await ethers.getSigners()
        factory = await ethers.getContractFactory("MyLittleBridge")
        contract = await factory.deploy(nftCurrentMax)
        await contract.setBaseURI(baseTokenURI)
    })
    
    it("Correctly initializes the constructor variables", async () => {
        // expect(await contract._baseTokenURI()).to.equal(baseTokenURI)
        expect(await contract.nftCurrentMax()).to.equal(nftCurrentMax)
    })
    
    it("Deployed contract owned by creator", async () => {
        expect(owner.address).to.equal(contract.signer.address)
    })
    
    it("totalSupply equals 0 before minting", async () => {
        expect((await contract.tokenCounter()).toNumber()).to.equal(0)
    })

    describe("setSaleOpen()", async () => {

        it("throws an error if not called by the owner", async () => {
            let instance = contract.connect(user1)
            await expect(
                instance.setSaleOpen(true)
            ).to.be.revertedWith("Ownable: caller is not the owner")
        })

        it("set to true", async () => {
            await contract.setSaleOpen(true)
            let saleOpen = await contract.saleOpen()
            expect(saleOpen).to.be.true
        })

        it("set to false", async () => {
            await contract.setSaleOpen(false)
            let saleOpen = await contract.saleOpen()
            expect(saleOpen).to.be.false
        })

    })

    describe("tokenURI()", async () => {

        it("throws an error if the tokenId doesn't exist", async () => {
            await expect(contract.tokenURI(0)).to.be.revertedWith("Cannot query non-existent token")
        })

        it("returns the URI string if the tokenId exists", async () => {
            await contract.setSaleOpen(true);

            const instance = contract.connect(user1)
            
            numTokens = 1
            await instance.buy(numTokens, {
                value: hre.ethers.utils.parseEther(PRICE.toString())
            })
            
            let uri = await instance.tokenURI(0)
            expect(uri).to.equal(`${baseTokenURI}0`)
        })
    })

    describe("setBaseURI()", async () => {

        it("changes the TokenURIs", async () => {
            await contract.setSaleOpen(true);

            const instance = contract.connect(user1)
            
            numTokens = 1
            await instance.buy(numTokens, {
                value: hre.ethers.utils.parseEther(PRICE.toString())
            })

            let newUri = "ipfs/def/"
            await contract.setBaseURI(newUri)
            let contractCurrentUri = await instance.tokenURI(0)
            expect(contractCurrentUri).to.equal(`${newUri}0`)

        })
    })
    
    describe("buy()", async() => {

        it("throws an error if the sale is closed", async() => {
            const instance = contract.connect(user1)
            
            await expect(instance.buy(1, {
                value: hre.ethers.utils.parseEther(PRICE.toString())
            })).to.be.revertedWith("Sale closed")
        })

        it("throws an error if the value sent is less than the set price", async() => {
            await contract.setSaleOpen(true);

            const instance = contract.connect(user1)
            
            numTokens = 1
            await expect(instance.buy(numTokens, {
                value: hre.ethers.utils.parseEther('0.05')
            })).to.be.revertedWith("Insufficient ETH")
            
            numTokens = 2
            await expect(instance.buy(numTokens, {
                value: hre.ethers.utils.parseEther('0.07')
            })).to.be.revertedWith("Insufficient ETH")            
        })

        it("throws an error if the numTokens is greater than the limit", async() => {
            await contract.setSaleOpen(true);

            const instance = contract.connect(user1)
            
            numTokens = 6
            await expect(instance.buy(numTokens, {
                value: hre.ethers.utils.parseEther((PRICE * numTokens).toString())
            })).to.be.revertedWith("Exceeded maximum purchase")
        })

        it("throws an error if there are not enough available tokens", async() => {
            await contract.setSaleOpen(true);

            let instance = contract.connect(user1)
            
            numTokens = 5
            await instance.buy(numTokens, {
                value: hre.ethers.utils.parseEther((PRICE * numTokens).toString())
            })
            let currentSupply = await instance.tokenCounter() // BigNumber
            currentSupply = currentSupply.toNumber() // Javascript Number
            await expect(currentSupply).to.equal(numTokens)

            instance = contract.connect(user2)
            numTokens = 2
            await expect(instance.buy(numTokens, {
                value: hre.ethers.utils.parseEther((PRICE * numTokens).toString())
            })).to.be.revertedWith("Not enough tokens available")
        })

        it("contract balance updated when tokens successfully minted", async() => {
            await contract.setSaleOpen(true);

            const instance = contract.connect(user1)
            
            numTokens = 1
            await instance.buy(numTokens, {
                value: hre.ethers.utils.parseEther((PRICE * numTokens).toString())
            })

            let balance = await contract.provider.getBalance(contract.address)
            balance = ethers.utils.formatEther(balance)
            expect(balance).to.equal("0.07")

            numTokens = 3
            await instance.buy(numTokens, {
                value: hre.ethers.utils.parseEther((PRICE * numTokens).toString())
            })

            balance = await contract.provider.getBalance(contract.address)
            balance = ethers.utils.formatEther(balance)
            expect(parseFloat(balance)).to.closeTo(0.28, 1e-15)
        })
    })

    describe("setSaleCampaign()", async () => {
        // TODO testing!
        // it("")
    })

    describe("withdraw()", async() => {

        it("throws an error if the amount is greater than the current balance", async() => {
            await expect(contract.withdraw(
                ethers.utils.parseEther("1")
            )).to.be.revertedWith("Not enough funds")
        })

        it("withdraws all the funds when the amount passed is '0'", async () => {
            await contract.setSaleOpen(true);

            const instance = contract.connect(user1)            
            numTokens = 1
            await instance.buy(numTokens, {
                value: hre.ethers.utils.parseEther((PRICE * numTokens).toString())
            })

            balance = await contract.provider.getBalance(contract.address)
            balance = ethers.utils.formatEther(balance)
            expect(parseFloat(balance)).to.closeTo(0.07, 1e-15)

            await contract.withdraw(ethers.utils.parseEther("0"))
            balance = await contract.provider.getBalance(contract.address)
            balance = ethers.utils.formatEther(balance)
            expect(parseFloat(balance)).to.equal(0)
        })

        it("withdraws the amount passed", async () => {
            await contract.setSaleOpen(true);

            const instance = contract.connect(user1)            
            numTokens = 5
            await instance.buy(numTokens, {
                value: hre.ethers.utils.parseEther((PRICE * numTokens).toString())
            })

            balance = await contract.provider.getBalance(contract.address)
            balance = ethers.utils.formatEther(balance)
            expect(parseFloat(balance)).to.closeTo(0.35, 1e-15)

            await contract.withdraw(ethers.utils.parseEther("0.28"))
            balance = await contract.provider.getBalance(contract.address)
            balance = ethers.utils.formatEther(balance)
            expect(parseFloat(balance)).to.be.closeTo(0.07, 1e-15)
        })

    })

})