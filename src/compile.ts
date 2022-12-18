/**
 *****************************************
 * Created by edonet@163.com
 * Created on 2022-12-14 22:05:05
 *****************************************
 */
'use strict';


/**
 *****************************************
 * 加载依赖
 *****************************************
 */
import { System } from 'typescript';
import { Script } from './script';


/**
 *****************************************
 * 解析参数
 *****************************************
 */
function resolveArgs(args: string[]) {
  const include: string[] = [];

  // 处理参数
  while (args.length && args[0].charAt(0) !== '-') {
    include.push(args.shift() as string);
  }

  // 返回结果
  return include;
}


/**
 *****************************************
 * TypeScript 接口
 *****************************************
 */
interface TS {
  sys: System;
  noop(): void;
  findConfigFile(path: string, fileExists: (path: string) => boolean): string | undefined;
  executeCommandLine(sys: System, cb: () => void, args: string[]): void;
}


/**
 *****************************************
 * 转换代码
 *****************************************
 */
function transform(next: (this: object, code: string, filename: string) => void) {
  return function _compile(this: object, code: string, filename: string) {
    const idx = code.lastIndexOf('ts.executeCommandLine(ts.sys, ts.noop, ts.sys.args);');

    // 更新源码
    if (idx !== -1) {
      code = code.slice(0, idx) + 'module.exports = { ts };';
    }

    // 编译代码
    return next.call(this, code, filename);
  };
}


/**
 *****************************************
 * 加载脚本
 *****************************************
 */
function loadScript() {
  const id = require.resolve('typescript/lib/tsc.js');
  const script = new Script<{ ts?: TS }>(id, module);

  // 更新编译方法
  script._compile = transform(script._compile);

  // 加载脚本文件
  script.load(id);

  // 返回结果
  return script.exports;
}


/**
 *****************************************
 * 缓存配置
 *****************************************
 */
function createConfigFile(sys: System, key: string, value: string) {
  const sysFileExists = sys.fileExists;
  const sysReadFile = sys.readFile;

  // 添加配置文件
  sys.args.push('-p', key);

  // 劫持文件存在方法
  sys.fileExists = function fileExists(path: string) {
    if (key !== path) {
      return sysFileExists(path);
    }

    // 恢复方法
    sys.fileExists = sysFileExists;

    // 返回结果
    return true;
  };

  // 劫持读取文件方法
  sys.readFile = function readFile(path: string, encoding: string) {
    if (key !== path) {
      return sysReadFile(path, encoding);
    }

    // 恢复方法
    sys.readFile = sysReadFile;

    // 返回结果
    return value;
  };
}


/**
 *****************************************
 * 执行编译
 *****************************************
 */
export function compile() {
  const { ts } = loadScript();

  // 未加载接口
  if (!ts) {
    return;
  }

  // 获取文件系统
  const { sys, noop } = ts;

  // 定义项目编译
  if (sys.args.find(val => ['-p', '--project'].includes(val))) {
    return ts.executeCommandLine(sys, noop, sys.args);
  }

  // 获取文件
  const include = resolveArgs(sys.args);

  // 未指定打包文件
  if (!include.length) {
    return ts.executeCommandLine(sys, noop, sys.args);
  }

  // 设置配置文件
  createConfigFile(sys, '.esconfig.json', JSON.stringify({
    include,
    extends: ts.findConfigFile(sys.getCurrentDirectory(), sys.fileExists),
  }));

  // 执行脚本
  ts.executeCommandLine(sys, noop, sys.args);
}
