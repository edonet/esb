/**
 *****************************************
 * Created by edonet@163.com
 * Created on 2022-12-17 18:53:31
 *****************************************
 */
'use strict';


/**
 *****************************************
 * 脚本对象
 *****************************************
 */
interface Script<T = unknown> {

  /** 模块ID */
  id: string;

  /** 文件名 */
  filename: string;

  /** 子模块 */
  children: Script[];

  /** 抛出接口 */
  exports: T;

  /** 源码 */
  _code?: string;

  /** 加载文件 */
  load(filename: string): void;

  /** 导入模块 */
  require(id: string): unknown;

  /** 编译模块 */
  _compile(code: string, filename: string): void;
}


/**
 *****************************************
 * 处理函数
 *****************************************
 */
interface Handler {
  (script: Script, filename: string): void;
}


/**
 *****************************************
 * 加载模块
 *****************************************
 */
export const Script = require('module') as {

  /** 缓存对象 */
  _cache: Record<string, Script>;

  /** 扩展对象 */
  _extensions: Record<string, void | Handler>;

  /** 初始化对象 */
  new <T>(filename: string, script: Script | NodeModule): Script<T>;
};

