import { Message } from 'discord.js'
import * as factorioCommands from './factorio'
import * as digioceanCommands from './digiocean'
import { HandlerContext } from '../index'

export const factorio = {
  ...factorioCommands,
}
export const game = factorio

export const digiocean = {
  ...digioceanCommands,
}
export const server = digiocean

export const cls = async ({ message }: HandlerContext) => {
  const messages = await message.channel.fetchMessages({ limit: 100 })
  await message.channel.bulkDelete(messages)
}

export const help = async ({ message, discord }: HandlerContext) => {
  const replyMsg = await message.reply(
    '```\n' +
    `@${discord.user.username} [factorio|game] players - Reports the list of players\n` +
    `@${discord.user.username} [factorio|game] save - Saves the game map\n` +
    `@${discord.user.username} [factorio|game] version - Reports game version\n` +
    `@${discord.user.username} [digiocean|server] status - Reports the status of droplet\n` +
    `@${discord.user.username} [digiocean|server] power --on - Power off the droplet\n` +
    `@${discord.user.username} [digiocean|server] power --off - Power on the droplet\n` +
    `@${discord.user.username} help - Shows this help for 5sec\n` +
    '```',
  )
  const replyMsgs: Message[] = Array.isArray(replyMsg) ? replyMsg : [replyMsg]

  await Promise.all([
    ...replyMsgs.map((m) => m.delete(5000)),
    message.delete(5000),
  ])
}

export default help
