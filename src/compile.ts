/**
 *****************************************
 * Created by edonet@163.com
 * Created on 2022-12-18 13:44:35
 *****************************************
 */
'use strict';


/**
 *****************************************
 * 加载依赖
 *****************************************
 */
import * as ts from 'typescript';
import { sys } from 'typescript';
import { transformer as transformModulePaths } from './helpers/module-paths-transformer';


/**
 *****************************************
 * 定义文件系统
 *****************************************
 */
const sysFormatDiagnosticsHost = {
  getCurrentDirectory: () => sys.getCurrentDirectory(),
  getNewLine: () => sys.newLine,
  getCanonicalFileName: (path: string) => path,
};


/**
 *****************************************
 * 打印带日期信息
 *****************************************
 */
function createDateTimeWritor(write: (content: string) => void) {
  return (content: string) => {
    return write(`[\x1B[90m${new Date().toLocaleTimeString()}\x1B[0m] ${content} ${sys.newLine}${sys.newLine}`);
  };
}


/**
 *****************************************
 * 打印错误信息
 *****************************************
 */
function reportDiagnostic(diagnostic: ts.Diagnostic) {
  reportDiagnostics([diagnostic]);
}


/**
 *****************************************
 * 打印错误信息
 *****************************************
 */
function reportUnrecoverableDiagnostic(diagnostic: ts.Diagnostic) {
  reportDiagnostic(diagnostic);
  sys.exit(1);
}


/**
 *****************************************
 * 打印多条错误信息
 *****************************************
 */
function reportDiagnostics(diagnostics: readonly ts.Diagnostic[]): void {
  sys.write(ts.formatDiagnosticsWithColorAndContext(diagnostics, sysFormatDiagnosticsHost));
}

/**
 *****************************************
 * 打印错误信息且展示总结信息
 *****************************************
 */
function reportDiagnosticsAndSummary(diagnostics: readonly ts.Diagnostic[]): void {
  const diag = ts.sortAndDeduplicateDiagnostics(diagnostics);

  // 打印错误
  reportDiagnostics(diag);

  // 打印错误总数
  sys.write(`Found ${diag.length} errors.`);
}


/**
 *****************************************
 * 打印监听状态
 *****************************************
 */
function reportWatchStatus(diagnostic: ts.Diagnostic): void {
  const { code } = diagnostic;

  // 清空屏幕
  if (code === 6031 || code === 6032) {
    sys.clearScreen ? sys.clearScreen() : console.clear();
  }

  // 打印信息
  diagnostic.file ? reportDiagnostic(diagnostic) : sys.write(diagnostic.messageText as string || '');
}


/**
 *****************************************
 * 配置
 *****************************************
 */
type ParsedConfig = ReturnType<typeof parseCommandLineConfig>;


/**
 *****************************************
 * 解析配置文件
 *****************************************
 */
function parseCommandLineConfig(commandLine: ts.ParsedCommandLine) {
  const host = Object.create(sys) as ts.ParseConfigFileHost;
  const configFile = '.esconfig.json';
  const extendedConfigCache = new Map<string, ts.ExtendedConfigCacheEntry>();

  // 处理错误
  host.onUnRecoverableConfigFileDiagnostic = reportUnrecoverableDiagnostic;

  // 文件存在函数
  host.fileExists = (path: string) => {
    return path === configFile ? true : sys.fileExists(path);
  };

  // 读取文件
  host.readFile = (path: string, encoding?: string) => {
    if (path !== configFile) {
      return sys.readFile(path, encoding);
    } else {
      return JSON.stringify({
        include: commandLine.fileNames,
        extends: ts.findConfigFile(sys.getCurrentDirectory(), sys.fileExists),
      });
    }
  };

  // 解析配置文件
  const result = ts.getParsedCommandLineOfConfigFile(
    configFile,
    commandLine.options,
    host,
    extendedConfigCache,
    commandLine.watchOptions,
  );

  // 返回配置
  return {
    configFile,
    result,
    watch: !!result?.options.watch,
    options: result?.options,
    extendedConfigCache,
    optionsToExtend: commandLine.options,
    watchOptionsToExtend: commandLine.watchOptions,
  };
}


/**
 *****************************************
 * 分发应用文件
 *****************************************
 */
function emitProgramSourceFile(program: ts.Program | ts.BuilderProgram, sourceFile?: ts.SourceFile, cancellationToken?: ts.CancellationToken): void {
  const compilerOptions = program.getCompilerOptions();
  const diagnostics: ts.Diagnostic[] = [];

  // 获取诊断信息
  diagnostics.push(...program.getConfigFileParsingDiagnostics());
  diagnostics.push(...program.getOptionsDiagnostics(cancellationToken));
  diagnostics.push(...program.getSyntacticDiagnostics(sourceFile, cancellationToken));
  diagnostics.push(...program.getGlobalDiagnostics(cancellationToken));
  diagnostics.push(...program.getSemanticDiagnostics(sourceFile, cancellationToken));
  diagnostics.push(...program.getDeclarationDiagnostics(sourceFile, cancellationToken));

  // 存在诊断信息
  if (diagnostics.length) {
    return reportDiagnosticsAndSummary(diagnostics);
  }

  // 分发文件
  const result = program.emit(
    sourceFile,
    undefined,
    cancellationToken,
    compilerOptions.emitDeclarationOnly,
    {
      before: [transformModulePaths],
      after: [],
    },
  );

  // 显示诊断信息
  if (result.diagnostics.length) {
    return reportDiagnosticsAndSummary(result.diagnostics);
  }

  // 打印日志
  sys.write('Found 0 errors.');
}


/**
 *****************************************
 * 监听文件服务器
 *****************************************
 */
interface WatchCompilerHost extends ts.WatchCompilerHostOfConfigFile<ts.SemanticDiagnosticsBuilderProgram> {
  configFileParsingResult?: ts.ParsedCommandLine;
  extendedConfigCache?: Map<string, ts.ExtendedConfigCacheEntry>;
}


/**
 *****************************************
 * 监听应用
 *****************************************
 */
function watch(config: ParsedConfig) {
  const host: WatchCompilerHost = ts.createWatchCompilerHost(
    config.configFile,
    config.options,
    sys,
    ts.createSemanticDiagnosticsBuilderProgram,
    reportDiagnostic,
    reportWatchStatus,
  );

  // 更新属性
  host.onUnRecoverableConfigFileDiagnostic = reportUnrecoverableDiagnostic;
  host.configFileParsingResult = config.result;
  host.configFileName = config.configFile;
  host.optionsToExtend = config.optionsToExtend;
  host.watchOptionsToExtend = config.watchOptionsToExtend;
  host.extendedConfigCache = config.extendedConfigCache;
  host.extraFileExtensions = undefined;
  host.afterProgramCreate = emitProgramSourceFile;

  // 更新输出函数
  sys.write = createDateTimeWritor(sys.write);

  // 创建应用
  ts.createWatchProgram(host);
}


/**
 *****************************************
 * 编译应用
 *****************************************
 */
function build(config: ts.ParsedCommandLine) {
  const host = ts.createCompilerHost(config.options);

  // 打印信息
  sys.write('Starting compilation...');

  // 分发应用文件
  emitProgramSourceFile(ts.createProgram({
    rootNames: config.fileNames,
    options: config.options,
    projectReferences: config.projectReferences,
    host,
    configFileParsingDiagnostics: ts.getConfigFileParsingDiagnostics(config),
  }));
}


/**
 *****************************************
 * 执行编译
 *****************************************
 */
export function compile(args: string[]) {
  const config = parseCommandLineConfig(ts.parseCommandLine(args, sys.readFile));

  // 不存在配置
  if (!config.result) {
    return;
  }

  // 执行编译
  config.watch ? watch(config) : build(config.result);
}
