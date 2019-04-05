import YAML from 'yaml'

export const stringify = (object: any) => {
  return '```yaml\n' + YAML.stringify(object) + '```'
}
