import {
  IApiPackage,
  ApiItem,
  ApiJsonFile,
  IApiItemReference, IApiNameMap
} from '@microsoft/api-extractor';
import { Parser } from './parser';
import { writeFileSync } from 'fs';
import {join} from 'path';
import * as mkdirp from 'mkdirp';
import * as rimraf from 'rimraf';
import dashify = require('dashify');


export class BootstrapParser extends Parser {
  private _apiPackages = new Map<string, IApiPackage>();

  constructor(
    private _basePath: string,
    private _layout: string
  ){
    super();
  }

  public async loadFromFile(fileName: string): Promise<void> {
    const apiFile = ApiJsonFile.loadFromFile(fileName);
    this._apiPackages.set(apiFile.name, apiFile);
  }

  async parse(): Promise<void>{
    for(const pack of Array.from(this._apiPackages.values())) {
      const apiPackage: IApiPackage = pack;
      rimraf.sync(this._basePath);
      mkdirp.sync(this._basePath);
      await this._genEntryFile(apiPackage);
      console.dir(apiPackage, {colors: true, depth: 1});
      for(const exp in apiPackage.exports) {
        await this._genExportFile(apiPackage.name, exp, apiPackage.exports[exp]);
      }
    }
    await this._genIndexFile();
  }

  private async _genIndexFile() {
    const entries = [];
    for(const pack of Array.from(this._apiPackages.values())) {
      const apiPackage: IApiPackage = pack;
      const members = [];
      for(const item in apiPackage.exports) {
        members.push({name: item, kind: apiPackage.exports[item].kind});
      }
      entries.push({name: apiPackage.name, members, summary: apiPackage.summary})
    }
    const result = `---
layout: ${this._layout}
---
<div class="container-fluid">
  ${entries.map(e => {
    return `
      <div class="row">
        <h3>${e.name}</h3>
      </div>
      <div class="row mt-4">
        ${e.members.map(m => `
          <div class="col-sm-6 p-2">${this._getSmallKindBadge(m.kind)}<a href="${'./api/' + dashify(m.name)}">${m.name}</a></div>
        `).join('')}
      </div>
    `
    }).join('')}
</div>
    `
    const path = join(this._basePath, 'index.html');
    writeFileSync(path, result)

  }

  private async _genEntryFile(apiPackage: IApiPackage) {
    // console.dir(apiPackage, {colors: true});

  }

  private async _genExportFile(moduleName: string, name: string, exp: ApiItem) {
    const result = `---
layout: ${this._layout}
---
<div class="container-fluid">
  ${await this._getContent(moduleName, name, exp)}
</div>
    `
    const path = join(this._basePath, dashify(name) + '.html');
    writeFileSync(path, result)
  }

  private async _getContent(moduleName: string, name: string, exp: ApiItem) {
    const members = [];
    for(const item in exp.members) {
      members.push({name: item, item: exp.members[item]});
    }
    return `
<div class="row">
  <h3>${name}${this._getKindBadge(exp.kind)}${this._getBetaBadge(exp.isBeta)}</h3>
</div>
${ this._getLead(exp.extends, exp.implements)}
<hr/>
<table class="table table-bordered mt-5">
  <tbody>
    <tr>
      <th scope="row">npm Package</th>
      <td>${moduleName}</td>
    </tr>
    <tr>
      <th scope="row">module</th>
      <td>import { ${name} } from "${moduleName}"</td>
    </tr>
  </tbody>
</table>
<h3>Overview</h3>
 <div class="row">
  <pre><code class="typescript">class ${name} {
  ${members.map(item => `<a href="./api/${dashify(name)}/#${item.name}">${item.item.signature}</a>`).join('\n  ')}
}
</code></pre>
</div>
<h3>Members</h3>
${members.map(item => `
    <hr/>
    <div class="row">
      <h2 id="${item.name}">${item.name}${this._getBetaBadge(item.item.isBeta)}</h2>
    </div>
    <div class="row">
      <pre><code class="typescript">${item.item.signature}</code></pre>
    </div>
`).join('')}
    `
  }

  private _getBetaBadge(isBeta: boolean) {
    return !!isBeta ? ' <span class="badge badge-secondary">Beta</span>' : '';
  }

  private _getLead(ext: string, imp: string) {
    return ext || imp ? `<p class="lead">
  ${ext ? 'extends: ' + ext : ''} ${imp ? 'implements: ' + imp : ''}
</p>`: ''
  }

  private _getKindBadge(kind: string) {
    switch(kind) {
      case 'interface':
        return '  <span class="badge badge-primary" style="background-color: darkmagenta">  INTERFACE  </span>';
      case 'class':
        return '  <span class="badge badge-primary" style="background-color: darkgreen">  CLASS  </span>';
      case 'function':
        return '  <span class="badge badge-primary" style="background-color: dimgrey">  FUNCTION  </span>';
      default:
        throw new Error('UnknownKind: ' + kind);
    }
  }

  private _getSmallKindBadge(kind: string) {
    switch(kind) {
      case 'interface':
        return '<span class="badge badge-primary" style="width: 18px; background-color: darkmagenta">I</span>   ';
      case 'class':
        return '<span class="badge badge-primary" style="width: 18px; background-color: darkgreen"">C</span>   ';
      case 'function':
        return '<span class="badge badge-primary" style="width: 18px; background-color: dimgrey">F</span>   ';
      default:
        throw new Error('UnknownKind: ' + kind);
    }
  }

}
