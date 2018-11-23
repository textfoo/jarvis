const WalletInterface = require('../../interfaces/wallet-interface'); 
const ss = '℈'; 

module.exports = {
    name : 'wallet', 
    description : 'exposes wallet functionality. count your scruples!', 
    async execute(message, args) {
        if(args[0] === undefined) {
            await fetchWalletBalance(message); 
            return; 
        }

        switch(args[0]) {
            case 'bal' : await fetchWalletBalanceByUser(message, args); break;
            case 'add' : await addFunds(message, args[1]); break; 
            case 'subtract' : await subtractFunds(message, args[1]); break;
            //should only expose this through the broker, while I'm testing i'll leave it open
            case 'open' : await openWallet(message); break; 
        }

        async function fetchWalletBalance(message) {        
            try {
                console.log(`hit origional`);
                var response = await WalletInterface.fetchBalance(message.author.id); 
                if(response == null) {
                    message.reply(`No account found. Would you like to open on? (hint: !broker open)`)
                    return; 
            }
            await message.reply(` balance : ${ss}${response.bal}.`);
            }catch(error) {
                console.log(error); 
            }
        }

        async function fetchWalletBalanceByUser(message, args) {
            try{
            const discordId = args[1].substring(2, args[1].length -1); 
            if(isNaN(parseInt(discordId))) {
                await message.reply(' could not identify user. Try "@"ing with the username.'); 
                return; 
            }
            const response = await WalletInterface.fetchBalance(discordId); 
            if(response == null) {
                message.reply(`No account found. Would you like to open on? (hint: !wallet open)`)
                    return;
            }
            await message.reply(` balance : ${ss}${response.bal}`);
            return; 
            }catch(error){
                console.log(error); 
            }
        }

        async function addFunds(message, amount) {
            try {
                var response = await WalletInterface.addFunds(message.author.id, amount); 
                if(response == null) {
                    message.reply('Transaction was not approved. Please contact a global broker for details.'); 
                    return; 
                }
                await message.reply(`Funds deposited. Current balance : ${ss}${response}`); 
            }catch(error) {
                console.log(error); 
            }
        }

        async function subtractFunds(message, amount) {
            try {
                var response = await WalletInterface.removeFunds(message.author.id, amount); 
                if(response == null) {
                    message.reply('Transaction was not approved. Please contact a global broker for details.');
                    return;
                }
                await message.reply(`Funds removed. Current balance : ${ss}${response}`);
                return;
            }catch(error) { 
                console.log(error); 
            }
        }

        async function openWallet(message, amount) { 
            try {
                const discordId = message.author.id; 
                const username = message.author.username; 
                amount = 1000; 
                const response = await WalletInterface.openWallet(discordId, username, amount); 
                if(response != null) {
                    await message.reply(` wallet created. Balance ${amount}`); 
                    return; 
                }
                console.log(response);
                await message.reply(`Wallet already detected. Try !wallet to see your balance.`);
            }catch(error){
                console.log(error);
            }
        }
    }
}

