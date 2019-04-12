import { HandlerContext } from '../../index'
import { Message } from 'discord.js'
import { stringify } from '../../utils'

export default async ({ args, message, factorioRCon }: HandlerContext) => {
  const command = Array.isArray(args['--']) ? args['--'].join(' ').trim() : null

  if (!command) {
    await message.reply('You must provide full command after -- ')
    return
  }

  const _replyMsgs = await message.reply('Working...')
  const replyMsg: Message = Array.isArray(_replyMsgs)
    ? _replyMsgs[0]
    : _replyMsgs

  let result
  try {
    result = await factorioRCon.session((rcon) => rcon.send(command))
    await replyMsg.edit(stringify({ command, result }))
  } catch (err) {
    let msg: any
    if (
      err &&
      err.innerException &&
      err.innerException.errno === 'ECONNREFUSED'
    ) {
      msg = 'Unable to connect to Factorio RCON (Is the droplet running?)'
    } else {
      msg = err
    }
    await replyMsg.edit(stringify(msg))
  }
}
