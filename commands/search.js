const axios = require('axios'); 
const ddg = "https://api.duckduckgo.com/?q="; 

module.exports = { 
    name : 'search', 
    description : 'searches the web for some text', 
    execute(message, args) { 
        console.log(`args : ${args}`);
        var query ='';
        if(args.length > 1) {
            args.forEach((a) => { 
                query += `${a} `;
            });
        }
        else if(args.length == 1){
            query = args;
        }
        
        var url = `${ddg}${query}&format=json`;
        console.log(url); 
        const getSearch = async url => {
            try{
                const response = await axios.get(url);
                const data = response.data; 
            
                console.log(data['RelatedTopics']);
                console.log(data['AbstractText']);
                if(data['AbstractText'] != undefined && data['AbstractText'] !== ''){ 
                    message.channel.send(data['AbstractText']);
                }
                if(data['RelatedTopics'].length !== 0) {
                    message.reply('Related Topics : ')
                    data['RelatedTopics'].forEach(function(topic) {
                        if(topic['Text'] != null) {
                                message.reply(topic['Text']);
                            }
                    });
                }
                if(data['RelatedTopics'].length === 0 && data['AbstractText'] === ''){
                    message.channel.send('No results found...');
                } 
            }
            catch(error) {
                message.reply(`Whoups!`);
                console.log(error);
            }
        }
        getSearch(url);
    }
}