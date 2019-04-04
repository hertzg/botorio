module.exports = {
  apps: [
    {
      name: 'botorio',
      description: '',
      script: 'build/index.js',
      env: {
        DEBUG: 'botorio:*',
      },
      node_args: ['--optimize-for-size', '--max-old-space-size=50'],
    }
  ],
}
