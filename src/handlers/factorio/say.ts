import { HandlerContext } from '../../index'
import { Message } from 'discord.js'
import { stringify } from '../../utils'

export default async ({ args, message, factorioRCon }: HandlerContext) => {
  const text = Array.isArray(args['--'])
    ? args['--']
        .join(' ')
        .trim()
        .replace(/^\//, '')
    : null

  if (!text) {
    await message.reply('You must provide a message after -- ')
    return
  }

  const _replyMsgs = await message.reply('Working...')
  const replyMsg: Message = Array.isArray(_replyMsgs)
    ? _replyMsgs[0]
    : _replyMsgs

  try {
    await factorioRCon.session((rcon) => rcon.send(text))
    await replyMsg.edit(stringify(`<server>: ${text}`))
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
