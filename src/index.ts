import './bootstrap'
import Discord, { Message } from 'discord.js'
import { DigitalOcean } from 'digitalocean-js'
import {
  ensureEnvKeys,
  EnvKeyRuleType,
  isAuthorBot,
  isFirstMention,
  isGuildUnavailable,
  stringify,
} from './utils'
import RCon from 'rcon-ts'
import Minimist from 'minimist'
import handlers from './handlers'
import defaultHandler from './handlers/help'
import LodashGet from 'lodash-ts/get'

const [
  discordToken,
  digitalOceanToken,
  digitalOceanDropletId,
  rconPort,
  rconHost,
  rconPassword,
] = ensureEnvKeys([
  { type: EnvKeyRuleType.NON_EMPTY_STRING, key: 'DISCORD_TOKEN' },
  { type: EnvKeyRuleType.NON_EMPTY_STRING, key: 'DIGITAL_OCEAN_TOKEN' },
  { type: EnvKeyRuleType.NON_NAN_NUMBER, key: 'DIGITAL_OCEAN_DROPLET_ID' },
  { type: EnvKeyRuleType.NON_NAN_NUMBER, key: 'FACTORIO_RCON_PORT' },
  { type: EnvKeyRuleType.NON_EMPTY_STRING, key: 'FACTORIO_RCON_HOST' },
  { type: EnvKeyRuleType.NON_EMPTY_STRING, key: 'FACTORIO_RCON_PASSWORD' },
])

const discord = new Discord.Client(),
  digitalOcean = new DigitalOcean(digitalOceanToken),
  factorioRCon = new RCon({
    host: rconHost,
    port: rconPort,
    password: rconPassword,
  })

discord.once('ready', async () => {
  console.log(`Discord Bot "${discord.user.username}" ready!`)
})

export interface HandlerContext {
  message: Message
  args: Minimist.ParsedArgs
  discord: Discord.Client
  digitalOcean: DigitalOcean
  factorioRCon: RCon
  variables: {
    discordToken: string
    digitalOceanToken: string
    digitalOceanDropletId: number
    rconPort: number
    rconHost: string
    rconPassword: string
  }
}

discord.on('message', async (message) => {
  try {
    if (isGuildUnavailable(message) || isAuthorBot(message)) {
      return
    }

    const trimmedContent = message.content.trim()
    if (!isFirstMention(message.content, discord.user.id)) {
      return
    }

    const args = Minimist(trimmedContent.split(' ').slice(1), { '--': true }),
      commands = args._.filter((v) => v && v.trim && v.trim())

    const handler = LodashGet(handlers, commands, defaultHandler)

    const context: HandlerContext = {
      message,
      args,
      discord,
      digitalOcean,
      factorioRCon,
      variables: {
        discordToken,
        digitalOceanToken,
        digitalOceanDropletId,
        rconPort,
        rconHost,
        rconPassword,
      },
    }

    message.channel.startTyping()
    await handler(context)
  } catch (e) {
    await message.reply(`Oops. ${stringify(e.stack)}`)
  }
  message.channel.stopTyping()
})

discord.login(discordToken).catch((err) => {
  throw err
})
