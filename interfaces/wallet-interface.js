const MongoClient = require('mongodb').MongoClient; 
const { connectionString } = require('../config/db-config.json'); 
let db = null; 
let collection = null; 
MongoClient.connect(connectionString, { useNewUrlParser : true}, (err, client) => {
    if(err) { console.log(error); return; };
    db = client.db('jarvis'); 
    collection = db.collection('wallets'); 
}); 

class WalletInterface  {
    static async fetchBalance(discordId) {
        try {
            return await collection.findOne({ 'd-uid' : discordId }, { 'bal' : 1 });
        }catch(error) {
            console.log(error); 
        }
    }

    static async setBalance(discordId, newBalance) {
        try {
            return await collection.updateOne({ 'd-uid' : discordId },
            { $set : { 'bal' : newBalance }}); 
        }catch(error) {
            console.log(error); 
        }
    }

    static async addFunds(discordId, amount) {
        try{
           const current = await this.fetchBalance(discordId); 
           const next = parseInt(current.bal) + parseInt(amount); 
           await this.setBalance(discordId, next); 
           return next; 
        }catch(error) {
            console.log(error); 
        }
    }

    static async removeFunds(discordId, amount) {
        try {
            const current = await this.fetchBalance(discordId); 
            if(parseInt(current.bal) < parseInt(amount)) {
                amount = parseInt(current.bal); 
            }
            const next = parseInt(current.bal) - parseInt(amount); 
            await this.setBalance(discordId, next); 
            return next; 
        }catch(error) {
            console.log(error); 
        }
    }

    static async openWallet(discordId, username,  amount) { 
        try {
            var balCheck = await this.fetchBalance(discordId); 
            if(balCheck == null) {
                return await collection.insertOne({ 
                    'd-uid' : discordId, 
                    'd-user' : username, 
                    'bal' : amount
                });
            }
        }catch(error) {
            console.log(error); 
        }
    }
}

module.exports = WalletInterface; 