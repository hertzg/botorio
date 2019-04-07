import Discord, { Message } from 'discord.js'
import { Action, DigitalOcean } from 'digitalocean-js'
import { ensureEnvKeys, EnvKeyRuleType, stringify } from './utils'
import RCon from 'rcon-ts'

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
  console.log('Botorio ready!')
})

const commandMap = new Map<string, (msg: Message) => Promise<void> | void>()
commandMap.set('!players', async (msg) => {
  const _replyMsgs = await msg.reply('Working...')
  const replyMsg: Message = Array.isArray(_replyMsgs)
    ? _replyMsgs[0]
    : _replyMsgs

  let result
  try {
    result = await factorioRCon.session(async (rcon) =>
      [
        await rcon.send('/players online'),
        await rcon.send('/players'),
      ].concat(),
    )
    await replyMsg.edit(stringify(result))
  } catch (err) {
    let msg: any
    if (err && err.innerException && err.innerException.errno === 'ECONNREFUSED') {
      msg = 'Unable to connect to Factorio RCON (Is the droplet running?)'
    } else {
      msg = err
    }
    await replyMsg.edit(stringify(msg))
  }
})

commandMap.set('!status', async (msg) => {
  const {
    id,
    status,
    name,
    vcpus,
    memory,
    disk,
    networks,
  } = await digitalOcean.droplets.getExistingDroplet(digitalOceanDropletId)

  await msg.reply(
    stringify({
      id,
      status,
      name,
      vcpus,
      memory,
      disk,
      networks,
    }),
  )
})

function makePowerActionMessage(action: Action) {
  return stringify({
    id: action.id,
    resource_id: action.resource_id,
    status: action.status,
    type: action.type,
    started_at: action.started_at,
    completed_at: action.completed_at,
  })
}

commandMap.set('!poweroff', async (msg) => {
  const action = await digitalOcean.dropletActions.powerOffDroplet(
    digitalOceanDropletId,
  )

  const _replyMsgs = await msg.reply(makePowerActionMessage(action))
  const replyMsg: Message = Array.isArray(_replyMsgs)
    ? _replyMsgs[0]
    : _replyMsgs

  let curAction: Action = action
  do {
    curAction = await digitalOcean.actions.getExistingAction(curAction.id)
    await replyMsg.edit(makePowerActionMessage(curAction))
  } while (curAction && !curAction.completed_at)
})

commandMap.set('!poweron', async (msg) => {
  const action = await digitalOcean.dropletActions.powerOnDroplet(
    digitalOceanDropletId,
  )
  const _replyMsgs = await msg.reply(makePowerActionMessage(action))
  const replyMsg: Message = Array.isArray(_replyMsgs)
    ? _replyMsgs[0]
    : _replyMsgs

  let curAction: Action = action
  do {
    curAction = await digitalOcean.actions.getExistingAction(curAction.id)
    await replyMsg.edit(makePowerActionMessage(curAction))
  } while (curAction && !curAction.completed_at)
})

commandMap.set('!cls', async (msg) => {
  const messages = await msg.channel.fetchMessages({ limit: 100 })
  await msg.channel.bulkDelete(messages)
})

commandMap.set('!help', async (msg) => {
  const replyMsg = await msg.reply(
    '```\n' +
      '!players - Reports the list of players\n' +
      '!status - Reports the status of droplet\n' +
      '!poweroff - Power off the droplet\n' +
      '!poweron - Power on the droplet\n' +
      '!help - Shows this help for 5sec\n' +
      '```',
  )
  const replyMsgs: Message[] = Array.isArray(replyMsg) ? replyMsg : [replyMsg]

  await Promise.all([...replyMsgs.map((m) => m.delete(5000)), msg.delete(5000)])
})

discord.on('message', async (msg) => {
  try {
    if (msg.author.id === discord.user.id) return
    const body = msg.content

    const handler = commandMap.get(body)
    if (handler) {
      await handler(msg)
    } else {
      const help = commandMap.get('!help')
      if (!help) return
      await help(msg)
    }
  } catch (e) {
    await msg.reply(`Oops. ${stringify(e.stack)}`)
  }
})

discord.login(discordToken)
