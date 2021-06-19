import Listr from 'listr';
import makeDir from 'make-dir';
import pMap from 'p-map';
import pReduce from 'p-reduce';
import { join } from 'path';
import { Observable } from 'rxjs';
import { requestFile } from '../core/api';
import { FigConfig } from '../core/config';
import { printInfo } from '../core/print';
import { FigmaFile } from '../types/fig';
import { ComponentInfo, GenContext } from '../types/gen';
import { FigPlugin } from '../types/plugin';
import { writeFile } from '../utils/fs';
import { appendImagesMap, makeExistingImagesMap } from './images-map';
import { makeGenContext } from './make-gen-context';
import { processComponent } from './process-component';
import { appendVectorsMap } from './vectors-map';

export async function processHtml(
  componentInfo: ComponentInfo,
  genContext: GenContext
) {
  const { node, name } = componentInfo;
  if (node.type !== 'FRAME')
    throw new Error('Never. node.type should be FRAME');
  const { plugins } = genContext;
  if (!plugins) throw new Error('Never. Plugins should be instantiated.');

  const html = (await pReduce(
    plugins,
    (html, plugin) => {
      return plugin.renderHtml(componentInfo, genContext);
    },
    null as null | ReturnType<FigPlugin<unknown>['renderHtml']>
  ))!;

  await writeFile(join(genContext.htmlFullDir, name + '.html'), html);
}

async function genWithFileKey(
  fileKey: string,
  token: string,
  config: FigConfig,
  cwd: string
) {
  const listrCtx = await new Listr<{
    figmaFile: FigmaFile;
    genContext: GenContext;
    frames: ComponentInfo[];
    components: ComponentInfo[];
  }>([
    {
      title: `Fetching Figma file data of "${fileKey}"`,
      task: async (ctx) => {
        const figmaFile: FigmaFile = await requestFile(fileKey, token);
        const genContext = await makeGenContext(
          figmaFile,
          fileKey,
          config,
          cwd
        );
        Object.assign(ctx, { figmaFile, genContext });
      },
    },
    {
      title: `Synchronizing images`,
      task: async (ctx) => {
        const { genContext } = ctx;
        const existingImagesMap = await makeExistingImagesMap(
          genContext.imagesFullDir
        );

        return new Listr(
          [
            {
              title: `Synchronizing bitmaps`,
              task: async () => {
                return new Observable<string>((progress) => {
                  progress.next(`Preparing`);
                  appendImagesMap(
                    genContext,
                    fileKey,
                    token,
                    existingImagesMap,
                    progress
                  ).finally(() => progress.complete());
                });
              },
            },
            {
              title: `Sychronizing vectors`,
              task: async () => {
                return new Observable<string>((progress) => {
                  progress.next(`Preparing`);
                  appendVectorsMap(
                    genContext,
                    fileKey,
                    token,
                    existingImagesMap,
                    progress
                  ).finally(() => progress.complete());
                });
              },
            },
          ],
          { concurrent: true }
        );
      },
    },
    {
      title: `Synchronizing components`,
      task: async (ctx) => {
        const { genContext } = ctx;
        const { componentsMap } = genContext;
        const components: ComponentInfo[] = [];
        const frames: ComponentInfo[] = [];
        for (const [, componentInfo] of componentsMap) {
          const { node } = componentInfo;
          if (node.type === 'FRAME') frames.push(componentInfo);
          else components.push(componentInfo);
        }
        Object.assign(ctx, { frames, components });

        return new Listr([
          {
            title: `Components`,
            task: async (ctx) => {
              return new Observable<string>((progress) => {
                pMap(components, (componentInfo, i) => {
                  progress.next(`${i}/${components.length}`);
                  processComponent(componentInfo, genContext);
                }).finally(() => progress.complete());
              });
            },
          },
          {
            title: `Pages`,
            task: async (ctx) => {
              return new Observable<string>((progress) => {
                pMap(frames, (componentInfo, i) => {
                  progress.next(`${i}/${frames.length}`);
                  processComponent(componentInfo, genContext);
                }).finally(() => progress.complete());
              });
            },
          },
        ]);
        // Generate components to "./components"
        // updateLog(`Generating ${components.length} components..`);
        // await pMap(componentsMap, ([, componentInfo]) =>
        //   processComponent(componentInfo, genContext)
        // );

        // Generate components to "./pages"
        // updateLog(`Generating ${frames.length} page components..`);
        // await pMap(componentsMap, ([, componentInfo]) =>
        //   processComponent(componentInfo, genContext)
        // );
      },
    },
    {
      title: `Generating HTML samples`,
      task: async (ctx) => {
        const { genContext, frames } = ctx;
        const { plugins } = genContext;
        for (const plugin of plugins) await plugin.dispose();

        // Generate html to "./public"
        // updateLog(`Generating ${frames.length} HTMLs..`);
        await makeDir(genContext.htmlFullDir);
        await pMap(frames, (componentInfo) => {
          return processHtml(componentInfo, genContext);
        });
      },
    },

    // {
    //   title: ``,
    //   task: async ctx => {},
    // },
  ]).run();

  // updateLog(`Fetching data of "${fileKey}"..`);
  // const figmaFile: FigmaFile = await requestFile(fileKey, token);

  // updateLog(`Fetching image resources..`);
  // // const genContext = await makeGenContext(figmaFile, fileKey, config, cwd);
  // const { componentsMap, plugins } = genContext;
  //
  // const existingImagesMap = await makeExistingImagesMap(
  //   genContext.imagesFullDir
  // );
  //
  // await appendImagesMap(genContext, fileKey, token, existingImagesMap);
  // await appendVectorsMap(genContext, fileKey, token, existingImagesMap);

  // const components: ComponentInfo[] = [];
  // const frames: ComponentInfo[] = [];
  // for (const [, componentInfo] of componentsMap) {
  //   const { node } = componentInfo;
  //   if (node.type === 'FRAME') frames.push(componentInfo);
  //   else components.push(componentInfo);
  // }
  //
  // // Generate components to "./components"
  // updateLog(`Generating ${components.length} components..`);
  // await pMap(componentsMap, ([, componentInfo]) =>
  //   processComponent(componentInfo, genContext)
  // );
  //
  // // Generate components to "./pages"
  // updateLog(`Generating ${frames.length} page components..`);
  // await pMap(componentsMap, ([, componentInfo]) =>
  //   processComponent(componentInfo, genContext)
  // );

  // Generate html to "./public"
  // updateLog(`Generating ${frames.length} HTMLs..`);
  // await makeDir(genContext.htmlFullDir);
  // await pMap(frames, (componentInfo) => {
  //   return processHtml(componentInfo, genContext);
  // });

  const { genContext, figmaFile, frames, components } = listrCtx;
  const { imagesMap } = genContext;

  printInfo(
    `"${figmaFile.name}" done. ${imagesMap.size} images, ${components.length} components, ${frames.length} pages and HTMLs are synchronized.`
  );
}

export async function gen(
  config: FigConfig,
  cwd = process.cwd()
): Promise<void> {
  const { fileKeys, token } = config;
  for (const fileKey of fileKeys)
    await genWithFileKey(fileKey, token, config, cwd);
}
