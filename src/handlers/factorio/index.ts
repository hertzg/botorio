import { Message } from 'discord.js'
import { stringify } from '../../utils'
import { HandlerContext } from '../../index'

export const players = async ({ message, factorioRCon }: HandlerContext) => {
  const _replyMsgs = await message.reply('Working...')
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

export const version = async ({ message, factorioRCon }: HandlerContext) => {
  const _replyMsgs = await message.reply('Working...')
  const replyMsg: Message = Array.isArray(_replyMsgs)
    ? _replyMsgs[0]
    : _replyMsgs

  let result
  try {
    result = await factorioRCon.session((rcon) => rcon.send('/version'))
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

export const save = async ({ message, factorioRCon }) => {
  const _replyMsgs = await message.reply('Working...')
  const replyMsg: Message = Array.isArray(_replyMsgs)
    ? _replyMsgs[0]
    : _replyMsgs

  let result
  try {
    result = await factorioRCon.session((rcon) => rcon.send('/server-save'))
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
