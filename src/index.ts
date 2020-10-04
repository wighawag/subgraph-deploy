import ipfsHttpClient from 'ipfs-http-client';
// import * as yaml from 'js-yaml'; // TODO : accept build folder
import fs from 'fs';
import path from 'path';
import recursive from 'recursive-readdir';
import program from 'commander';
import axios from 'axios';

class Deployer {
  private ipfs: any;
  private graphNodeUrl: string;
  private subgraphName: string;
  constructor(ipfsNodeUrl: string, graphNodeUrl: string, name: string) {
    const url = new URL(ipfsNodeUrl);
    this.ipfs = ipfsHttpClient({
      protocol: url.protocol.replace(/[:]+$/, ''),
      host: url.hostname,
      port: url.port,
      'api-path': url.pathname.replace(/\/$/, '') + '/api/v0/',
    });
    this.graphNodeUrl = graphNodeUrl;
    this.subgraphName = name;
  }

  async deploy(folderPath: string): Promise<string> {
    const subgraphHash = await this._uploadSubgraphToIPFS(folderPath);
    // console.log({subgraphHash});

    try {
      const createResult = await axios.post(this.graphNodeUrl, {
        jsonrpc: '2.0',
        id: '1',
        method: 'subgraph_create',
        params: [this.subgraphName],
      });
    } catch (e) {}

    const result = await axios.post(this.graphNodeUrl, {
      jsonrpc: '2.0',
      id: '1',
      method: 'subgraph_deploy',
      params: [this.subgraphName, subgraphHash, ''],
      // params: [`{"name": "${this.subgraphName}", "ipfs_hash": "${subgraphHash}"}`],
    });

    if (result.status !== 200) {
      throw new Error(`error whole deploying to graph node: ${result.statusText}`);
    } else if (result.data.error) {
      throw new Error(`error whole deploying to graph node: ${JSON.stringify(result.data.error)}`);
    } else {
      // console.log(result.data);
    }
    // console.log({subgraphHash});

    return subgraphHash;
  }

  async _uploadSubgraphToIPFS(folderPath: string) {
    let yamlHash;
    const files = await recursive(folderPath);
    for (const file of files) {
      const hash = await this._uploadFileToIPFS(folderPath, file);
      if (path.basename(file) === 'subgraph.yaml.ipfs') {
        yamlHash = hash;
      }
    }
    return yamlHash;
  }

  async _uploadFileToIPFS(folder: string, filepath: string): Promise<string> {
    let content = fs.readFileSync(filepath);
    return this._uploadToIPFS({
      path: '/',
      content: content,
    });
  }

  async _uploadToIPFS(file: {path: string; content: Buffer}): Promise<string> {
    try {
      // console.log({path: file.path});
      const pinResult = await this.ipfs.add(file);
      // console.log({pinResult});
      const hash = pinResult.path;
      // console.log({hash});
      await this.ipfs.pin.add(hash);
      return hash;
    } catch (e) {
      throw Error(`Failed to upload file to IPFS: ${e.message}`);
    }
  }
}

const pkg = require(path.join(__dirname, `../package.json`));
program.version(pkg.version);
program
  .requiredOption('-s, --subgraph <subgraphName>', 'name of the subgraph')
  .requiredOption('-f, --from <folder or npm package>', 'folder or npm package where compiled subgraphe exist')
  .requiredOption('-i, --ipfs <url>', 'ipfs node api url')
  .requiredOption('-g, --graph <url>', 'graph node url');
program.parse(process.argv);

const packagePath = path.join('node_modules', program.from, 'files');
let folderPath;
if (fs.existsSync(program.from)) {
  folderPath = program.from;
} else if (fs.existsSync(packagePath)) {
  folderPath = packagePath;
}

// console.log({folderPath, subgraph: program.subgraph});

const subgraphExist = fs.existsSync(path.join(folderPath, 'subgraph.yaml.ipfs'));
if (!subgraphExist) {
  throw new Error(`no subgraph.yaml.ipfs in folder ${folderPath}`);
}

(async () => {
  const deployer = new Deployer(program.ipfs, program.graph, program.subgraph);
  const subgraphHash = await deployer.deploy(folderPath);
})();
