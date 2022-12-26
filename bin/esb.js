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


/**
 *****************************************
 * 脚本
 *****************************************
 */
function run() {
  const args = process.argv.slice(2);
  const [argv, script] = args;

  // 解析命令
  switch (argv) {
    case '-p':
    case '--project':
      if (args.length > 1) {
        require('../dist/compile.js').compile(args.slice(1));
      }
      return;
    case '-e':
    case '--eval':
      if (script) {
        require('../dist/index.js').run(script);
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
      if (argv.charAt(0) !== '-') {
        require('../dist/index.js').load(argv);
      } else {
        showHelp();
      }
      break;
  }
}


/**
 *****************************************
 * 执行脚本
 *****************************************
 */
run();
