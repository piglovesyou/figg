import commandLineArgs, { OptionDefinition } from 'command-line-args';
import { cosmiconfig } from 'cosmiconfig';
import { config } from 'dotenv';
import { dirname, join, relative } from 'path';
import * as defaultStartegyModule from '../strategies/react';
import { StrategyModule } from '../types/strategy';

config();

const MODULE_NAME = 'fig';

interface _FigConfigBase<StrategySpecifier> {
  baseDir?: string;
  componentsDir?: string;
  pagesDir?: string;
  htmlDir?: string;
  imagesDir?: string;
  strategy: StrategySpecifier;
  fileKeys: string[];
  token?: string;
}

export type FigUserConfig = _FigConfigBase<string>;

export type FigConfig = Required<_FigConfigBase<StrategyModule>>;

const DEFAULT_FIG_CONFIG: FigConfig = {
  baseDir: '.',
  componentsDir: 'components',
  pagesDir: 'pages',
  htmlDir: 'public',
  imagesDir: 'images',
  strategy: defaultStartegyModule,
  fileKeys: [],
  token: '',
};

export const commandLineOptions: OptionDefinition[] = Object.keys(
  DEFAULT_FIG_CONFIG
).map((prop) => {
  const o: OptionDefinition = { name: prop };
  switch (prop) {
    case 'fileKeys':
      return { ...o, multiple: true, defaultOption: true };
    default:
      return { ...o, type: String };
  }
});

// export async function applyDefaultConfig(
//   config: FigUserConfig,
//   configFullPath?: string
// ): Promise<FigConfig> {
//   return {
//     ...DEFAULT_FIG_CONFIG,
//     ...config,
//     strategy: await loadStrategy(config.strategy, configFullPath),
//   };
// }

export function verifyConfig(config: FigConfig) {
  const { strategy } = config;
  if (!strategy) throw new Error('Specify strategy.');
}

async function loadStrategy(
  strategyName: FigUserConfig['strategy'],
  configFullPath?: string
): Promise<StrategyModule> {
  if (strategyName.startsWith('./')) {
    if (!configFullPath) throw new Error(`Never`);
    const moduleFullPath = join(dirname(configFullPath), strategyName);
    const moduleRelPath = relative(__dirname, moduleFullPath);
    return await import(
      moduleRelPath.startsWith('.') ? moduleRelPath : './' + moduleRelPath
    );
  }
  return await import(`../strategies/${strategyName}`);
}

function loadCommandLineArgs() {
  const options = commandLineArgs(commandLineOptions);
  const contented = Object.entries(options).filter(([, v]) =>
    Array.isArray(v) ? v.length : v
  );
  return Object.fromEntries(contented);
}

function applyDefaultConfig(
  userConfig: FigUserConfig
): Required<FigUserConfig> {
  return {
    ...DEFAULT_FIG_CONFIG,
    token: process.env.TOKEN || '',
    ...userConfig,
  };
}

export async function createConfig(
  userConfig: _FigConfigBase<string>,
  cwd: string = process.cwd()
) {
  const fullConfig: Required<FigUserConfig> = applyDefaultConfig(userConfig);

  const config: FigConfig = {
    ...fullConfig,
    strategy: await loadStrategy(userConfig.strategy, cwd),
  };

  return config;
}

export async function loadConfig(): Promise<FigConfig> {
  const explorer = await cosmiconfig(MODULE_NAME);
  const result = await explorer.search();

  const rcConfig: FigUserConfig = result?.config || {};
  const cwd: string = result?.filepath
    ? dirname(result.filepath)
    : process.cwd();

  const config = await createConfig(
    {
      ...rcConfig,
      ...loadCommandLineArgs(),
    },
    cwd
  );

  verifyConfig(config);
  return config;
}
