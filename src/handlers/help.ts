import { HandlerContext } from '../index'

export default async ({ version, message, discord }: HandlerContext) =>
  await message.reply(
    // prettier-ignore
    '```\n' +
    `Botorio v${version}\n` +
    `@${discord.user.username} game|factorio players - Reports the list of players\n` +
    `@${discord.user.username} game|factorio save - Saves the game map\n` +
    `@${discord.user.username} game|factorio version - Reports game version\n` +
    `@${discord.user.username} game|factorio say -- Your message goes here after double dashes - Say as <sever>\n` +
    `@${discord.user.username} game|factorio lua|luap|rcon -- Your command goes here after double dashes - Runs a command and returns the result (DO NOT USE! WILL COUNT AS CHEATING)\n` +
    `@${discord.user.username} game|factorio update - Stops, updates and starts the factorio service\n` +
    `@${discord.user.username} game|factorio restart - Restarts the factorio service\n` +
    `@${discord.user.username} server|digiocean power|status - Reports the status of droplet\n` +
    `@${discord.user.username} server|digiocean power --on - Power off the droplet\n` +
    `@${discord.user.username} server|digiocean power --off - Power on the droplet\n` +
    //`@${discord.user.username} server|digiocean ssh -- any bash command goes here - Runs a bash command via ssh\n` +
    `@${discord.user.username} cls - Clear last 100 messages in the channel\n` +
    `@${discord.user.username} help - Shows this help for 5sec\n` +
    '```',
  )
