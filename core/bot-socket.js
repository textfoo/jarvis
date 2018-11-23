const  { port } = require('../config/socket-config.json'); 
const fs = require('fs'); 
const WebSocket = require('ws'); 


class BotSocket {
    constructor() {
        this.commands = []; 
        this.wss = new WebSocket.Server({
            port : port
        });
    }

    loadCommands() {
        
    }
}



module.exports = BotSocket; 