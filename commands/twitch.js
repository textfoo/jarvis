const Twitch = require('../apis/twitch'); 
const twitch = new Twitch(); 
const axios = require('axios'); 

module.exports = { 
    name : 'twitch',
    description : 'exposes various twich api functions', 
    async execute(message, args) {
        switch(args[0]) { 
            case 'help' : await sendCommandList(); break; 
            case 'top' : await sendTopGames(); break;
            case 'streamers' : await(sendTopStreamers(args)); break;
        }


        async function sendCommandList() {
            try {
                let msg = 'twitch command list : \n top : exposes top games currently streamed on twitch. \n streamers : exposes top 5 featured streamers.' 
                await message.reply(msg);
            }catch(error) {
                console.log(error); 
            }
        }


        async function sendTopGames() {
            try {
                let data = await twitch.getTopGames(); 
                var msg = 'Top Games on Twitch : '; 
                data['data'].map(game => {
                     msg += `*${game.name}*, `
                });
                await message.channel.send(msg); 
            }catch(error) {

            }
        }

        async function sendTopStreamers(args) {
            const gameName = combineArgs(args);
            try { 
                let data = await twitch.getTopStreamers(gameName); 
                let msg = 'Featured streamers : \n';
                data['featured'].map(streamer => {
                    msg += `${streamer.stream.channel.display_name} is playing ${streamer.stream.game}. ${streamer.stream.viewers} current viewers watching. \n <${streamer.stream.channel.url}> \n\n`; 
                });
                
                await message.channel.send(msg);
            }catch(error) {
                console.log(error);
            }
        }

         function combineArgs(args) { 
            var response = ''; 
            if(args.length <= 2) { 
                return `${args[1]}`;
            }
            for(var i = 1; i < args.length; i++) {
                response += `${args[i]} `;
            }
            return response.trim();
        }
    }


}
