import { Message } from 'discord.js'
import { stringify } from '../../utils'
import { cmd } from '../../factorio'
import { HandlerContext } from '../../index'

export default async ({ message, factorioRCon }: HandlerContext) => {
  const _replyMsgs = await message.reply('Working...')
  const replyMsg: Message = Array.isArray(_replyMsgs)
    ? _replyMsgs[0]
    : _replyMsgs

  let result
  try {
    result = await factorioRCon.session((rcon) => rcon.send(cmd('save')))
    await replyMsg.edit(stringify(result))
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
