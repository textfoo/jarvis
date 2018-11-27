const BrokerInterface = require('../../interfaces/broker-interface'); 
const ArgumentParser = require('../../utility/argument-parser');
const WallterInterface = require('../../interfaces/wallet-interface'); 

const Logger = require('../../utility/logger');
const logger = new Logger(); 

const ss = '℈'; 

module.exports = { 
    name : 'broker',
    description : 'exposes broker functionality, creating bets, setting wallets, ect.',
    async execute(message, args) {
        if(args[0] === undefined) {
            await myBooks(message); 
            return;
        }

        switch(args[0]) {
            //case 'my-bets' : await myBets(message); break; 
            case 'books' : await fetchOpenBooksByServer(message); break; 
            case 'book' : await fetchBook(message, args[1]); break; 
            case 'action' : await getAction(message, args[1]); break; 
            case 'create-broker' : await createBroker(message, args); break;
            case 'create-book' : await createBook(message, args); break; 
            case 'create-bet' : await createBet(message, args); break; 
            case 'close-book' : await closeBook(message, args); break;
            case 'tutorial' : await tutorial(message); break; 
        }

        async function fetchOpenBooksByServer(message) {
            try {
                logger.info(`bot-commands | fetchOpenBooksByServer | args : {}`);
                const books = await BrokerInterface.fetchOpenBooksByServer(message.guild.id);
                logger.info(`bot-commands | fetchOpenBooksByServer | response : ${JSON.stringify(books)}`);
                books.forEach(async (book) => {
                    await message.reply(`
                    Book Id : ${book._id},
                    ${book.text},
                    Odds : ${book.odds}`);
                });
            }catch(error){ 
                logger.error(`bot-commands | broker.js | fetchOpenBooksByServer | ERROR : ${error}`);
            }
        }

        async function fetchBook(message, bookId) {
            try {
                logger.info(`bot-commands | fetchBook | bookId : ${bookId}`);
                if(bookId != null) {
                    const book = await BrokerInterface.fetchBookWithBets(bookId); 
                    logger.info(`bot-commands | fetchBook | fetchBookWithBets | book : ${JSON.stringify(book)}`);
                    let betText = ''; 
                    let brokerTotal = 0; 
                    let payoutTotal = 0;
                    if(book != null) {
                        if(book.bets.length >0 ) {
                            for(var i = 0; i < book.bets.length; i++) {
                                brokerTotal = parseInt(brokerTotal) + parseInt(book.bets[i].amount);
                                payoutTotal = parseInt(payoutTotal) + parseInt(book.bets[i].payout);
                                betText += `${book.bets[i].username} bet ${ss}${book.bets[i].amount} | payout : ${ss}${book.bets[i].payout}
                                `;
                            }
                        }
                        await message.reply(`
                            ${book.text}  
                            Catagory : ${book.catagory}
                            Odds : ${book.odds}
                            Bets :
                                ${betText}
                                Payout across all bets : ${ss}${payoutTotal}
                                Broker potential payout : ${ss}${brokerTotal}
                            `);
                            return; 
                    }
                }
                await message.reply(` please supply a valid book-id`); 
                return; 
            }catch(error) {
                logger.error(`bot-commands | broker.js | fetchBook | ERROR : ${error}`); 
            }
        }

        async function myBooks(message) {
            try {
                logger.info(`bot-commands | broker.js | myBooks | args : []`);
                const response = await BrokerInterface.fetchBooks(message.author.id); 
                if(response == null ) {
                    await message.reply('No results found'); 
                    return;
                }
                
                let queue = []; 
                for(var i = 0; i < response.length; i++) {
                    queue.push(`
                    Catagory : ${response[i].catagory}
                    Book Id : ${response[i]._id} 
                    ${response[i].text}
                    Odds : ${response[i].odds}
                    `);
                    if(queue.length % 2) {
                        queue.forEach(async (x) => {
                            await message.author.send(x); 
                        });
                    }
                    queue = [];
                }
                if(queue.length != 0) {
                    await message.author.send(queue[0]); 
                }
            }catch(error) {
                logger.error(`bot-commands | broker.js | myBooks | ERROR : ${error}`); 
            }
        }

        async function getAction(message, bookId) {
            try {
                logger.info(`bot-commands | broker.js | getAction | bookId : ${bookId} `);
                const response = await BrokerInterface.fetchBetsByBook(bookId); 
                
                if(response == null | response.length == 0) {
                    await message.reply(' no results found.');
                    return;
                }
                logger.debug(`bot-commands | broker.js | getAction | fetchBetsByBook | response ${JSON.stringify(response)}`);
                let actionMsg = ``;
                for(var i =0; i < response.length; i++) {
                    actionMsg += `${response[i].username} has bet ${ss}${response[i].bet}, winning payout : ${ss}${response[i].payout}
                    `;
                }
                await message.channel.send(`${actionMsg}`);
                return;
            }catch(error) {
                logger.error(`bot-commands | broker.js | getAction | ERROR : ${error}`); 
            }
        }

        async function createBroker(message, args) {
            try{
                logger.info(`bot-commands | broker.js | createBroker | args : [ ${args} ]`);
                args[1] = args[1] || '';
                const dId = args[1].substring(2, args[1].length -1) || message.author.id;
                const usn = message.guild.members.get(dId).user.username;

                var response = await BrokerInterface.createBroker({
                    'd-uid' : dId,
                    'username' : usn,
                    'd-server' : message.guild.id, 
                    'ref-id' : message.author.id,
                    'isGlobal' : args[2] || false,
                    'books' : []
                }); 
                if(response == null) {
                    await message.channel.send(`User ${usn} is already a broker in the system.`);
                    return; 
                }
                await message.channel.send(`User ${usn} is now a registered broker!`); 
                return;

            }catch(error) {
                logger.error(`bot-commands | broker.js | createBroker | ERROR : ${error}`);
            }
        }

        async function createBook(message, args) {
            try {
                logger.info(`bot-commands | broker.js | createBook | args : [ ${args}]`);
                const parsedArgs = ArgumentParser.parse(args, '--'); 
                const discordId = message.author.id; 
                const book = {
                    '_id' : '', 
                    'created' : new Date(), 
                    'catagory' : parsedArgs['--c'] || parsedArgs['--C'] || parsedArgs['--catagory'] || 'Unknown',
                    'text' : parsedArgs['--t'] || parsedArgs['--T'] || parsedArgs['--text'] || 'No text provided',
                    'description' : parsedArgs['--d'] || parsedArgs['--D'] || parsedArgs['--description'] || 'No description provided', 
                    'odds' : parsedArgs['--o'] || parsedArgs['--O'] || parsedArgs['--odds'] || '1:1',
                    'isOpen' : true,
                    'bets' : []
                };
                const response = await BrokerInterface.createBook(discordId, book);
                if(response == null ) {
                    await message.channel.send(` unable to create book. Please contact a global broker or check your input.`);
                    return; 
                }
                logger.debug(`bot-commands | broker.js | createBook | response : ${response}`);
                await message.channel.send(`Book ${response} has been created.`);
                return; 

            }catch(error) {
                logger.error(`bot-commands | broker.js | createBook | ERROR :${error}`);
            }
        }
        //refactored 11/24/2018
        async function createBet(message, args) {
            try {
                logger.info(`bot-commands | broker.js | createBet | args : [ ${args} ]`); 
                const parsedArgs = ArgumentParser.parse(args, '--'); 
                const bookId = parsedArgs['--b'] || parsedArgs['--book-id']; 
                const amount = parsedArgs['--a'] || parsedArgs['--amount'];

                if(bookId != null) {
                    const balance = await WallterInterface.fetchBalance(message.author.id); 
                    if(balance.bal >= parseInt(amount)) {
                        const book = await BrokerInterface.fetchBook(bookId);
                        if(book.isOpen == true) {
                                const payout = determinePayout(book.odds, amount); 
                                console.log(`payout : ${payout}`); 
                                let bet = {
                                    '_id' : '',
                                    'd-uid' : message.author.id, 
                                    'username' : message.author.username, 
                                    'amount' : parseInt(amount),
                                    'payout' : parseInt(payout)
                                }
                                const response = await BrokerInterface.createBet(bookId, bet);
                                if (response != null) {
                                    await WallterInterface.removeFunds(message.author.id, amount); 
                                    await message.reply(` bet created. Payout : ${payout}`);
                                    
                                }
                            return; 
                        }
                        logger.info(`bot-commands | broker.js | createBet | response : { "message" : "bal = ${parseInt(balance.bal) - parseInt(amount)}" }`);
                        await message.reply(` this book is currently closed.`); 
                        return;
                    }
                    logger.info(`bot-commands | broker.js | createBet | response : { "message" : "book.isOpen : ${book.isOpen}"}`)
                    await message.reply(` your wallet has insufficient funds for your bet amount.`);
                    return; 
                }
                logger.info(`bot-commands | broker.js | createBet | response : { "message" : "bookId" : null }`);
                await message.reply(` I was unable to locate that book.`);
                return; 
                
            }catch(error) {
                logger.error(`bot-commands | broker.js | createBet | ERROR : ${error}`); 
            }
        }

        
        async function closeBook(message, args) {
            try {
                logger.info(`bot-commands | broker.js | closeBet | args : [ ${args} ]`);
                const parsedArgs = ArgumentParser.parse(args, '--'); 

                const payout = parsedArgs['--p'] || parsedArgs['--payout'] || parsedArgs['--win'] || false; 
                const bookId = parsedArgs['--b'] || parsedArgs['--book-id']; 

                const closeRes = await BrokerInterface.closeBook(message.author.id, bookId); 
                logger.info(`bot-commands | broker.js | closeBook | interface.closeBook | response : ${closeRes}`);

                const bets = await BrokerInterface.fetchBetsByBook(bookId);
                logger.info(`bot-commands | broker.js | closeBook | interface.fetchBetsByBook | response : ${bets || 'null' }`);

                let total = parseInt(0); 
                if(closeRes.toJSON().nModified == 1) {
                   if(payout == true | payout == 'true') {
                       for(var i =0; i < bets.length; i++) {
                           total = parseInt(total) + parseInt(bets[i].payout); 
                           await WallterInterface.addFunds(bets[i].discordId, bets[i].payout); 
                       }
                       logger.info(`bot-commands | broker.js | closeBook | response : { "bets.length" : ${bets.length},  }`);
                       await message.reply(` ${bets.length} bets paid out with a total of ${ss}${total} funds distributed.`);
                       return;  
                   }
                   if(payout == false) {
                       for(var i =0 ; i < bets.length; i++){
                          total = parseInt(total) + parseInt(bets[i].bet); 
                       }
                       if(total != 0) {
                        await WallterInterface.addFunds(discordId, total); 
                        await message.reply( `book is closed. A total of ${total} has been deposited into your account.`); 
                        return; 
                       }
                       await message.reply(` book has been closed`);
                       return; 
                   }
                }
                await message.reply(` you are not permitted to close this book.`);
                return;
                
            }catch(error){
                logger.error(`bot-commands | broker.js | createBet | ERROR : ${error}`);
            }
        }

        
        function determinePayout(odds, amount) {
            try {
                logger.info(`bot-commands | broker.js | determinePayout | odds : ${odds}, amount : ${amount}`); 
                const split = odds.split(':'); 
                const y = split[0]; 
                const b = split[1]; 
                if(y > b) {
                    const evaluation = (parseInt(amount) * parseInt(y))
                    return parseInt(evaluation) + parseInt(amount);
                }
                if(b > y) {
                    const evaluation = (Math.round(parseInt(amount) / parseInt(b))) 
                    console.log(`${evaluation}`);
                    return parseInt(evaluation) + parseInt(amount); 
                }
                if(y == b) {
                    return parseInt(amount) * 2; 
                }
                return 0; 
            }catch(error) {
                logger.error(`bot-comands | broker.js | determinePayout | ERROR : ${error}`);
            }
        }

        async function tutorial(message) { 
            try {
                logger.info(`bot-commands | broker.js | tutorial |`);
                await message.author.send(`
                *Tutorial*  : 
                Command Listing :
                'my-bets' NOT WORKING YET
                    Shows you the current bets you have across all books
                'create-broker' @username 
                    Allows you to create a broker on the server (you can do this yourself).
                'books' 
                    Shows you the open books on the server
                'book' [book id]
                    shows you the details of a book as well as the bets that have been made. 
                'action' --b [book id] 
                    Shows you the bets folks have put on particiular books 
                'create-book' --t [text] --o [odds] --d [description] --c [catagory]
                    Allows you to create a book for others to bet against 
                'create-bet' --b [book id] 
                    Allows you to place a bet on a current book
                'close-book' --b [book id] --payout [true] 
                    Allows you to close out a book and payout all bets if necessary
                'tutorial' : //You are here... 
                
                *Examples*  :
                1. To get started betting you'll need to create a wallet... 
                        !wallet open
                This deposits some ${ss} to get you going. 
                2. If you want to allow others to place bets on your predictions, you'll need to register yourself as a broker.
                        !broker create-broker @yourusername
                3. Now that you're a broker you'll need to create a book for others to bet against : 
                    !broker create book --t Test Text  --o 4:1 --c Gaming --d This is an example book
                4. To see the bets currently available on the server :
                    !broker create book --t Test Text  --o 4:1 --c Gaming --d This is an example book
                5. To place a bet on a ${ss}400 bet on book 5be9f926de17f05514d734cf : 
                        !broker create-bet --b 5be9f926de17f05514d734cf --a 400
                `);
            }catch(error) {
                logger.error(`bot-commands | broker.js | tutorial | ERROR : ${error}`);
            }
        }
    }
}