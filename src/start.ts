import * as program from 'commander';
import { ApiDocumenter } from './api-documenter';

program
  .version(require('../package.json').version)
  .option('-t --theme [theme]', 'set the theme for the output', /^(bootstrap)$/i, 'bootstrap')
  .option('-i --input <input>', 'the *.api.json file')
  .option('-o --out [out]', 'The folder to put the resuting documentation')
  .option('-l --layout [layout]', 'The jekyll layout to use');

program.parse(process.argv);

const documenter = new ApiDocumenter();
documenter.parse({
  inputGlob: program.input,
  theme: program.theme,
  outDir: program.out,
  layout: program.layout
}).then(() => {
  process.exit(0);
}, (err) => {
  console.dir(err, {colors: true});
  process.exit(1);
});
