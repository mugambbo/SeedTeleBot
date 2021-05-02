if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
process.env["NTBA_FIX_319"] = 1;
const TelegramBot = require('node-telegram-bot-api');
const http = require('http');
const port = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
  res.statusCode = 200;
  const msg = 'Project SEED!\n'
  res.end(msg);
});


const BANNABLE_WORDS = [
  "fake",
  "scam",
  "shitcoin",
  "scammer"
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
      const until = match[2];
      const userId = msg.from.id;
      const banUserId = msg.entities[1].user.id;
      console.log("Username to mute: "+username);
      console.log("Mute match: "+match);
  
      bot.getChatAdministrators(chatId).then(resp => {
        resp.forEach((val, index) => {
          if (val.user.id == userId){ //if this user is an admin
                bot.restrictChatMember(chatId, banUserId, {"until_date": (until || (new Date().getMilliseconds + 24)) * 3600000}).then(res => {
                  console.log("Member restricted: "+banUserId);
                }).catch(err => {
                  console.log("Could not mute user: "+err);
                });
              }
            });
        });
    })  
  
    //Send me the logo
    bot.onText(/\/photo (.+)/, (msg, match) => {
      const chatId = msg.chat.id;
      const url = `https://source.unsplash.com/1600x900/?${match[1]}`;
      bot.sendPhoto(chatId, url).then(res => {
        console.log("Photo sent");
      }).catch(err => {
        console.log("Could not find photo: "+err);
        bot.sendMessage(chatId, "Could not find photo: "+err);
      });
    })
  
    // Listen for any kind of message. There are different kinds of messages.
    bot.on('message', (msg) => {
      console.log(msg);
      if (msg.text) {
        const chatId = msg.chat.id;
        const words = msg.text.toLowerCase().replace(/[^a-zA-Z ]/g, "").split(" ");
        console.log("Words probably bannable: "+words);
        words.some((word) => {
          if (BANNABLE_WORDS.includes(word)){
            console.log("Bannable word found: "+word);
            deleteMessage(bot, msg);
            return true;
          }
        });
  
        if (msg.text.toLowerCase().trim().includes("@seedworldbot")) {
          const message = `Hi ${msg.from.username}, how may I help you? Check out what I can do:\n1. Ban a user from a group chat (only by admin). e.g. '/ban @SeedWorldBot'\n2. Unban a user from a group chat (only by admin) e.g. '/unban @SeedWorldBot'\n3. Display random photo based on a search term e.g. '/photo bitcoin'\n4. Mute a user from a group chat for x hours (only by admin) e.g. '/mute @SeedWorldBot 2'\n4. Delete new chat member messages (automatic)\n5. Delete censored messages containing specified words (automatic)`;
          bot.sendMessage(chatId, message);
        }  
      }
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

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    setupTelegramBot(); //Execute telegram bot
  });