import Discord, { Message } from 'discord.js'
import { Action, DigitalOcean } from 'digitalocean-js'
import { stringify } from './utils'

const discordToken = process.env.DISCORD_TOKEN,
  digitalOceanToken = process.env.DIGITAL_OCEAN_TOKEN,
  digitalOceanDropletId = Number(process.env.DIGITAL_OCEAN_DROPLET_ID)

if (!discordToken || !digitalOceanToken || isNaN(digitalOceanDropletId)) {
  throw new Error(
    `Missing DISCORD_TOKEN or DIGITAL_OCEAN_TOKEN or DIGITAL_OCEAN_DROPLET_ID`,
  )
}

const discord = new Discord.Client(),
  digitalOcean = new DigitalOcean(digitalOceanToken)

discord.once('ready', async () => {
  console.log('Botorio ready!')
})

const commandMap = new Map<string, (msg: Message) => Promise<void> | void>()
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

commandMap.set('!help', async (msg) => {
  const replyMsg = await msg.reply(
    '```\n' +
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
