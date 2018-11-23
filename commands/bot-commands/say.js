module.exports ={ 
    name : 'say',
    description : 'says text back', 
    async execute(message, args) {
        var msg = ''; 
        for(var i = 0; i < args.length; i++){
            msg += ` ${args[i]}`;
        }
        await message.channel.send(msg);
    }
}