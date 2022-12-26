/**
 *****************************************
 * Created by edonet@163.com
 * Created on 2022-12-18 16:33:13
 *****************************************
 */
'use strict';


/**
 *****************************************
 * 加载依赖
 *****************************************
 */
import { describe, test, expect } from '@jest/globals';
import { load, run, compile } from '../src';


/**
 *****************************************
 * 测试模块
 *****************************************
 */
describe('compile', () => {

  /* load file */
  test('load file', () => {
    const { compile } = load('./src') as typeof import('../src');

    // 校验对象
    expect(compile<{ name: string }>('./esb.js', 'export const name = "esb"')).toEqual({ name: 'esb' });
    expect(compile<{ name: string }>('./esb.ts', 'export const name: string = "esb"')).toEqual({ name: 'esb' });
  });

  /* run code */
  test('run code', () => {
    const { resolve } = run('export * from "path"') as typeof import('path');
    const { config } = run('export * from "@ainc/jest"') as typeof import('@ainc/jest');

    // 校验原生模块
    expect(resolve('./test/compile.spec.ts')).toEqual(__filename);

    // 校验第三方模块
    expect(config.rootDir).toEqual(process.cwd());
  });

  /* compile JavaScript */
  test('compile JavaScript', () => {
    expect(compile<{ name: string }>('./esb.js', 'export const name = "esb"')).toEqual({ name: 'esb' });
  });

  /* compile TypeScript */
  test('compile TypeScript', () => {
    expect(compile<{ name: string }>('./esb.ts', 'export const name: string = "esb"')).toEqual({ name: 'esb' });
  });
});
