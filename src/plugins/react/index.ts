import { transformFromAstSync } from '@babel/core';
import generate from '@babel/generator';
import { NodePath } from '@babel/traverse';
import { isProgram, JSXElement, Program } from '@babel/types';
import { join } from 'path';
import Piscina from 'piscina';
import { format } from 'prettier';
import { ComponentInfo, GenContext } from '../../types/gen';
import { StrategyInterface } from '../../types/strategy';
import {
  ParentVisitContext,
  VisitContext,
  VisitContextWithCursor,
} from '../../types/visit';
import { RenderHtmlArgType } from './render-html';
import {
  appendComponentInstanceElement,
  appendElement,
  appendSvgContent,
  appendTextContext,
  erasePlaceholderElement,
  makeLayout,
} from './visit-utils';

function findReactResolvablePath(): string | never {
  const reactPath = require.resolve('react');
  for (const nodePath of require.resolve.paths('react') || [])
    if (reactPath.startsWith(nodePath)) return nodePath;
  throw new Error(`Never. Couldn't find react resolvable path.`);
}

class ReactStrategy implements StrategyInterface {
  genContext: GenContext;
  renderHtmlThread: Piscina;

  cursor: NodePath<JSXElement> | undefined;

  constructor(genContext: GenContext) {
    this.genContext = genContext;

    const { libDir } = genContext;
    // The reason using thread is to set NODE_PATH value, otherwise
    // components can't resolve "react" and "react-dom".
    this.renderHtmlThread = new Piscina({
      maxQueue: 'auto',
      filename: join(__dirname, '../../../dist/plugins/react/render-html.js'),
      env: {
        NODE_PATH: findReactResolvablePath(),
      },
    });
  }

  makeLayout({ node, name }: ComponentInfo) {
    const cursor = makeLayout(name);
    if (!cursor) throw new Error('should be found');
    this.cursor = cursor;
    return cursor;
  }

  postWalk() {
    if (!this.cursor)
      throw new Error(`Never. placeholderCursor must be set on postWalk() `);
    erasePlaceholderElement(this.cursor);
  }

  render(): [content: string, ext: string][] {
    if (!this.cursor) throw new Error(`Never. cursor must be set on render().`);
    const program: NodePath<Program> = this.cursor.findParent((path) =>
      isProgram(path.node)
    )! as NodePath<Program>;

    const { code: tsxCode } = generate(program.node);
    const { code: jsCode } = transformFromAstSync(program.node, undefined, {
      filename: 'a.tsx',
      cwd: __dirname,
      babelrc: false,
      plugins: [
        '@babel/plugin-transform-modules-commonjs',
        '@babel/plugin-transform-react-jsx',
        '@babel/plugin-transform-typescript',
      ],
    })!;

    return [
      [format(tsxCode, { parser: 'babel' }), '.tsx'],
      [format(jsCode!, { parser: 'babel' }), '.js'],
    ];
  }

  async renderHtml(componentInfo: ComponentInfo): Promise<string> {
    const { name } = componentInfo;
    let { pagesFullDir } = this.genContext;

    return await this.renderHtmlThread.run({
      pagesFullDir,
      name,
    } as RenderHtmlArgType);
  }

  appendComponentInstanceElement(
    context: VisitContext,
    parentContext: VisitContextWithCursor,
    genContext: GenContext
  ): void {
    appendComponentInstanceElement(context, parentContext, genContext);
  }

  appendElement(
    context: VisitContext,
    parentContext: ParentVisitContext,
    tagName: string = 'div'
  ): NodePath<JSXElement> {
    return appendElement(context, parentContext, tagName);
  }

  appendSvgElement(
    context: VisitContext,
    parentContext: ParentVisitContext,
    svgHtml: string
  ): void {
    appendSvgContent(context, parentContext, svgHtml);
  }

  appendTextElement(
    context: VisitContext,
    parentContext: ParentVisitContext
  ): void {
    const { node } = context;
    if (node.type !== 'TEXT')
      throw new Error(`Never. This function is supposed to emit on TEXT node.`);
    appendTextContext(context, parentContext);
  }

  async dispose(): Promise<void> {
    // return await this.renderHtmlThread.destroy();
  }
}

export function createStrategy(genContext: GenContext): ReactStrategy {
  return new ReactStrategy(genContext);
}
