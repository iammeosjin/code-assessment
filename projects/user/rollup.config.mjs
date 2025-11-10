import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import fs from 'fs';
import { writeFile } from 'fs/promises';
import { globSync } from 'glob';
import path from 'path';
import copy from 'rollup-plugin-copy';
import swc3 from 'rollup-plugin-swc3';
import { fileURLToPath } from 'url';

const absolutePath = (path) =>
  fileURLToPath(new URL(`../../${path}`, import.meta.url));

const packageJson = JSON.parse(fs.readFileSync('package.json').toString());

function getInputs(filePaths) {
  const inputs = {};

  filePaths.forEach((filePath) => {
    const filteredFiles = globSync(filePath).filter(
      (file) =>
        !['.spec.ts', '.config.ts', '.test.ts', '.d.ts'].some((pattern) =>
          file.endsWith(pattern),
        ),
    );

    const entries = filteredFiles.map((file) => [
      file.slice(0, file.length - path.extname(file).length),
      absolutePath(file),
    ]);

    Object.assign(inputs, Object.fromEntries(entries));
  });

  return inputs;
}

function copyPackageVersion() {
  fs.mkdirSync(absolutePath('./dist/user/projects/user/src/apps'), {
    recursive: true,
  });

  const filePath = absolutePath(
    './dist/user/projects/user/src/apps/version.json',
  );

  const version = {
    version: packageJson.version,
  };

  fs.writeFileSync(filePath, JSON.stringify(version));
}

function generatePackageJSON() {
  return {
    name: 'generate-package-json',
    generateBundle: async (_, bundles) => {
      const dependencies = Object.entries(packageJson.dependencies);

      const externalDependencies = {
        '@swc/helpers': packageJson.dependencies['@swc/helpers'],
      };

      const matcher1 = new RegExp(/(require).*/g);
      const matcher2 = new RegExp(/(?!require\(")[^"][^"]+(?="\))/g);

      const importDependency = Object.values(bundles).flatMap(
        ({ code }) => code.match(matcher1) || [],
      );

      const imports = importDependency
        .join('')
        .match(matcher2)
        .filter(
          (value) =>
            !value.startsWith('.') && !value.startsWith('@swc/helpers'),
        )
        .join(',');

      const importDependencies = dependencies
        .map(([name, version]) => {
          if (imports.match(new RegExp(name))) {
            return [name, version];
          }
        })
        .filter((value) => value !== undefined);

      Object.assign(
        externalDependencies,
        Object.fromEntries(importDependencies),
      );

      await writeFile(
        absolutePath('./dist/user/package.json'),
        JSON.stringify(
          {
            name: 'user',
            version: packageJson.version,
            main: 'projects/user/src/main.js',
            dependencies: externalDependencies,
            packageManager: packageJson.packageManager,
            pnpm: packageJson.pnpm,
          },
          null,
          2,
        ),
      );
    },
  };
}

export default {
  input: getInputs([
    'libs/**/*.ts',
    'projects/user/src/**/*.ts',
    'packages/**/*.ts',
  ]),
  output: {
    dir: './dist/wallet',
    format: 'cjs',
  },
  plugins: [
    replace({
      preventAssignment: true,
      include: ['projects/user/src/**/*.module.ts'],
      './package.json': '../version.json',
      delimiters: ['', ''],
    }),
    nodeResolve({
      preferBuiltins: true,
    }),
    swc3({
      tsconfig: absolutePath('tsconfig.base.json'),
    }),
    commonjs(),
    json(),
    copy({
      targets: [
        {
          src: absolutePath('pnpm-lock.yaml'),
          dest: './dist/user',
        },
      ],
      copySync: true,
    }),
    copyPackageVersion(),
    generatePackageJSON(),
  ],
};
