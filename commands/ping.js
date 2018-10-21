module.exports = { 
    name : 'ping', 
    descirption : 'returns a echo if bot is online', 
    execute(message, args) { 
        message.reply(`Current latency to server : ${message.client.ping}ms`);
    }
};