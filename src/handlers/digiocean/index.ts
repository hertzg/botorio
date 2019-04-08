import { Message } from 'discord.js'
import { Action } from 'digitalocean-js'
import { stringify } from '../../utils'
import { HandlerContext } from '../../index'

const makePowerActionMessage = (action: Action) =>
  stringify({
    id: action.id,
    resource_id: action.resource_id,
    status: action.status,
    type: action.type,
    started_at: action.started_at,
    completed_at: action.completed_at,
  })

export const power = async ({
  message,
  args,
  digitalOcean,
  variables: { digitalOceanDropletId },
}: HandlerContext) => {
  if (typeof args.on === 'undefined' && typeof args.off === 'undefined') {
    await message.reply('Please specify --off or --on')
    return
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

export const status = async ({
  message,
  digitalOcean,
  variables: { digitalOceanDropletId },
}: HandlerContext) => {
  const {
    id,
    status,
    name,
    vcpus,
    memory,
    disk,
    networks,
  } = await digitalOcean.droplets.getExistingDroplet(digitalOceanDropletId)

  await message.reply(
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
}
