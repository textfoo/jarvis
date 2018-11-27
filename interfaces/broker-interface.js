const { ObjectId } = require('mongodb'); 
const MongoClient = require('mongodb').MongoClient; 
const { connectionString, log } = require('../config/db-config.json'); 

const Logger = require('../utility/logger');
const logger = new Logger(); 

let db = null; 
let collection = null; 

MongoClient.connect(connectionString, { useNewUrlParser : true}, (err, client) => {
    if(err) { logger.error(error); return; };
    db = client.db('jarvis'); 
    collection = db.collection('brokers'); 
}); 

class BrokerInterface {
    static async brokerExists(discordId) {
        try {
            logger.info(`BrokerInterface | brokerExists | args : { discordId : ${discordId} }`); 
            var response = await collection.findOne(
                { 'd-uid' : discordId }, { _id : 1}
            );
            
            if(response == null) {
                logger.debug(`BrokerInterface | brokerExists | response : null`);
                return false; 
            }
            logger.debug(`BrokerInterface | brokerExists | response : ${JSON.stringify(response._id)}`);
            return true; 
        }catch(error) {
            logger.error(`BrokerInterface | brokerExists | ERROR : ${error}`); 
        }
    }

    static async createBet(bookId, bet) {
        try {
            logger.info(`BrokerInterface | createBet | 'book._id : ObjectId(${bookId}), bet : ${bet} ]`); 
            var response = await collection.updateOne(	
                { 'broker.books._id' : ObjectId(bookId) }, 
            { $push : { 'broker.books.$.bets' :  bet }}
            ); 
            logger.debug(`BrokerInterface | createBet | response : ${response}`);
            return response; 
        }catch(error) {
            logger.error(`BrokerInterface | createBet | ERROR : ${error}`); 
        }
    }

    static async fetchBook(bookId) {
        try {  
            logger.info(`BrokerInterface | fetchBook | broker.book._id : ObjectId("${bookId})`); 
            const book = await collection.aggregate([
                { $unwind : '$broker.books' },
                { $match : { 'broker.books._id' :  ObjectId(bookId) }},
                { $project : { _id : '$broker.books._id', created : '$broker.books.created', catagory : '$broker.books.catagory', 
                  text : '$broker.books.text', odds : '$broker.books.odds', isOpen : '$broker.books.isOpen', discordId : 'broker.d-uid' }}
            ]).toArray();
            return book[0]; 
        }catch(error) {
            logger.error(`BrokerInterface | fetchBook | ${error}`);
        }
    }

    static async fetchBooks(discordId) {
        try {
            logger.info(`BrokerInterface | fetchBooks | d-uid : ${discordId}`);
            const books = await collection.aggregate([ 
               { $match : { 'broker.d-uid' : discordId }},
               { $unwind : '$broker.books' }, 
               { $match : { 'broker.books.isOpen' : true }},
               { $project : { _id : '$broker.books._id', catagory : '$broker.books.catagory', 
                    text : '$broker.books.text', odds : '$broker.books.odds'}}
            ]).toArray();
            logger.debug(`BrokerInterface | fetchBooks | response : ${books}`); 
            return books; 
        }catch(error) {
            logger.error(`BrokerInterface | fetchBooks | ${error}`);  
        }
    }

    static async fetchOpenBooksByServer(serverId) {
        try {
            logger.info(`BrokerInterface | fetchOpenBooksByServer | broker.d-server : ${serverId}`)
            const response = await collection.aggregate([ 
                { $match : { $or : [{'broker.isGlobal' : true}, {'broker.d-server' : serverId }]}}, 
                { $unwind : '$broker.books' },
                { $match : { 'broker.books.isOpen' : true }},
                { $project : { _id : '$broker.books._id', text : '$broker.books.text', odds : '$broker.books.odds'}}
            ]).toArray();
            logger.debug(`BrokerInterface | fetchOpenBooksByServer | response ${JSON.stringify(response)}`);
            return response;
        }catch(error) {
            console.log(`BrokerInterface | fetchOpenBooksByServer | ERROR : ${error}`); 
        }
    }

    static async fetchBookWithBets(bookId) {
        try {
            logger.info(`BrokerInterface | fetchBooksWithBets | broker.books._id : ${bookId}`);
            const response = await collection.aggregate([
                { $match : { 'broker.books._id' : ObjectId(bookId) }},
                { $unwind : '$broker.books' },
                { $project : { catagory : '$broker.books.catagory', text : '$broker.books.text', 
                odds : '$broker.books.odds', bets : '$broker.books.bets' }},
                { $limit : 1}
            ]).toArray();
            logger.debug(`BrokerInterface | fetchBookWithBets | response : ${JSON.stringify(response[0])}`);
            return response[0]; 
        }catch(error){ 
            logger.error(`BrokerInterface | fetchBookWithBets | error : ${error}`); 
        }
    }

    static async fetchBetsByBook(bookId) {
        try {
            logger.info(`BrokerInterface | fetchBetsByBook | broker.books._id : ${bookId}`);
            const bets = await collection.aggregate([
                { $match : { 'broker.books._id' : ObjectId(bookId) }},
                { $unwind : '$broker.books' },
                { $unwind : '$broker.books.bets' },
                { $project : { discordId : '$broker.books.bets.d-uid', bet : '$broker.books.bets.amount', 
                    username : '$broker.books.bets.username', payout : '$broker.books.bets.payout' }}
            ]).toArray();
            return bets; 
        }catch(error) {
            logger.error(`BrokerInterface | fetchBetsByBook | ERROR : ${error}`); 
        }
    }

    static async createBroker(broker) { 
        try {
        logger.info(`BrokerInterface | create-broker | broker : { ${broker} }`);
            var exists = await this.brokerExists(broker.discordId); 
            logger.info(`Broker Exists :${exists}`);
            if(!exists){
                const insert = await collection.insertOne({ broker });
                logger.debug(`BrokerInterface | create-broker | response : ${insert} }`);
                return insert;
            }
        } 
        catch(error) { 
            logger.error(`BrokerInterface | create-broker | ERROR : ${error}`); 
        }
    }

    static async createBook(discordId, book){
        try {
            logger.info(`BrokerInterface | createBook | args : { d-uid : ${discordId}, book : ${JSON.stringify(book)}}`)
            const id = new ObjectId(); 
            book._id = id;
            const response = await collection.updateOne(
                { 'broker.d-uid' : discordId }, 
                { $push : { 'broker.books' : book }}
            );
            logger.debug(`BrokerInterface | createBook | response : "${response}"`);
            return id;
        }catch(error) {
            logger.error(`BrokerInterface | createBook | ERROR : ${error}`); 
        }
    }

    static async closeBook(discordId, bookId) {
        try {
            logger.info(`BrokerInterface | closeBook | args : { d-uid : ${discordId}, book._id : ObjectId(${bookId}) } `);
            var response = await collection.updateOne(
                 { 'broker.d-uid' : discordId, 'broker.books._id' : ObjectId(bookId)},
                 { $set : { 'broker.books.$.isOpen' :  false }}
                );
            logger.debug(`BrokerInterface | closeBook | response : ${response}`)
            return response; 
        }catch(error){ 
            logger.error(`BrokerInterface | closeBook | ERROR : ${error}`); 
        }
    }
}

module.exports = BrokerInterface;