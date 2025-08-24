import process from 'node:process'
import readline from 'node:readline'
import fs from 'fs-extra'
import { compose } from './compose'
import { createCustomConfig, getConfig } from './config'

import {
  defaultCustomConfigFilePath,
  getDefaultPath,
  operatingSystemName,
} from './defaults'
import logger from './logger'
import { createAlias, createPathCompat, execute } from './utils'

function rlSetConfig() {
  // 不能把 readline.createInterface 放在外围全局作用域，否则会出现 CLI 执行之后不停止的问题，此时就需要 process.exit 手动退出了
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  logger.log('请设置微信web开发者工具 cli 的路径')
  logger.log('> 提示：命令行工具默认所在位置：')
  logger.log('- MacOS: <安装路径>/Contents/MacOS/cli')
  logger.log('- Windows: <安装路径>/cli.bat')
  logger.log('- Linux: <安装路径>/files/bin/bin/wechat-devtools-cli')
  return new Promise((resolve, _reject) => {
    rl.question('请输入微信web开发者工具cli路径：', async (cliPath) => {
      await createCustomConfig({
        cliPath,
      })
      logger.log(`全局配置存储位置：${defaultCustomConfigFilePath}`)
      resolve(cliPath)
    })
  })
}

const parseArgv = compose(
  createAlias({ find: '-p', replacement: '--project' }),
  createPathCompat('--result-output'),
  createPathCompat('-r'),
  createPathCompat('--qr-output'),
  createPathCompat('-o'),
  createPathCompat('--info-output'),
  createPathCompat('-i'),
)

export async function parse(argv: string[]) {
  // https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html
  // https://developers.weixin.qq.com/miniprogram/dev/devtools/cli.html
  const isSupported = Boolean(await getDefaultPath())

  if (isSupported) {
    const { cliPath } = await getConfig()
    const isExisted = await fs.exists(cliPath)
    if (isExisted) {
      if (argv[0] === 'config') {
        await rlSetConfig()
        return
      }

      const formattedArgv = parseArgv(argv)

      await execute(cliPath, formattedArgv)
    }
    else {
      logger.log(
        '在当前自定义路径中,未找到微信web开发者命令行工具，请重新指定路径',
      )
      await rlSetConfig()
    }
  }
  else {
    logger.log(`微信web开发者工具不支持当前平台：${operatingSystemName} !`)
  }
}
