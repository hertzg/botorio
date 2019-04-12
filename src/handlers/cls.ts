import { HandlerContext } from '../index'

export default async ({ message }: HandlerContext) => {
  const messages = await message.channel.fetchMessages({ limit: 100 })
  await message.channel.bulkDelete(messages)
}
