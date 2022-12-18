/**
 *****************************************
 * Created by edonet@163.com
 * Created on 2022-12-18 19:46:49
 *****************************************
 */
'use strict';


/**
 *****************************************
 * 帮助信息
 *****************************************
 */
module.exports = `
Usage: esb [OPTION] [FILE]

  esb ./src
  esb -p ./src
  esb -e  "export * from './src'"

Options:
  -p, --project    compile project.
  -e, --eval       eval source code.
  -w, --watch      watch input files.
  -h, --help       show help.
  -v, --version    show version
`;
