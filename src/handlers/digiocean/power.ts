import { Action } from 'digitalocean-js'
import { createInteractiveResponse, stringify } from '../../utils'
import { HandlerContext } from '../../index'
import status from './status'
import { synchd } from 'synchd'

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

const MAX_STATUS_CHECKS = 30

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

  const response = await createInteractiveResponse(message, 'Waiting...')
  await synchd(digitalOcean, async () => {
    await response.start()
    await response.update('Working...')

    const action = await digitalOcean.dropletActions[
      args.on ? 'powerOnDroplet' : 'powerOffDroplet'
    ](digitalOceanDropletId)

    await response.update(makePowerActionMessage(action))

    let curAction: Action = action,
      tries = 0
    do {
      curAction = await digitalOcean.actions.getExistingAction(curAction.id)
      await response.update(makePowerActionMessage(curAction))
    } while (
      tries++ < MAX_STATUS_CHECKS &&
      (curAction && !curAction.completed_at)
    )

    if (tries >= MAX_STATUS_CHECKS) {
      await Promise.all([
        response.fail(),
        response.update(
          `Maximum number of ${MAX_STATUS_CHECKS} checks reached\n` +
            `Last result: ${makePowerActionMessage(curAction)}`,
        ),
      ])
      await response.fail()
    } else {
      await response.success()
    }
  })
}
