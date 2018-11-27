const { prefix, token } = require('../config/config.json'); 
const fs = require('fs'); 
const Discord = require('discord.js'); 
const BotSocket = require('./bot-socket.js'); 
const client = new Discord.Client(); 
const bs = new BotSocket(); 

const Logger = require('../utility/logger');
const logger = new Logger(); 

class Bot {
    constructor() {
        logger.info('Loading Bot...'); 
        this.client = client; 
        this.bs = bs; 
        this.loadCommands(); 
        //this.configureSocketServer(); 
        this.client.on('message', message => this.msg(message)); 
        //this.client.on('presenceUpdate', (oldMember, newMember) => this.presence(oldMember, newMember));
        this.client.on('ready', this.ready); 
        this.client.login(token);
    }

    ready() {
        logger.info('Bot Status : ready');
    }

    configureSocketServer() { 
        this.bs.loadCommands(); 
        this.bs.wss.on('connection', (ws, req) => {
            console.log(`client connected via : ${req.connection.remoteAddress}`)
        }); 

        this.bs.wss.on('close', () => {
            console.log(`
            client disconnected.
            current listeners : ${this.bs.wss.listenerCount}
            `);
        });
    }

    presence(oldMember, newMember) {
        console.log('presence update'); 
        console.log(oldMember); 
        console.log(newMember); 
    }

    msg(message) {
        if(!message.content.startsWith(prefix) || message.author.bot) return;
        
        const args = message.content.slice(prefix.length).split(/ +/);
        const command = args.shift().toLowerCase();

        if(command == 'cmds') {
            this.client.commands.forEach((cmd) => {
                message.channel.send(`${cmd.name} | ${cmd.description}`);
            });
            return; 
        }

        if(!client.commands.has(command)) return; 
        
        try{
            client.commands.get(command).execute(message, args);
        }
        catch(error){
            logger.error(error); 
        }
    }

    loadCommands(){
        logger.info(`Loading Client Commands`);
        this.client.commands = new Discord.Collection();
        const commandFiles = fs.readdirSync('./commands/bot-commands').filter(file => file.endsWith('.js')); 
        logger.info(`Loading ${commandFiles.length} command files...`)
        for(const file of commandFiles){
            const command = require(`../commands/bot-commands/${file}`); 
            this.client.commands.set(command.name, command); 
        }
    }
}

module.exports = Bot; 