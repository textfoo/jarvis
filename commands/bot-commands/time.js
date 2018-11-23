module.exports = { 
    name : 'time',
    description : 'returns time of bot server', 
    execute(message, args) {
        const now = new Date();
        message.channel.send(`Bot local time : ${now.toString()}`);
    }
}