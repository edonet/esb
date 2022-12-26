/**
 *****************************************
 * Created by edonet@163.com
 * Created on 2022-12-13 23:52:10
 *****************************************
 */
'use strict';


/**
 *****************************************
 * 加载依赖
 *****************************************
 */
import { resolve, dirname } from 'path';
import { Script } from './script';
import { transform } from './transform';


/**
 *****************************************
 * 编译代码
 *****************************************
 */
export function compile<T>(filename: string, code: string) {
  const script = new Script<T>(filename, module);

  // 更新属性
  script.filename = filename;
  script.paths = Script._nodeModulePaths(dirname(filename));

  // 执行编译
  script._compile(transform(filename, code), filename);

  // 编译完成
  script.loaded = true;

  // 返回导出对象
  return script.exports;
}


/**
 *****************************************
 * 执行代码
 *****************************************
 */
export function run<T>(code: string, filename = '.script.js'): T {
  if (code && typeof code === 'string') {
    return compile<T>(resolve(filename), code);
  } else {
    return {} as T;
  }
}


/**
 *****************************************
 * 加载文件
 *****************************************
 */
export function load<T>(filename: string): T {
  return run<T>(
    `module.exports = require(${JSON.stringify(resolve(filename))});`,
  );
}
