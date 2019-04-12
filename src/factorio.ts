export enum LuaCommandType {
  NORMAL = 'c',
  SILENT = 'silent-command',
}

export const shout = (text: string) => cmd('shout', text)

export const cmd = (name: string, ...args: string[]) =>
  `/${name}${args.length ? ' ' + args.join(' ') : ''}`

export const luaCmd = (
  command: string,
  type: LuaCommandType = LuaCommandType.NORMAL,
) => cmd(type, command)

export const rconPrintCmd = (
  command: string,
  type: LuaCommandType = LuaCommandType.SILENT,
) => luaCmd(`rcon.print(${command})`, type)
