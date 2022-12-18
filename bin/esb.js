#!/usr/bin/env node

/**
 *****************************************
 * Created by edonet@163.com
 * Created on 2022-12-15 22:51:07
 *****************************************
 */
'use strict';


/**
 *****************************************
 * 执行脚本
 *****************************************
 */
run();


/**
 *****************************************
 * 脚本
 *****************************************
 */
function run() {
  const args = process.argv.slice(1);
  const [cmd, script] = args;

  // 解析命令
  switch (cmd) {
    case '-p':
    case '--project':
      if (args.length > 1) {
        require('../dist/cli').run(args.slice(1));
      }
      return;
    case '-e':
    case '--eval':
      if (script) {
        require('../dist/compile').run(script);
      }
      return;
    case undefined:
    case '-h':
    case '--help':
      return showHelp();
    case '-v':
    case '--version':
      return showVersion();
    default:
      if (script && cmd.charAt(0) !== '-') {
        require('../dist/compile').load(script);
      } else {
        showHelp();
      }
      break;
  }
}


/**
 *****************************************
 * 显示帮助
 *****************************************
 */
function showHelp() {
  console.log(`esb v${require('../package.json').version}\n${require('./info')}`);
}

/**
 *****************************************
 * 显示版本
 *****************************************
 */
function showVersion() {
  console.log('v' + require('../package.json').version);
}
