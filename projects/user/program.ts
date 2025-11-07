import { program } from 'commander';

program
  .option('-m, --mode <mode>', 'async | api | graphql', 'api')
  .version('0.1.0');

program.exitOverride();

try {
  program.parse(global.argv || process.argv);
} catch (err) {
  console.warn(err);
}

export const options = program.opts<{
  mode: 'api';
}>();
