'use strict'; 
//const { createLogger, format, transports } = require('winston');
const winston = require('winston');  
const fs = require('fs'); 
const path = require('path'); 

const env = process.env.NODE_ENV || 'developent'; 
let logDir = path.join(__dirname + '/../logs', 'logfile.log');  

class Logger {
    constructor() {
        this.logger = winston.createLogger({
            levels : winston.config.syslog.levels,
            format : winston.format.timestamp({ format : 'YYYY-MM-DD HH:mm:ss' }),
            transports : [
                new winston.transports.Console({
                    level : 'debug', 
                    format: winston.format.combine(
                        winston.format.colorize(),
                        winston.format.printf(
                            info => `${info.timestamp} ${info.level} : ${info.message}`
                        )
                    )
                }),
                new winston.transports.File({
                    level : 'error',
                    filename : logDir, 
                    format: winston.format.json()
                }),
            ]
        })
    }

    info(message) {
       this.logger.info(message);
    }

    debug(message) {
        this.logger.debug(message);
    }

    error(error) {
        this.logger.error(error);
    }
}

module.exports = Logger;