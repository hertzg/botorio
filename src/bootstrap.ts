require('source-map-support').install()
import DotEnv from 'dotenv'
const Env = DotEnv.config({
  encoding: 'utf8',
})

import V8 from 'v8'
import FileSize from 'filesize'
import YAML from 'yaml'
import Package from '../package.json'
const SPLASH = `
______       _             _       
| ___ \\     | |           (_)      
| |_/ / ___ | |_ ___  _ __ _  ___  
| ___ \\/ _ \\| __/ _ \\| '__| |/ _ \\ 
| |_/ / (_) | || (_) | |  | | (_) |
\\____/ \\___/ \\__\\___/|_|  |_|\\___/ 
                                   
${YAML.stringify({
  version: Package.version,
  argv: process.argv,
  execArgv: process.execArgv,
  cwd: process.cwd(),
  v8Heap: {
    info: new Map(
      Object.entries(V8.getHeapStatistics()).map(([k, v]) => [
        k,
        `${v} (${FileSize(v)})`,
      ]),
    ),
    spaces: V8.getHeapSpaceStatistics().reduce(
      (acc, { space_name, ...space }) =>
        acc.set(
          space_name,
          new Map(Object.entries(space).map(([k, v]) => [k, `${v} (${FileSize(v)})`])),
        ),
      new Map(),
    ),
  },
  versions: process.versions,
  env: Env.parsed
    ? Object.entries(Env.parsed).map(([key, parsed]) => ({
        key,
        actual: process.env[key],
        parsed,
      }))
    : null,
})}
`

console.log(SPLASH)
