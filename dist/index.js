"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var ipfs_http_client_1 = __importDefault(require("ipfs-http-client"));
// import * as yaml from 'js-yaml'; // TODO : accept build folder
var fs_extra_1 = __importDefault(require("fs-extra"));
var path_1 = __importDefault(require("path"));
var recursive_readdir_1 = __importDefault(require("recursive-readdir"));
var commander_1 = __importDefault(require("commander"));
var axios_1 = __importDefault(require("axios"));
var tmp_1 = __importDefault(require("tmp"));
var handlebars_1 = __importDefault(require("handlebars"));
var Deployer = /** @class */ (function () {
    function Deployer(ipfsNodeUrl, graphNodeUrl, name) {
        var url = new URL(ipfsNodeUrl);
        this.ipfs = (0, ipfs_http_client_1.default)({
            protocol: url.protocol.replace(/[:]+$/, ''),
            host: url.hostname,
            port: url.port,
            'api-path': url.pathname.replace(/\/$/, '') + '/api/v0/',
        });
        this.graphNodeUrl = graphNodeUrl;
        this.subgraphName = name;
    }
    Deployer.prototype.deploy = function (folderPath) {
        return __awaiter(this, void 0, void 0, function () {
            var subgraphHash, createResult, e_1, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this._uploadSubgraphToIPFS(folderPath)];
                    case 1:
                        subgraphHash = _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, axios_1.default.post(this.graphNodeUrl, {
                                jsonrpc: '2.0',
                                id: '1',
                                method: 'subgraph_create',
                                params: [this.subgraphName],
                            })];
                    case 3:
                        createResult = _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        e_1 = _a.sent();
                        return [3 /*break*/, 5];
                    case 5: return [4 /*yield*/, axios_1.default.post(this.graphNodeUrl, {
                            jsonrpc: '2.0',
                            id: '1',
                            method: 'subgraph_deploy',
                            params: [this.subgraphName, subgraphHash, undefined, undefined],
                            // params: [`{"name": "${this.subgraphName}", "ipfs_hash": "${subgraphHash}"}`],
                        })];
                    case 6:
                        result = _a.sent();
                        if (result.status !== 200) {
                            throw new Error("error whole deploying to graph node: ".concat(result.statusText));
                        }
                        else if (result.data.error) {
                            throw new Error("error whole deploying to graph node: ".concat(JSON.stringify(result.data.error)));
                        }
                        else {
                            // console.log(result.data);
                        }
                        // console.log({subgraphHash});
                        return [2 /*return*/, subgraphHash];
                }
            });
        });
    };
    Deployer.prototype._uploadSubgraphToIPFS = function (folderPath) {
        return __awaiter(this, void 0, void 0, function () {
            var yamlHash, files, _i, files_2, file, hash;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, recursive_readdir_1.default)(folderPath)];
                    case 1:
                        files = _a.sent();
                        _i = 0, files_2 = files;
                        _a.label = 2;
                    case 2:
                        if (!(_i < files_2.length)) return [3 /*break*/, 5];
                        file = files_2[_i];
                        return [4 /*yield*/, this._uploadFileToIPFS(folderPath, file)];
                    case 3:
                        hash = _a.sent();
                        if (path_1.default.basename(file) === 'subgraph.yaml.ipfs') {
                            yamlHash = hash;
                        }
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/, yamlHash];
                }
            });
        });
    };
    Deployer.prototype._uploadFileToIPFS = function (folder, filepath) {
        return __awaiter(this, void 0, void 0, function () {
            var content;
            return __generator(this, function (_a) {
                content = fs_extra_1.default.readFileSync(filepath);
                return [2 /*return*/, this._uploadToIPFS({
                        path: '/',
                        content: content,
                    })];
            });
        });
    };
    Deployer.prototype._uploadToIPFS = function (file) {
        return __awaiter(this, void 0, void 0, function () {
            var pinResult, hash, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.ipfs.add(file)];
                    case 1:
                        pinResult = _a.sent();
                        hash = pinResult.path;
                        // console.log({hash});
                        return [4 /*yield*/, this.ipfs.pin.add(hash)];
                    case 2:
                        // console.log({hash});
                        _a.sent();
                        return [2 /*return*/, hash];
                    case 3:
                        e_2 = _a.sent();
                        throw Error("Failed to upload file to IPFS: ".concat(e_2.message));
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return Deployer;
}());
var pkg = require(path_1.default.join(__dirname, "../package.json"));
commander_1.default.version(pkg.version);
commander_1.default
    .requiredOption('-s, --subgraph <subgraphName>', 'name of the subgraph')
    .requiredOption('-f, --from <folder or npm package>', 'folder or npm package where compiled subgraphe exist')
    .requiredOption('-i, --ipfs <url>', 'ipfs node api url')
    .requiredOption('-g, --graph <url>', 'graph node url')
    .option('-t, --template <folder or file>', 'use template with contracts info taken from folder/file (require support for it in the subgraph package)');
commander_1.default.parse(process.argv);
var packagePath = path_1.default.join('node_modules', commander_1.default.from, 'files');
var folderPath;
if (fs_extra_1.default.existsSync(commander_1.default.from)) {
    folderPath = commander_1.default.from;
    // console.log(`use folder ${folderPath}`);
}
else if (fs_extra_1.default.existsSync(packagePath)) {
    folderPath = packagePath;
    // console.log(`use npm module ${folderPath}`);
}
var subgraphYAMLPath = path_1.default.join(folderPath, 'subgraph.yaml.ipfs');
var templatePath = path_1.default.join(folderPath, 'subgraph.yaml.ipfs.hbs');
if (commander_1.default.template && fs_extra_1.default.existsSync(templatePath)) {
    var tmpobj = tmp_1.default.dirSync();
    var tmpFolder = tmpobj.name;
    fs_extra_1.default.copySync(folderPath, tmpFolder);
    folderPath = tmpFolder;
    // console.log(`use tmp folder ${folderPath}`);
    subgraphYAMLPath = path_1.default.join(folderPath, 'subgraph.yaml.ipfs');
    templatePath = path_1.default.join(folderPath, 'subgraph.yaml.ipfs.hbs');
    if (!fs_extra_1.default.existsSync(commander_1.default.template)) {
        console.error("file/folder ".concat(commander_1.default.template, " doest not exits"));
        throw new Error("cannot continue");
    }
    var chainNames = {
        1: 'mainnet',
        3: 'ropsten',
        4: 'rinkeby',
        5: 'goerli',
        42: 'kovan',
        1337: 'mainnet',
        31337: 'mainnet',
    };
    // TODO use chain.network
    var stat = fs_extra_1.default.statSync(commander_1.default.template);
    var contractsInfo = void 0;
    if (stat.isDirectory()) {
        var chainId = fs_extra_1.default.readFileSync(path_1.default.join(commander_1.default.template, '.chainId')).toString();
        var chainName = chainNames[chainId];
        if (!chainName) {
            throw new Error("chainId ".concat(chainId, " not know"));
        }
        contractsInfo = {
            contracts: {},
            chainName: chainName,
        };
        var files = fs_extra_1.default.readdirSync(commander_1.default.template, { withFileTypes: true });
        for (var _i = 0, files_1 = files; _i < files_1.length; _i++) {
            var file = files_1[_i];
            if (!file.isDirectory() && file.name.substr(file.name.length - 5) === '.json' && !file.name.startsWith('.')) {
                var contractName = file.name.substr(0, file.name.length - 5);
                contractsInfo.contracts[contractName] = JSON.parse(fs_extra_1.default.readFileSync(path_1.default.join(commander_1.default.template, file.name)).toString());
            }
        }
    }
    else {
        var contractsInfoFile = JSON.parse(fs_extra_1.default.readFileSync(commander_1.default.template).toString());
        contractsInfo = {
            contracts: contractsInfoFile.contracts,
            chainName: chainNames[contractsInfoFile.chainId],
        };
    }
    var template = handlebars_1.default.compile(fs_extra_1.default.readFileSync(templatePath).toString());
    var result = template(contractsInfo);
    fs_extra_1.default.writeFileSync(subgraphYAMLPath, result);
    fs_extra_1.default.unlinkSync(templatePath);
}
// console.log({folderPath, subgraph: program.subgraph});
var subgraphExist = fs_extra_1.default.existsSync(subgraphYAMLPath);
if (!subgraphExist) {
    throw new Error("no subgraph.yaml.ipfs in folder ".concat(folderPath));
}
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var deployer, subgraphHash;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                deployer = new Deployer(commander_1.default.ipfs, commander_1.default.graph, commander_1.default.subgraph);
                return [4 /*yield*/, deployer.deploy(folderPath)];
            case 1:
                subgraphHash = _a.sent();
                console.log("subgraph : ".concat(subgraphHash, " deployed."));
                return [2 /*return*/];
        }
    });
}); })();
//# sourceMappingURL=index.js.map