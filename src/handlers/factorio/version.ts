import { HandlerContext } from '../../index'
import { createInteractiveResponse, stringify } from '../../utils'

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

export const EMOJI_WARNING = '⚠'

export default async ({ message, factorioRCon }: HandlerContext) => {
  const response = await createInteractiveResponse(message)

  await response.start()
  let current: string | null = null

  await response.update('`Checking current running version...`')
  try {
    current = await factorioRCon.session((rcon) => rcon.send('/version'))
  } catch (ex) {
    await response.react(EMOJI_WARNING)
  }

  await response.update('`Checking latest game versions...`.')
  const latest = await getLatestVersions()
  await response.update(
    stringify({
      current: current ? current : 'null (is server running?)',
      ...latest,
    }),
  )
  await response.success()
}
