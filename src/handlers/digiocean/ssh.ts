import { HandlerContext } from '../../index'
import { createInteractiveResponse, sshExec, stringify } from '../../utils'
import { synchd } from 'synchd'
import { Attachment, RichEmbed } from 'discord.js'
import YAML from 'yaml'
import * as FS from 'fs'

const sshCommandLockRef = {}

export default async ({
  message,
  args,
  variables: { sshHost, sshPort, sshUser, sshIdentity },
}: HandlerContext) => {
  const text = Array.isArray(args['--']) ? args['--'].join(' ').trim() : null

  const response = await createInteractiveResponse(message)

  if (!text) {
    await Promise.all([
      response.update('You must provide a command after -- '),
      response.fail(),
    ])
    return
  }

  await synchd(sshCommandLockRef, async () => {
    await Promise.all([response.start(), response.update('Working...')])

    try {
      const stream = await sshExec(
        {
          host: sshHost,
          port: sshPort,
          username: sshUser,
          privateKey: FS.readFileSync(sshIdentity),
        },
        text,
      )
      const chunks: Array<any> = []

      let wasTextTooLong: boolean = false
      const push = async (...args: any) => {
        chunks.push(...args)
        const text = stringify(chunks)
        wasTextTooLong = text.length > 1900
        const replyText = wasTextTooLong
          ? `${text}\n Output is too long...\n Full output coming soon`
          : text
        await response.update(replyText)
      }
      stream.once('close', async (code, signal) => {
        await push({ code, signal })
        if (wasTextTooLong) {
          await Promise.all([
            response.update(
              'Full output attached',
              new RichEmbed({
                file: new Attachment(
                  new Buffer(YAML.stringify(chunks), 'utf8'),
                  'ssh-output.yaml.txt',
                ),
              }),
            ),
            response.success(),
          ])
        } else {
          await response.success()
        }
      })
      stream.on(
        'data',
        async (chunk) => await push({ stdout: chunk.toString('utf8') }),
      )

      stream.stderr.on(
        'data',
        async (chunk) => await push({ stderr: chunk.toString('utf8') }),
      )
    } catch (e) {
      await Promise.all([
        response.update(stringify(e.message)),
        response.fail(),
      ])
    }
  })
}
