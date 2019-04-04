import Discord, { Message } from 'discord.js'
import { DigitalOcean } from 'digitalocean-js'

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

discord.on('message', async (msg) => {
  try {
    if (msg.author.id === discord.user.id) return

    let action
    switch (msg.content) {
      case '!poweroff':
        action = await digitalOcean.dropletActions.powerOffDroplet(
          digitalOceanDropletId,
        )

        break
      case '!poweron':
        action = await digitalOcean.dropletActions.powerOnDroplet(
          digitalOceanDropletId,
        )
        break
      case '!help':
      default:
        const replyMsg = await msg.reply(
          '```\n!poweroff - Power off the droplet\n!poweron - Power on the droplet```',
        )
        const replyMsgs: Message[] = Array.isArray(replyMsg)
          ? replyMsg
          : [replyMsg]

        await Promise.all([
          ...replyMsgs.map((m) => m.delete(5000)),
          msg.delete(5000),
        ])
        break
    }

    if (action) {
      await msg.reply(`Done. \`\`\`js${'\n' + JSON.stringify(action)}\`\`\``)
    }
  } catch (e) {
    await msg.reply(`Oops. \`\`\`js${'\n' + JSON.stringify(e.stack)}\`\`\``)
  }
})

discord.login(discordToken)
