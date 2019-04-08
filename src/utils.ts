import YAML from 'yaml'
import { Message } from 'discord.js'

export const stringify = (object: any) => {
  return '```yaml\n' + YAML.stringify(object) + '```'
}

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

export const isGuildUnavailable = (msg: Message) => !msg.guild.available
