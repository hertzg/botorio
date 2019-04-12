import { Action } from 'digitalocean-js'
import { stringify } from '../../utils'
import { HandlerContext } from '../../index'
import { Message } from 'discord.js'
import status from './status'

const makePowerActionMessage = (action: Action) =>
  stringify({
    last_checked_at: new Date().toISOString(),
    id: action.id,
    resource_id: action.resource_id,
    status: action.status,
    type: action.type,
    started_at: action.started_at,
    completed_at: action.completed_at,
  })

export default async (context: HandlerContext) => {
  const {
    message,
    args,
    digitalOcean,
    variables: { digitalOceanDropletId },
  } = context

  if (typeof args.on === 'undefined' && typeof args.off === 'undefined') {
    return await status(context)
  }

  const action = await digitalOcean.dropletActions[
    args.on ? 'powerOnDroplet' : 'powerOffDroplet'
  ](digitalOceanDropletId)
  const _replyMsgs = await message.reply(makePowerActionMessage(action))
  const replyMsg: Message = Array.isArray(_replyMsgs)
    ? _replyMsgs[0]
    : _replyMsgs

  let curAction: Action = action
  do {
    curAction = await digitalOcean.actions.getExistingAction(curAction.id)
    await replyMsg.edit(makePowerActionMessage(curAction))
  } while (curAction && !curAction.completed_at)
}
