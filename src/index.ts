#!/usr/bin/env node
import ipfsHttpClient from 'ipfs-http-client';
// import * as yaml from 'js-yaml'; // TODO : accept build folder
import fs from 'fs-extra';
import path from 'path';
import recursive from 'recursive-readdir';
import program from 'commander';
import axios from 'axios';
import tmp from 'tmp';
import Handlebars from 'handlebars';

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
      params: [this.subgraphName, subgraphHash, undefined, undefined],
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
      throw Error(`Failed to upload file to IPFS: ${(e as any).message}`);
    }
  }
}

const pkg = require(path.join(__dirname, `../package.json`));
program.version(pkg.version);
program
  .requiredOption('-s, --subgraph <subgraphName>', 'name of the subgraph')
  .requiredOption('-f, --from <folder or npm package>', 'folder or npm package where compiled subgraphe exist')
  .requiredOption('-i, --ipfs <url>', 'ipfs node api url')
  .requiredOption('-g, --graph <url>', 'graph node url')
  .option('-t, --template <folder or file>', 'use template with contracts info taken from folder/file (require support for it in the subgraph package)')
program.parse(process.argv);

const packagePath = path.join('node_modules', program.from, 'files');
let folderPath;
if (fs.existsSync(program.from)) {
  folderPath = program.from;
  // console.log(`use folder ${folderPath}`);
} else if (fs.existsSync(packagePath)) {
  folderPath = packagePath;
  // console.log(`use npm module ${folderPath}`);
}

let subgraphYAMLPath = path.join(folderPath, 'subgraph.yaml.ipfs');
let templatePath = path.join(folderPath, 'subgraph.yaml.ipfs.hbs');
if (program.template && fs.existsSync(templatePath)) {
  const tmpobj = tmp.dirSync();
  const tmpFolder = tmpobj.name;
  fs.copySync(folderPath, tmpFolder);
  folderPath = tmpFolder;
  // console.log(`use tmp folder ${folderPath}`);
  subgraphYAMLPath = path.join(folderPath, 'subgraph.yaml.ipfs');
  templatePath = path.join(folderPath, 'subgraph.yaml.ipfs.hbs');

  if (!fs.existsSync(program.template)) {
    console.error(`file/folder ${program.template} doest not exits`);
    throw new Error(`cannot continue`)
  }
  
  const chainNames = {
    1: 'mainnet',
    3: 'ropsten',
    4: 'rinkeby',
    5: 'goerli',
    42: 'kovan',
    1337: 'mainnet',
    31337: 'mainnet',
  };
  // TODO use chain.network
  
  const stat = fs.statSync(program.template);
  let contractsInfo;
  if (stat.isDirectory()) {
    const chainId = fs.readFileSync(path.join(program.template, '.chainId')).toString();
    const chainName = chainNames[chainId];
    if (!chainName) {
      throw new Error(`chainId ${chainId} not know`);
    }
    contractsInfo = {
      contracts: {},
      chainName,
    };
    const files = fs.readdirSync(program.template, {withFileTypes: true});
    for (const file of files) {
      if (!file.isDirectory() && file.name.substr(file.name.length - 5) === '.json' && !file.name.startsWith('.')) {
        const contractName = file.name.substr(0, file.name.length - 5);
        contractsInfo.contracts[contractName] = JSON.parse(fs.readFileSync(path.join(program.template, file.name)).toString());
      }
    }
  } else {
    const contractsInfoFile = JSON.parse(fs.readFileSync(program.template).toString());
    contractsInfo = {
      contracts: contractsInfoFile.contracts,
      chainName: chainNames[contractsInfoFile.chainId],
    };
  }
  
  const template = Handlebars.compile(fs.readFileSync(templatePath).toString());
  const result = template(contractsInfo);
  fs.writeFileSync(subgraphYAMLPath, result);
  fs.unlinkSync(templatePath);
}
// console.log({folderPath, subgraph: program.subgraph});

const subgraphExist = fs.existsSync(subgraphYAMLPath);
if (!subgraphExist) {
  throw new Error(`no subgraph.yaml.ipfs in folder ${folderPath}`);
}

(async () => {
  const deployer = new Deployer(program.ipfs, program.graph, program.subgraph);
  const subgraphHash = await deployer.deploy(folderPath);
  console.log(`subgraph : ${subgraphHash} deployed.`);
})();
