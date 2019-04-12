import { HandlerContext } from '../../index'
import { Message } from 'discord.js'
import { stringify } from '../../utils'
import { LuaCommandType, rconPrintCmd } from '../../factorio'

export default async ({ args, message, factorioRCon }: HandlerContext) => {
  const expression = Array.isArray(args['--'])
    ? args['--'].join(' ').trim()
    : null

  if (!expression) {
    await message.reply('You must provide full command after -- ')
    return
  }

  const type: LuaCommandType = Object.values(LuaCommandType).includes(args.type)
    ? (LuaCommandType[args.type] as LuaCommandType)
    : LuaCommandType.SILENT

  const _replyMsgs = await message.reply('Working...')
  const replyMsg: Message = Array.isArray(_replyMsgs)
    ? _replyMsgs[0]
    : _replyMsgs

  let result
  try {
    const command = rconPrintCmd(expression, type)
    result = await factorioRCon.session((rcon) => rcon.send(command))
    await replyMsg.edit(stringify({ expression, command, result }))
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
