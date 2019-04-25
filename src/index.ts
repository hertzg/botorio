import { Package } from './bootstrap'
import Discord, { Attachment, Message } from 'discord.js'
import { DigitalOcean } from 'digitalocean-js'
import YAML from 'yaml'
import {
  codify,
  codifyShort,
  ensureEnvKeys,
  EnvKeyRuleType,
  isAuthorBot,
  isFirstMention,
  isGuildUnavailable,
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
  sshHost,
  sshPort,
  sshUser,
  sshIdentity,
] = ensureEnvKeys([
  { type: EnvKeyRuleType.NON_EMPTY_STRING, key: 'DISCORD_TOKEN' },
  { type: EnvKeyRuleType.NON_EMPTY_STRING, key: 'DIGITAL_OCEAN_TOKEN' },
  { type: EnvKeyRuleType.NON_NAN_NUMBER, key: 'DIGITAL_OCEAN_DROPLET_ID' },
  { type: EnvKeyRuleType.NON_NAN_NUMBER, key: 'FACTORIO_RCON_PORT' },
  { type: EnvKeyRuleType.NON_EMPTY_STRING, key: 'FACTORIO_RCON_HOST' },
  { type: EnvKeyRuleType.NON_EMPTY_STRING, key: 'FACTORIO_RCON_PASSWORD' },
  { type: EnvKeyRuleType.NON_EMPTY_STRING, key: 'FACTORIO_SSH_HOST' },
  { type: EnvKeyRuleType.NON_NAN_NUMBER, key: 'FACTORIO_SSH_PORT' },
  { type: EnvKeyRuleType.NON_EMPTY_STRING, key: 'FACTORIO_SSH_USER' },
  { type: EnvKeyRuleType.NON_EMPTY_STRING, key: 'FACTORIO_SSH_IDENTITY' },
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

  await discord.user.setActivity(`Botorio v${Package.version}`, {
    type: 'PLAYING',
  })
})

export interface HandlerContext {
  version: string
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
    sshHost: string
    sshPort: number
    sshUser: string
    sshIdentity: string
  }
}

const DISCORD_MESSAGE_CONTENT_LIMIT = 1980

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
      version: Package.version,
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
        sshHost,
        sshPort,
        sshUser,
        sshIdentity,
      },
    }

    message.channel.startTyping()

    if (typeof handler !== 'function') {
      await message.reply('This is not a valid command.')
    } else {
      await handler(context)
    }
  } catch (e) {
    const stackTrace = YAML.stringify(e.stack),
      description = `Oops. ${codifyShort(
        `Error: ${YAML.stringify(e.message)}`,
      )}`,
      text = `${description}\n${codify(stackTrace)}`

    if (text.length <= DISCORD_MESSAGE_CONTENT_LIMIT) {
      await message.reply(text)
    } else {
      await message.reply(`${description}\nStack trace attached.`, {
        files: [
          new Attachment(new Buffer(stackTrace, 'utf8'), 'stacktrace.yaml.txt'),
        ],
      })
    }

    console.error(text)
  }
  message.channel.stopTyping()
})

discord.login(discordToken).catch((err) => {
  throw err
})
