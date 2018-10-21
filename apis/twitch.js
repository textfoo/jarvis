const axios = require('axios'); 
const {twitchId, twitchSecret,twitchRedirect } = require('../config/config.json'); 

class Twitch {
    constructor() { 
        this.baseUrl = "https://api.twitch.tv/helix/";
        this.requestHeaders = {
            headers : { 'Client-ID': 'e6c9jlukmwekqgzfxe35u4rp36hjyo' }
        }
    }

        async getTopGames() {
            const url = `https://api.twitch.tv/helix/games/top`;
            try {
                 let response = await axios.get(url, this.requestHeaders);
                 return response.data;
            } catch(error) {
                return error; 
            }
        }

        async getTopStreamers(gameName) {
            const url = `https://api.twitch.tv/kraken/streams/featured?limit=5`;
            try {
                let response = await axios.get(url, this.requestHeaders);
                return response.data; 
            }catch(error) {
                return error; 
            }
        }

        async getStreamLink() {
            const url = `https://api.twitch.tv/kraken/streams/`; 
            try {
                let response = await axios.get(url, this.requestHeaders); 
                return response.data;
            }catch(error) {
                return error; 
            }

        }
    }
module.exports = Twitch;