import { HandlerContext } from '../../index'
import { Message } from 'discord.js'
import { stringify } from '../../utils'

import Request from 'request-promise'
import Semver from 'semver'

interface PatchRange {
  from: string
  to: string
}

interface StableMarker {
  stable: string
}

interface AvailableVersionsResponse {
  [key: string]: Array<PatchRange | StableMarker>
}

const getLatestVersions = async (variant = 'core-linux_headless64') => {
  const versionMap = (await Request.get(
    'https://updater.factorio.com/get-available-versions?apiVersion=2',
    { json: true },
  ).promise()) as AvailableVersionsResponse

  if (!versionMap || !(variant in versionMap)) {
    throw new Error(`Unable to retrieve versions for "${variant}"`)
  }

  const versions = versionMap[variant]

  const semanticVersions = (versions.filter(
    (v) => 'to' in v,
  ) as PatchRange[]).reduce<Semver.SemVer[]>((acc, patchRange) => {
    const semVer = Semver.parse(patchRange.to, { loose: true })
    if (!semVer) {
      return acc
    }

    acc.push(semVer)
    return acc
  }, [])

  const stableMarker = versions.find((v) => 'stable' in v) as
    | StableMarker
    | undefined

  const latest = Semver.maxSatisfying(semanticVersions, '*')
  return {
    latest: latest ? latest.format() : null,
    stable: stableMarker ? stableMarker.stable : null,
  }
}

export default async ({ message, factorioRCon }: HandlerContext) => {
  const _replyMsgs = await message.reply('Working...')
  const replyMsg: Message = Array.isArray(_replyMsgs)
    ? _replyMsgs[0]
    : _replyMsgs

  try {
    let current: string | null = null
    try {
      current = await factorioRCon.session((rcon) => rcon.send('/version'))
    } catch (ex) {}
    const latest = await getLatestVersions()
    await replyMsg.edit(
      stringify({
        current,
        ...latest,
      }),
    )
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
