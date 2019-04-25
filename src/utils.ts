import YAML from 'yaml'
import {
  Emoji,
  Message,
  MessageEditOptions,
  MessageOptions,
  MessageReaction,
  ReactionEmoji,
  RichEmbed,
  StringResolvable,
} from 'discord.js'

export const stringifyShort = (object: any) =>
  codifyShort(YAML.stringify(object))

export const stringify = (object: any) => codify(YAML.stringify(object), 'yaml')

export const codifyShort = (code) => `\`${code}\``

export const codify = (code: string, lang: string = '') =>
  `\`\`\`${lang}\n${code}\n\`\`\``

export enum EnvKeyRuleType {
  NON_EMPTY_STRING = 'non-empty-string',
  NON_NAN_NUMBER = 'non-nan-number',
}

type EnvKeyRule = {
  type: EnvKeyRuleType
  key: string
  defaultValue?: any
}

export const ensureEnvKeys = (keyRules: EnvKeyRule[]): any[] =>
  keyRules.map(({ type, key, defaultValue }) => {
    let value: any = process.env[key],
      isDefaultProvided = typeof defaultValue !== 'undefined'

    switch (type) {
      case EnvKeyRuleType.NON_EMPTY_STRING:
        if (!value) {
          if (isDefaultProvided) {
            value = defaultValue
          } else {
            throw new TypeError(
              `Missing or invalid required NON_EMPTY_STRING environment variable "${key}"`,
            )
          }
        }
        break
      case EnvKeyRuleType.NON_NAN_NUMBER:
        value = Number(value)
        if (isNaN(value)) {
          if (isDefaultProvided) {
            value = defaultValue
          } else {
            throw new TypeError(
              `Missing or invalid required NON_NAN_NUMBER environment variable "${key}"`,
            )
          }
        }
        break
    }
    return value
  })
export const isFirstMention = (content: string, id: string) =>
  content && content.trim().startsWith(`<@${id}>`)

export const isAuthorBot = (msg: Message) => msg.author.bot

export const isGuildUnavailable = (msg: Message) =>
  !msg.guild || !msg.guild.available

const EMOJI_WAITING = '⌛'
const EMOJI_WORKING = '👁'
const EMOJI_SUCCESS = '✅'
const EMOJI_FAILURE = '🛑'

export const createInteractiveResponse = async (
  message: Message,
  content: StringResolvable = 'Waiting...',
  options?: MessageOptions,
) => {
  let waitingReaction: MessageReaction | null = await message.react(
    EMOJI_WAITING,
  )
  const _reply = await message.reply(content, options)
  // I have no idea when reply returns an array of messages
  // Need to rework this when such case occurs
  const reply: Message = Array.isArray(_reply) ? _reply[0] : _reply

  let workingReaction: MessageReaction | null = null
  return {
    async start() {
      if (waitingReaction) {
        await waitingReaction.remove()
        waitingReaction = null
      }
      workingReaction = await message.react(EMOJI_WORKING)
    },
    async update(
      content: StringResolvable,
      options?: MessageEditOptions | RichEmbed,
    ) {
      await reply.edit(content, options)
    },
    async react(emoji: string | Emoji | ReactionEmoji) {
      await message.react(emoji)
    },
    async success() {
      const tasks: Promise<any>[] = [message.react(EMOJI_SUCCESS)]
      if (waitingReaction) {
        tasks.push(waitingReaction.remove())
        if (waitingReaction) {
          waitingReaction = null
        }
      }
      if (workingReaction) {
        tasks.push(workingReaction.remove())
        workingReaction = null
      }
      await Promise.all(tasks)
    },
    async fail() {
      const tasks: Promise<any>[] = [message.react(EMOJI_FAILURE)]
      if (waitingReaction) {
        tasks.push(waitingReaction.remove())
        if (waitingReaction) {
          waitingReaction = null
        }
      }
      if (workingReaction) {
        tasks.push(workingReaction.remove())
        workingReaction = null
      }
      await Promise.all(tasks)
    },
  }
}
