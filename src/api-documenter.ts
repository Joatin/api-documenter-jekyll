import { sync } from 'glob';
import { Parser } from './parser';
import { BootstrapParser } from './bootstrap.parser';


export class ApiDocumenter {
  constructor(){}

  public async parse(opts: { inputGlob: string, theme: string, outDir: string, layout: string }) {
    const parser = this._getParserForTheme(opts.theme, opts.outDir, opts.layout);
    for(const file of sync(opts.inputGlob)) {
      console.log(file);
      await parser.loadFromFile(file);
    }
    await parser.parse();
  }

  private _getParserForTheme(theme: string, outDir: string, layout: string): Parser {
    switch (theme) {
      case 'bootstrap':
        return new BootstrapParser(outDir, layout);
      default:
        throw new Error('Unknown theme');
    }
  }
}
