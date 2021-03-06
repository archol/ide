import * as tsm from 'ts-morph'
import ts from 'typescript'
import { loadApp } from './app'
import { SourceRef, TsNode, Workspace, unkownErrorPos } from './types'

export async function loadWorkspace(path: string): Promise<Workspace> {
  const proj = new tsm.Project({
    manipulationSettings: {

    },
    tsConfigFilePath: path + '/ws/tsconfig.json'
  })
  const ws: Workspace = {
    kind: "Workspace",
    sourceRef: unkownErrorPos,
    defaultLang: {
      kind: 'StringConst',
      sourceRef: unkownErrorPos,
      str: 'pt_BR'
    },
    path: path,
    ts: proj,
    apps: proj.getSourceFiles()
      .filter((s) => s.getBaseName().endsWith('.app.ts'))
      .map((s) => s.getBaseName().replace(/\.app\.ts$/g, '')),
    loadApp(appName: string) {
      return loadApp(ws, appName)
    },
    diagnostics: {},
    warn(errId: string, tsNode: TsNode | TsNode[], errMsg?: string): void {
      ws.diagnostics[errId] = {
        msg: errMsg || errId,
        sourceRefs: ws.getRefs(tsNode) || [unkownErrorPos],
        kind: 'warn',
        archol: new Error(errMsg || errId)
      }
    },
    error(errId: string, tsNode: TsNode | TsNode[], errMsg?: string): void {
      ws.diagnostics[errId] = {
        msg: errMsg || errId,
        sourceRefs: ws.getRefs(tsNode) || [unkownErrorPos],
        kind: 'error',
        archol: new Error(errMsg || errId)
      }
    },
    fatal(errId: string, tsNode: TsNode | TsNode[], errMsg?: string): Error {
      ws.diagnostics[errId] = {
        msg: errMsg || errId,
        sourceRefs: ws.getRefs(tsNode),
        kind: 'fatal',
        archol: new Error(errMsg || errId)
      }
      return new Error(errMsg || errId)
    },
    getRefs(tsNode: any): SourceRef[] {
      if (Array.isArray(tsNode)) return tsNode.map(ws.getRef)
      else return [ws.getRef(tsNode)]
    },
    getRef(tsNode2: any): SourceRef {
      if (tsNode2.file && tsNode2.start && tsNode2.end) return tsNode2 as any
      if (tsNode2.kind && tsNode2.sourceRef) return tsNode2.sourceRef
      if (tsNode2 instanceof tsm.Node) {
        const start = tsNode2.getSourceFile().getLineAndColumnAtPos(tsNode2.getStart())
        const end = tsNode2.getSourceFile().getLineAndColumnAtPos(tsNode2.getEnd())
        return {
          file: tsNode2.getSourceFile().getFilePath(),
          start: {
            pos: tsNode2.getStart(),
            row: start.line,
            col: start.column,
          },
          end: {
            pos: tsNode2.getEnd(),
            row: end.line,
            col: end.column,
          },
        }
      }
      if (tsNode2 instanceof tsm.SourceFile) {
        const start = tsNode2.getLineAndColumnAtPos(tsNode2.getStart())
        const end = tsNode2.getLineAndColumnAtPos(tsNode2.getEnd())
        return {
          file: tsNode2.getFilePath(),
          start: {
            pos: tsNode2.getStart(),
            row: start.line,
            col: start.column,
          },
          end: {
            pos: tsNode2.getEnd(),
            row: end.line,
            col: end.column,
          },
        }
      }
      if (ts.isToken(tsNode2)) {
        const start = tsNode2.getSourceFile().getLineAndColumnAtPos(tsNode2.getStart())
        const end = tsNode2.getSourceFile().getLineAndColumnAtPos(tsNode2.getEnd())
        return {
          file: tsNode2.getSourceFile().getFilePath(),
          start: {
            pos: tsNode2.getStart(),
            row: start.line,
            col: start.column,
          },
          end: {
            pos: tsNode2.getEnd(),
            row: end.line,
            col: end.column,
          },
        }
      }
      // if (ts.isSourceFile(tsNode2)) {
      //   const start = tsNode2.getLineAndColumnAtPos(tsNode2.getStart())
      //   const end = tsNode2.getLineAndColumnAtPos(tsNode2.getEnd())
      //   return {
      //     file: tsNode2.getFilePath(),
      //     start: {
      //       pos: tsNode2.getStart(),
      //       row: start.line,
      //       col: start.column,
      //     },
      //     end: {
      //       pos: tsNode2.getEnd(),
      //       row: end.line,
      //       col: end.column,
      //     },
      //   }
      // }
      throw new Error('invalid source node')
    },
    allApplications() {
      return ws.ts.getSourceFiles()
        .map(s => s.getFilePath())
        .filter(s => s.endsWith('.comp.ts'))
        .map((s) => s.replace(/\.app\.ts$/g, '').substr(ws.path.length + 4))
    },
    allComponents() {
      return ws.ts.getSourceFiles()
        .map(s => s.getFilePath())
        .filter(s => s.endsWith('.comp.ts'))
        .map((s) => s.replace(/\.comp\.ts$/g, '').substr(ws.path.length + 4))
    },
  }
  return ws
}
