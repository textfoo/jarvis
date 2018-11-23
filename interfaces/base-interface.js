const winston = require('winston'); 


class BaseInterface{
    constructor() {
        this.logger = winston.createLogger({
            level : 'info', 
            format : winston.format.json(),
            transports : [
                new winston.transports.File({ filename : 'error.log', level : 'error' }), 
                new winston.transports.file({ filename : 'combined.log'})
            ]
            
        });

        if(process.env.NODE_ENV !== 'production') { 
            this.logger.add(new winston.transports.Console({
                format : winston.format.simple()
            }));
        }
    }

    async writeLog(message) { 
        
    }
}