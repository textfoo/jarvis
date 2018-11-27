const Logger = require('./utility/logger');
const logger = new Logger(); 

const Bot = require('./core/bot-core'); 

logger.info(`
    -=Application Start =-
`);

const bot = new Bot(); 