import * as dotenv from 'dotenv'
import TelegramBot from 'node-telegram-bot-api'
import { ChatGPTAPI } from 'chatgpt'

dotenv.config()

const { token, apiKey, group_name } = process.env
const prefix = group_name ? '/' + group_name : '/gpt'
const bot = new TelegramBot(token, { polling: true });
console.log(new Date().toLocaleString(), '--Bot has been started...');

//completion参数可调
//const completionParams = {
  //model: 'text-davinci-003',
  //temperature: 0.7,
  //presence_penalty: 0.6
//}
const currentDate = new Date().toISOString().split('T')[0]
const api = new ChatGPTAPI({
  apiKey,
  debug: false,
  systemMessage: `You are ChatGPT, a large language model trained by OpenAI. knowledge cutoff: 2021-09. \nCurrent date: ${currentDate}\n`,
  //completionParams,
  //maxModelTokens: 4096,
  //maxResponseTokens: 1e3
})

let lastMessageTime;
let timeDifference;

bot.on('text', async (msg) => {
  console.log(new Date().toLocaleString(), '--Received message from id:', msg.chat.id, ':', msg.text);
  
// 特定前缀或特定用户发的消息不做速率限制
  if (msg.text.indexOf('/vip') === 0 || msg.from.id === 1051339668) {
    msgHandler(msg);
    return;
    }

   let currentMessageTime = new Date();

  if (lastMessageTime) {
    timeDifference = currentMessageTime - lastMessageTime;
  }
  
  let countdownsecond = Math.round((30000 - timeDifference)/1000)

  if (timeDifference <= 30000) {  // 1 minute in milliseconds
    bot.sendMessage(msg.chat.id, '速率控制，请'+ countdownsecond + '秒后重试', {reply_to_message_id: msg.message_id});
    }
  
    else await msgHandler(msg);
});

async function msgHandler(msg) {
  if (typeof msg.text !== 'string' || ((msg.chat.type === 'group' || msg.chat.type === 'supergroup') && !msg.text.startsWith(prefix))) {
    return;
  }
  switch (true) {
//    case msg.chat.type === 'private':
//      bot.sendMessage(msg.chat.id, 'Private chat will return later. Until then, //Please check https://t.me/gpt345');
//      break;
    case msg.text.startsWith('/start'):
      await bot.sendMessage(msg.chat.id, '👋你好！很高兴能与您交谈。有什么我可以帮您的吗？');
      break;
    case msg.text.length >= 2:
      lastMessageTime = new Date();
      await chatGpt(msg);
      break;
    default:
      await bot.sendMessage(msg.chat.id, '😭我不太明白您的意思。');
      break;
  }
}

async function chatGpt(msg) {
  try {
    const tempId = (await bot.sendMessage(msg.chat.id, '🤔正在组织语言，请稍等...', {
      reply_to_message_id: msg.message_id
    })).message_id;
    bot.sendChatAction(msg.chat.id, 'typing');
    const response = await api.sendMessage(msg.text.replace(prefix, ''))
    console.log(new Date().toLocaleString(), '--AI response to <', msg.text, '>:', response.text);
    await bot.editMessageText(response.text, { parse_mode: 'Markdown', chat_id: msg.chat.id, message_id: tempId });
  } catch (err) {
    console.log('Error:', err)
    await bot.sendMessage(msg.chat.id, '😭出错了，请稍后再试；如果您是管理员，请检查日志。');
    throw err
  }
}
