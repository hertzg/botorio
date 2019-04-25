import { HandlerContext } from '../../index'
import { createInteractiveResponse, sshExec, stringify } from '../../utils'
import { synchd } from 'synchd'
import * as FS from 'fs'
import { Attachment, RichEmbed } from 'discord.js'
import YAML from 'yaml'

const factorioUpdateLockRef = {}
const COMMAND = [
  'cd /opt/factorio',
  'service factorio stop',
  'python3 ./update_factorio.py -xDa bin/x64/factorio',
  'cd ../',
  'chown -R factorio:factorio ./factorio',
  'service factorio start',
].join(' && ')

export default async ({
  message,
  variables: { sshHost, sshPort, sshUser, sshIdentity },
}: HandlerContext) => {
  const response = await createInteractiveResponse(message)

  await synchd(factorioUpdateLockRef, async () => {
    await response.start()
    await Promise.all([response.start(), response.update('Working...')])

    try {
      const stream = await sshExec(
        {
          host: sshHost,
          port: sshPort,
          username: sshUser,
          privateKey: FS.readFileSync(sshIdentity),
        },
        COMMAND,
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
