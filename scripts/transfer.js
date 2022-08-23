async function main() {

    const accounts = await ethers.getSigners()
    console.log(typeof accounts, accounts.length)
    const provider = ethers.provider
    await provider.send('eth_sendTransaction', [{
        from: accounts[0].address,
        to: accounts[1].address,
        value: ethers.utils.parseUnits("0.86", 'ether').toHexString()
    }])
    for (const a of accounts) {
        balance = await provider.getBalance(a.address)
        console.log((balance * 1e-18).toString())
    }
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error)
        process.exit(1)
    })