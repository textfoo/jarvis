const { prefix, token } = require('../config/config.json'); 
const Discord = require('discord.js'); 
const client = new Discord.Client(); 
const fs = require('fs'); 

class Bot {
    constructor() {
        this.cmdList = [];
        this.client = client; 
        this.loadCommands(); 
        this.client.on('message', message => this.msg(message)); 
        this.client.on('ready', this.ready); 
        this.client.login(token);
    }

    ready() {
        console.log('bot status : ready');
    }

    msg(message) {
        console.log(`${message.author.username} : ${message.content}`); 
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
            console.log(`executing cmd : ${command}`)
            client.commands.get(command).execute(message, args);
        }
        catch(error){
            console.error(error); 
            message.reply('whoups');
        }
    }

    loadCommands(){
        this.client.commands = new Discord.Collection();
        const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js')); 
        for(const file of commandFiles){
            const command = require(`../commands/${file}`); 
            console.log(`loading cmd : ${command.name}`)
            this.client.commands.set(command.name, command); 
        }
    }
}

module.exports = Bot; 