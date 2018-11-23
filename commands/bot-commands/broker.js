const BrokerInterface = require('../../interfaces/broker-interface'); 
const ArgumentParser = require('../../utility/argument-parser');
const WallterInterface = require('../../interfaces/wallet-interface'); 

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
            case 'my-bets' : await myBets(message); break; 
            case 'books' : await fetchOpenBooksByServer(message); break; 
            case 'book' : await fetchBook(message, args[1]); break; 
            case 'action' : await getAction(message, args[1]); break; 
            case 'create-broker' : await createBroker(message, args); break;
            case 'create-book' : await createBook(message, args); break; 
            case 'create-bet' : await createBet(message, args); break; 
            case 'close-book' : await closeBook(message, args); break;
            case 'purge-closed' : await purgeBook(message, args); break; 
            case 'tutorial' : await tutorial(message); break; 
        }

        async function fetchOpenBooksByServer(message) {
            try {
                const serverId = message.guild.id; 
                const response = await BrokerInterface.fetchOpenBooksByServer(serverId);
                response.forEach((book) => {
                    message.reply(`
                    Book Id : ${book._id}
                    ${book.text}
                    Odds : ${book.odds}
                    `);
                }); 
            }catch(error){ 
                console.log(error);
            }
        }

        async function fetchBook(message, bookId) {
            try {
                let discordId = message.author.id; 
                if(bookId != null) {
                    let book = await BrokerInterface.fetchBookWithBets(discordId, bookId); 
                    let betText = ''; 
                    let total = 0; 
                    if(book != null) {
                        for(var i = 0; i < book.bets.length; i++) {
                            total = parseInt(total) + parseInt(book.bets[i].payout);
                            betText += `${book.bets[i].username} bet ${ss}${book.bets[i].amount} | payout : ${ss}${book.bets[i].payout}
                            `;
                        }
                            await message.reply(`
                            Catagory : ${book.catagory}
                            Summary : ${book.text}
                            Odds : ${book.odds}
                            Bets :
                            ${betText}
                            Payout across all bets : ${ss}${total}
                            `);
                            return; 
                    }
                    await message.reply(` could not find that book.`); 
                    return; 
                }
                await message.reply(` please supply a valid book-id`); 
                return; 
            }catch(error) {
                console.log(error); 
            }
        }

        async function myBooks(message) {
            try {
                const discordId = message.author.id; 
                const response = await BrokerInterface.fetchBooks(discordId); 
                if(response == null ) {
                    message.channel.reply('No results found'); 
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
                        queue.forEach(x => {
                            message.author.send(x); 
                        });
                    }
                    queue = [];
                }
                if(queue.length != 0) {
                    await message.author.send(queue[0]); 
                }
            }catch(error) {
                console.log(error); 
            }
        }

        async function getAction(message, bookId) {
            try {
                const serverId = message.guild.id;
                const response = await BrokerInterface.fetchBetsByBook(serverId, bookId); 
                if(response == null | response.length == 0) {
                    message.reply(' no results found.');
                    return;
                }
                response.forEach((bet) => {
                    message.channel.send(`
                    ${bet.username} has bet ${ss}${bet.bet}, winning payout : ${ss}${bet.payout}.
                    `);
                });
            }catch(error) {
                console.log(error); 
            }
        }
        //TODO : Refactor this mess.
        async function createBroker(message, args) {
            try{
                console.log(`args2 : ${args[2]}`);
                let discordId = message.author.id; 
                let referralId = null; 
                let isGlobal = false; 
                if(args[1] != null) {
                    discordId = args[1].substring(2, args[1].length -1);
                    referralId = message.author.id; 
                }
                if(args[2] != null) {
                    isGlobal = true;
                }
                const serverId = message.guild.id; 
                const  username = message.guild.members.get(discordId).user.username; 
                var response = await BrokerInterface.createBroker(discordId, serverId, username, referralId, isGlobal); 
                console.log(`response : ${response}`);
                if(response == null) {
                    message.channel.send(`User ${username} is already a broker in the system.`);
                    return; 
                }
                message.channel.send(`User ${username} is now a registered broker!`); 
                return;
            }catch(error) {
                console.log(error);
            }
        }

        async function createBook(message, args) {
            try {
                const parsedArgs = ArgumentParser.parse(args, '--'); 
                const discordId = message.author.id; 
                const book = {
                    '_id' : null, 
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
                    message.channel.send(` unable to create book. Please contact a global broker or check your input.`)
                }
                await message.channel.send(`Book ${response} has been created.`);

            }catch(error) {
                console.log(error);
            }
        }

        async function createBet(message, args) {
            try {
                const parsedArgs = ArgumentParser.parse(args, '--'); 
                console.log(parsedArgs); 
                const discordId = message.author.id; 
                const username = message.author.username; 
                const bookId = parsedArgs['--b'] || parsedArgs['--book-id']; 
                const amount = parsedArgs['--a'] || parsedArgs['--amount'];
                console.log(`bookId : ${JSON.stringify(bookId)}`);
                if(bookId != null) {
                    const balance = await WallterInterface.fetchBalance(discordId); 
                    console.log(`balance : ${balance.bal}`);
                    if(balance.bal >= parseInt(amount)) {
                        const book = await BrokerInterface.fetchBook(bookId);
                        console.log(JSON.stringify(book));
                        console.log(`book is open : ${book.isOpen} | ${book['isOpen']}`);
                        if(book.isOpen == true) {
                                const payout = determinePayout(book.odds, amount); 
                                console.log(`payout : ${payout}`); 
                                const bet = {
                                    'd-uid' : discordId, 
                                    'username' : username, 
                                    'amount' : parseInt(amount),
                                    'payout' : parseInt(payout)
                                }
                                const response = await BrokerInterface.createBet(bookId, bet);
                                if (response != null) {
                                    await message.reply(` bet created. Payout : ${payout}`);
                                    await WallterInterface.removeFunds(discordId, amount); 
                                }
                            return; 
                        }
                        await message.reply(` this book is currently closed.`); 
                        return;
                    }
                    await message.reply(` your wallet has insufficient funds for your bet amount.`);
                    return; 
                }
                await message.reply(` I was unable to locate that book.`);
                return; 
                
            }catch(error) {
                console.log(error); 
            }
        }

        
        async function closeBook(message, args) {
            try {
                const discordId = message.author.id;  
                const serverId = message.guild.id;
                const parsedArgs = ArgumentParser.parse(args, '--'); 

                console.log(JSON.stringify(parsedArgs));
                const payout = parsedArgs['--p'] || parsedArgs['--payout'] || parsedArgs['--win'] || false; 
                const bookId = parsedArgs['--b'] || parsedArgs['--book-id']; 

                const response = await BrokerInterface.closeBook(discordId, bookId); 
                console.log(` close response : ${response.toJSON().nModified} type : ${typeof response}`);
                console.log(`server Id : ${serverId} | bookId : ${bookId}`);
                const bets = await BrokerInterface.fetchBetsByBook(serverId, bookId);
                console.log(`bets count : ${JSON.stringify(bets.length)}`);
                let total = parseInt(0); 
                if(response.toJSON().nModified == 1) {
                   if(payout == true | payout == 'true') {
                       for(var i =0; i < bets.length; i++) {
                           console.log(JSON.stringify(`bet : ${bets[i]}`));
                           total = parseInt(total) + parseInt(bets[i].payout); 
                           await WallterInterface.addFunds(bets[i].discordId, bets[i].payout); 
                       }
                       await message.reply(` ${bets.length} bets paid out with a total of ${total}`);
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
                console.log(error);
            }
        }

        
        function determinePayout(odds, amount) {
            const split = odds.split(':'); 
            const y = split[0]; 
            const b = split[1]; 
            if(y > b) {
                const eval = (parseInt(amount) * parseInt(y))
                return parseInt(eval) + parseInt(amount);
            }
            if(b > y) {
                
                const eval = (Math.round(parseInt(amount) / parseInt(b))) 
                console.log(`${eval}`);
                return parseInt(eval) + parseInt(amount); 
            }
            if(y == b) {
                return parseInt(amount) * 2; 
            }
            return 0; 
        }

        async function tutorial(message) { 
            try {
                await message.author.send(`
                *Tutorial*  : 
                Command Listing :
                'my-bets' NOT WORKING YET
                    Shows you the current bets you have across all books
                'books' 
                    Shows you the open books on the server
                'book' [book id]
                    shows you the details of a book as well as the bets that have been made. 
                'action' --b [book id] 
                    Shows you the bets folks have put on particiular books 
                'create-broker' @username 
                    Allows you to create a broker on the server (you can do this yourself).
                'create-book' --t [text] --o [odds] --d [description]
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
                3. To see the bets currently available on the server :
                        !broker books
                4. To place a bet on a ${ss}400 bet on book 5be9f926de17f05514d734cf : 
                        !broker create-bet --b 5be9f926de17f05514d734cf --a 400
                `);
            }catch(error) {

            }
        }
    }
}