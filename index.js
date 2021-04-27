if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const TelegramBot = require('node-telegram-bot-api');


const BANNABLE_WORDS = [
  "fake",
  "scam"
]

/**
 * Setup Telegram bot 
 * @param val 
 * @returns 
 */
 function setupTelegramBot(){
    const token = process.env.TELE_TOKEN;
    // Create a bot that uses 'polling' to fetch new updates
    const bot = new TelegramBot(token, {polling: true});
  
    // Matches "/echo [whatever]"
    bot.onText(/\/echo (.+)/, (msg, match) => {
      // 'msg' is the received Message from Telegram
      // 'match' is the result of executing the regexp above on the text content
      // of the message
  
      const chatId = msg.chat.id;
      const resp = match[1]; // the captured "whatever"
  
      // send back the matched "whatever" to the chat
      bot.sendMessage(chatId, resp);
    });
  
  
    //Ban a user
    bot.onText(/\/ban (.+)/, (msg, match) => {
      const chatId = msg.chat.id;
      const username = match[1];
      const userId = msg.from.id;
      const banUserId = msg.entities[1].user.id;
      console.log("Username to ban: "+username);
  
      bot.getChatAdministrators(chatId).then(resp => {
        console.log("Administrators");
        console.log(resp); //array of chat admins
        resp.forEach((val, index) => {
          if (val.user.id == userId){
            console.log("Action is from an admin, go ahead to ban");
            bot.kickChatMember(chatId, String(banUserId)).then(res => {
              console.log("Member banned");
            }).catch(err => {
              console.log("Could not ban user: "+err);
            });
          }
        });
      });
    });
  
    //Unban a user
    bot.onText(/\/unban (.+)/, (msg, match) => {
      const chatId = msg.chat.id;
      console.log(msg);
  
      const username = match[1];
      const usernameClean = username.substring(1);
      const userId = msg.from.id;
      const banUserId = msg.entities[1].user.id;
      console.log("Username to unban: "+username);
  
      bot.getChatAdministrators(chatId).then(resp => {
        console.log(resp); //array of chat admins
        resp.forEach((val, index) => {
          if (val.user.id == userId){
            bot.unbanChatMember(chatId, banUserId).then(res => {
              console.log("Member unbanned: "+userId);
            }).catch(err => {
              console.log("Could not unban user: "+err);
            });
          }
        });
      });
    }) 
  
    //Mute a user
    bot.onText(/\/mute (.+)/, (msg, match) => {
      const chatId = msg.chat.id;
      console.log(msg);
      const username = match[1];
      const userId = msg.from.id;
      const banUserId = msg.entities[1].user.id;
      console.log("Username to mute: "+username);
  
      bot.getChatAdministrators(chatId).then(resp => {
        resp.forEach((val, index) => {
          if (val.user.id == userId){ //if this user is an admin
                bot.restrictChatMember(chatId, banUserId).then(res => {
                  console.log("Member restricted: "+banUserId);
                }).catch(err => {
                  console.log("Could not mute user: "+err);
                });
              }
            });
        });
    })  
  
    //Send me the logo
    bot.onText(/\/logo/, (msg, match) => {
      const chatId = msg.chat.id;
      bot.sendPhoto(chatId, "https://picsum.photos/200/300").then(res => {
        console.log("Logo sent");
      }).catch(err => {
        console.log("Could not find logo: "+err);
        bot.sendMessage(chatId, "Could not find logo: "+err);
      });
    })
  
    // Listen for any kind of message. There are different kinds of messages.
    bot.on('message', (msg) => {
      console.log(msg);
      const words = msg.text.toLowerCase().replace(/[^a-zA-Z ]/g, "").split(" ");
      console.log("Words probably bannable: "+words);
      words.some((word) => {
        if (BANNABLE_WORDS.includes(word)){
          console.log("Bannable word found: "+word);
          deleteMessage(bot, msg);
          return true;
        }
      })
    });  
  
    bot.on('new_chat_members', (msg, match) => {
      deleteMessage(bot, msg);
    }); 

    bot.on("polling_error", console.log);
  }
  
  function deleteMessage(bot, msg){
    const msgId = msg.message_id;
    const chatId = msg.chat.id;
    bot.deleteMessage(chatId, String(msgId)).then(resp => {
      console.log("Message Deleted: "+JSON.stringify(resp));
    }).catch(err => {
      console.log("Error deleted message: "+err);
    });       
  }
  
  setupTelegramBot(); //Execute telegram bot