/**
 *****************************************
 * Created by edonet@163.com
 * Created on 2021-07-07 22:35:20
 *****************************************
 */
'use strict';


/**
 *****************************************
 * 加载依赖
 *****************************************
 */
import { resolve, dirname, relative } from 'path';
import * as Module from 'module';
import * as ts from 'typescript';


/**
 *****************************************
 * 扩展类型
 *****************************************
 */
declare module 'typescript' {
  interface SourceFile {
    resolvedModules: ts.ESMap<string, ts.ResolvedModuleFull>;
  }
}


/**
 *****************************************
 * 定义转换器
 *****************************************
 */
export function transformer(context: ts.TransformationContext): ts.Transformer<ts.SourceFile> {
  const calls = ['import', 'require', 'require.resolve'];
  const factory = context.factory;
  const compilerOptions = context.getCompilerOptions();

  // 转换文件节点
  return (sourceFile: ts.SourceFile) => {
    const { fileName, resolvedModules } = sourceFile;
    const file = resolve(fileName);
    const dir = dirname(file);

    // 解析模块
    function resolveModule(id: string): void | ts.ResolvedModuleFull {
      const cached = resolvedModules.get(id);

      // 返回缓存
      if (cached) {
        return cached;
      }

      // 解析模块
      const { resolvedModule } = ts.resolveModuleName(id, file, compilerOptions, ts.sys);

      // 解析失败
      if (!resolvedModule) {
        return;
      }

      // 更新缓存
      resolvedModules.set(id, resolvedModule);

      // 返回结果
      return resolvedModule;
    }

    // 访问模块节点
    function visitModuleSpecifier(node: ts.Node): ts.Node {
      if (ts.isStringLiteral(node)) {
        const { text } = node || {};

        // 不处理相对模块
        if (text && !Module.builtinModules.includes(text) && text.charAt(0) !== '.') {
          const resolved = resolveModule(text);

          // 不处理外部模块
          if (resolved && !resolved.isExternalLibraryImport) {
            const { resolvedFileName, extension } = resolved;

            // 生成节点
            return factory.createStringLiteral(
              relative(dir, resolve(resolvedFileName.slice(0, -extension.length))),
            );
          }
        }
      }

      // 返回原节点
      return node;
    }

    // 访问调用节点
    function visitCallDeclaration(node: ts.Node): ts.Node {
      if (ts.isCallExpression(node)) {
        const id = node.expression.getText();

        // 匹配函数名且只有一个参数时处理
        if (calls.includes(id) && node.arguments.length === 1 && ts.isStringLiteral(node.arguments[0])) {
          return factory.updateCallExpression(
            node,
            node.expression,
            node.typeArguments,
            ts.visitNodes(node.arguments, visitModuleSpecifier),
          );
        }
      }

      // 访问子节点
      return ts.visitEachChild(node, visitCallDeclaration, context);
    }

    // 访问文件子节点
    function visitSourceFile(node: ts.Node): ts.Node {

      // 处理载入节点
      if (ts.isImportDeclaration(node)) {
        return ts.visitEachChild(node, visitModuleSpecifier, context);
      }

      // 处理抛出节点
      if (ts.isExportDeclaration(node)) {
        return ts.visitEachChild(node, visitModuleSpecifier, context);
      }

      // 返回节点
      return visitCallDeclaration(node);
    }

    // 访问文件子节点
    return ts.visitEachChild(sourceFile, visitSourceFile, context);
  };
}
