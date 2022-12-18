/**
 *****************************************
 * Created by edonet@163.com
 * Created on 2022-12-18 14:10:03
 *****************************************
 */
'use strict';


/**
 *****************************************
 * 加载依赖
 *****************************************
 */
import { extname } from 'path';
import { buildSync, Loader } from 'esbuild';


/**
 *****************************************
 * 转换代码
 *****************************************
 */
export function transform(filename: string, code: string) {
  const res = buildSync({
    platform: 'node',
    format: 'cjs',
    write: false,
    bundle: true,
    sourcemap: 'inline',
    minify: false,
    outfile: 'out.js',
    external: ['esbuild'],
    stdin: {
      contents: code,
      sourcefile: filename,
      loader: extname(filename).slice(1) as Loader,
      resolveDir: process.cwd(),
    },
  });

  // 存在错误
  if (res.errors?.length) {
    throw new Error(res.errors.map(err => err.text).join('\n'));
  }

  // 返回结果
  return res.outputFiles[0]?.text || '';
}

