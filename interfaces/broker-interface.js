const { ObjectId } = require('mongodb'); 
const MongoClient = require('mongodb').MongoClient; 
const { connectionString, log } = require('../config/db-config.json'); 
let db = null; 
var collection = null; 
const WalletInterface = require('./wallet-interface'); 

MongoClient.connect(connectionString, { useNewUrlParser : true}, (err, client) => {
    if(err) { console.log(error); return; };
    db = client.db('jarvis'); 
    collection = db.collection('brokers'); 
    console.log(`connected via above: ${db.serverConfig.isConnected()}`);
}); 

class BrokerInterface {
    constructor() {
    }

    static isConnected() {
        return db.serverConfig.isConnected() || false; 
    }

    static async brokerExists(discordId) {
        try {
            if(log) { console.log(`| brokerExists | discordId : ${discordId} | collection : ${collection}`); }
            var response = await collection.findOne(
                { 'd-uid' : discordId }, { _id : 1}
            );
            console.log(`response : ${response}`);
            if(response == null) {
                return false; 
            }
            return true; 
        }catch(error) {
            console.log(error); 
        }
    }

    static async createBet(bookId, bet) {
        try {
            console.log(`bookId ${bookId} | bet ${JSON.stringify(bet)}`);
            var response = await collection.updateOne(	
                { 'books._id' : ObjectId(bookId) }, 
            { $push : { 'books.$.bets' :  bet }}
            ); 
            return response; 
        }catch(error) {
            console.log(error); 
        }
    }

    static async fetchBrokerId(discordId, serverId) {
        try {
            return await collection.findOne({
             'd-uid' : discordId, 
             $or: [
                {'d-server' : { $eq: serverId }}, 
                {'isGlobal' : true}]
            }, { _id : 1});
        }catch(error) {
            console.log(error); 
        }
    }

    static async fetchBook(bookId) {
        try {   
            const book = await collection.aggregate([
                { $unwind : '$books' },
                { $match : { 'books._id' :  ObjectId(bookId) }},
                { $project : { _id : '$books._id', created : '$books.created', catagory : '$books.catagory', 
                  text : '$books.text', odds : '$books.odds', isOpen : '$books.isOpen', discordId : 'd-uid' }}
            ]).toArray();
            return book[0]; 
        }catch(error) {
            console.log(error); 
        }
    }


    static async fetchBooks(discordId) {
        try {
            const books = await collection.aggregate([ 
               { $match : { 'd-uid' : discordId }},
               { $unwind : '$books' }, 
               { $match : { 'books.isOpen' : true }},
               { $project : { _id : '$books._id', catagory : '$books.catagory', text : '$books.text', odds : '$books.odds'}}
            ]).toArray();
            return books; 
        }catch(error) {
            console.log(error); 
        }
    }


    static async fetchOpenBooksByServer(serverId) {
        try {
            console.log(`servier id : ${serverId}`);
            const books = await collection.aggregate([ 
                { $match : { $or : [{'isGlobal' : true}, {'d-server' : serverId }]}}, 
                { $unwind : '$books' },
                { $match : { 'books.isOpen' : true }},
                { $project : { _id : '$books._id', text : '$books.text', odds : '$books.odds'}}
            ]).toArray();
            return books;
        }catch(error) {
            console.log(error); 
        }
    }

    static async fetchBookWithBets(discordId, bookId) {
        try {
            const book = await collection.aggregate([
                { $match : { 'd-uid' : discordId }},
                { $unwind : '$books' },
                { $match : { 'books._id' : ObjectId(bookId) }},
                { $project : { catagory : '$books.catagory', text : '$books.text', odds : '$books.odds', bets : '$books.bets' }},
                { $limit : 1}
            ]).toArray();
            //console.log(JSON.stringify(book));
            return book[0]; 
        }catch(error){ 
            console.log(error); 
        }
    }


    static async fetchBetsByBook(serverId, bookId) {
        try {
            const bets = await collection.aggregate([
                { $match : { $or : [{ 'd-server' : serverId }, { 'isGlobal' : true }]}}, 
                { $unwind : '$books' }, { $unwind : '$books.bets' },
                { $match : { 'books._id' : ObjectId(bookId) }},
                { $project : { discordId : '$books.bets.d-uid', bet : '$books.bets.amount', username : '$books.bets.username', payout : '$books.bets.payout' }}
            ]).toArray();
            console.log(`bet 0 : ${JSON.stringify(bets[0])}`);
            return bets; 
        }catch(error) {
            console.log(error); 
        }
    }

    static async createBroker(discordId, serverId, username, referralId, isGlobal) {
        try {
            if(log) { console.log(`| create-broker | d-uid : ${discordId} | d-server : ${serverId}`); }
            var exists = await this.brokerExists(discordId); 
            if(!exists){
                return await collection.insertOne({ 
                    'd-uid' : discordId, 
                    'd-server' : serverId, 
                    'd-user' : username, 
                    'ref-id' : referralId, 
                    'isGlobal' : isGlobal,
                    'books' : [] 
                });
            }
        } 
        catch(error) { 
            console.log(error); 
        }
    }

    static async createBook(discordId, book){
        try {
            if(book._id == null) {
                book._id = new ObjectId(); 
            }
            const response = await collection.updateOne(
                { 'd-uid' : discordId }, 
                { $push : { 'books' : book }}
            );
            console.log(response);
            return book._id; 
        }catch(error) {
            console.log(error); 
        }
    }



    static async closeBook(discordId, bookId) {
        console.log('hit closed book');
        try {
            console.log(`discordId : ${discordId} | bookId ${bookId}`)
            var response = await collection.updateOne(
                 { 'd-uid' : discordId, 'books._id' : ObjectId(bookId)},
                 { $set : { 'books.$.isOpen' :  false }}
                );;
                console.log(JSON.stringify(response));
            return response; 
        }catch(error){ 
            console.log(error);
        }
    }

    static async createWallet(discordId, amount) {

    }

    static async closeWallet(discordId) { 

    }

    static async updateOdds(discordId, betId, odds) {

    }

    static async payOutBet(discordId, serverId, betId ) {

    }

    
}

module.exports = BrokerInterface;