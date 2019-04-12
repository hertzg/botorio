import { HandlerContext } from '../../index'
import { stringify } from '../../utils'

export default async ({
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
