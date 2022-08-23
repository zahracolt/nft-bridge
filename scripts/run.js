const dotevn = require("dotenv")
dotevn.config()


const OPENSEA_URL = "https://testnets.opensea.io/assets/"
const ETHERSCAN_URL = "https://rinkeby.etherscan.io/address/"

const main = async () => {
    const factory = await hre.ethers.getContractFactory("MyLittleBridge")
    // const nftContractFactory = await hre.ethers.getContractFactory("NotMyEpicNFT")
    const nftCurrentMax = 5
    const contract = await factory.deploy(
        nftCurrentMax
    )
    await contract.deployed()
    console.log("Contract deployed to:", contract.address)

    await contract.setSaleOpen(true)

    let txn = await contract.buy(1, { 
        value: hre.ethers.utils.parseEther('0.07')
    })
    console.log("Mining...")
    await txn.wait()

    let tokenId = await contract.tokenCounter()
    tokenId = tokenId.toNumber() - 1
    console.log(`NFT minted: ${OPENSEA_URL}/${contract.address}/${tokenId}`)

}

const runMain = async () => {
    try {
        await main()
        process.exit(0)
    } catch (error) {
        console.log(error)
        process.exit(1)
    }
}

runMain()