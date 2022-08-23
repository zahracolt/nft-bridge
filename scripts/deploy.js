const ETHERSCAN_URL = "https://rinkeby.etherscan.io/address/"
const OPENSEA_URL = "https://testnets.opensea.io/assets/"

async function main() {
    const [deployer] = await ethers.getSigners()
    console.log("Deploying contracts with the account:", deployer.address)
    console.log("Account balance:", (await deployer.getBalance() * 1e-18).toString(), "ETH")
    
    const factory = await hre.ethers.getContractFactory("MyLittleBridge")
    const nftCurrentMax = 5
    const contract = await factory.deploy(
        nftCurrentMax
    )
    console.log("Contract address:", contract.address)
    console.log(`${ETHERSCAN_URL}${contract.address}`)
    console.log("Deploying contract...")
    await contract.deployed()
    console.log("Contract deployed!")
    
    await contract.setSaleOpen(true)    
    let txn = await contract.buy(1, { 
        value: hre.ethers.utils.parseEther('0.07')
    })
    console.log("Mining...")
    await txn.wait()
    
    let tokenId = await contract.tokenCounter()
    tokenId = tokenId.toNumber() - 1
    console.log(`NFT minted: ${OPENSEA_URL}/${contract.address}/${tokenId}\n`)
        
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