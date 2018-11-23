const { connectionString } = require('../config/db-config.json');
const asset = require('asset'); 

const MongoClient = require('mongodb').MongoClient; 

class MongoDB {
    constructor(dbName) { 
        this.dbName = dbName; 
        MongoClient.connect(connectionString, (error, client) => {
            asset.equal(null, error); 
            this.db = client.db(dbName); 
        }); 
    }
}

module.exports = MongoDB; 