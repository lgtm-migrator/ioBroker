// @ts-check
'use strict';

const fs = require('fs-extra');
//const semver = require('semver');
const path = require('path');
//const { URLSearchParams } = require('url');
//let axios;
/*
function rmdirRecursiveSync(path) {
    if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(file => {
            const curPath = path + '/' + file;
            if (fs.statSync(curPath).isDirectory()) {
                // recurse
                rmdirRecursiveSync(curPath);
            } else {
                // delete file
                fs.unlinkSync(curPath);
            }
        });
        // delete (hopefully) empty folder
        try {
            fs.rmdirSync(path);
        } catch (e) {
            console.log(`Cannot delete directory ${path}: ${e.toString()}`);
        }
    }
}

function findIPs() {
    const ifaces = require('os').networkInterfaces();
    const ipArr = [];
    Object.keys(ifaces).forEach(dev => ifaces[dev].forEach(details => !details.internal && ipArr.push(details.address)));
    return ipArr;
}

function findPath(path, url) {
    if (!url) return '';
    if (url.substring(0, 'http://'.length) === 'http://' ||
        url.substring(0, 'https://'.length) === 'https://') {
        return url;
    } else {
        if (path.substring(0, 'http://'.length) === 'http://' ||
            path.substring(0, 'https://'.length) === 'https://') {
            return (path + url).replace(/\/\//g, '/').replace('http:/', 'http://').replace('https:/', 'https://');
        } else {
            if (url && url[0] === '/') {
                return `${__dirname}/..${url}`;
            } else {
                return `${__dirname}/../${path}${url}`;
            }
        }
    }
}

// Download file to tmp or return file name directly
function getFile(urlOrPath, fileName, callback) {
    axios = axios || require('axios');

    // If object was read
    if (urlOrPath.substring(0, 'http://'.length) === 'http://' ||
        urlOrPath.substring(0, 'https://'.length) === 'https://') {
        const tmpFile = `${__dirname}/../tmp/${fileName || Math.floor(Math.random() * 0xFFFFFFE) + '.zip'}`;
        axios(urlOrPath)
            .then(response => {
                console.log('downloaded ' + tmpFile);
                fs.writeFileSync(tmpFile, response.data);
            })
            .catch(error => {
                console.log(`Cannot download "${tmpFile}": ${error}`);
                callback && callback(tmpFile);
            })
    } else {
        if (fs.existsSync(urlOrPath)) {
            callback && callback(urlOrPath);
        } else if (fs.existsSync(`${__dirname}/../${urlOrPath}`)) {
            callback && callback(`${__dirname}/../${urlOrPath}`);
        } else if (fs.existsSync(`${__dirname}/../tmp/${urlOrPath}`)) {
            callback && callback(`${__dirname}/../tmp/${urlOrPath}`);
        } else if (fs.existsSync(`${__dirname}/../adapter/${urlOrPath}`)) {
            callback && callback(`${__dirname}/../adapter/${urlOrPath}`);
        } else {
            console.log('File not found: ' + urlOrPath);
            process.exit(1);
        }
    }
}

// Return content of the json file. Download it or read directly
function getJson(urlOrPath, callback) {
    axios = axios || require('axios');

    let sources = {};
    // If object was read
    if (urlOrPath && typeof urlOrPath === 'object') {
        callback && callback(urlOrPath);
    } else if (!urlOrPath) {
        console.log('Empty url!');
        callback && callback(null);
    } else {
        if (urlOrPath.substring(0, 'http://'.length) === 'http://' ||
            urlOrPath.substring(0, 'https://'.length) === 'https://') {
            axios(urlOrPath, {timeout: 5000 })
                .then(response => {
                    if (typeof response.data !== 'object') {
                        try {
                            sources = JSON.parse(response.data);
                        } catch (e) {
                            console.log('Json file is invalid on ' + urlOrPath);
                            callback && callback(null, urlOrPath);
                            return;
                        }
                    } else {
                        sources = response.data;
                    }

                    callback && callback(sources, urlOrPath);
                })
                .catch(error => {
                    console.log(`Cannot download json from ${urlOrPath}. Error: ${(error.response && error.response.data) || error.response.status || error}`);
                    callback && callback(null, urlOrPath);
                });
        } else {
            if (fs.existsSync(urlOrPath)) {
                try {
                    sources = JSON.parse(fs.readFileSync(urlOrPath, 'utf8'));
                } catch (e) {
                    console.log(`Cannot parse json file from ${urlOrPath}. Error: ${e}`);
                    callback && callback(null, urlOrPath);
                    return;
                }
                callback && callback(sources, urlOrPath);
            } else if (fs.existsSync(`${__dirname}/../${urlOrPath}`)) {
                try {
                    sources = JSON.parse(fs.readFileSync(`${__dirname}/../${urlOrPath}`, 'utf8'));
                } catch (e) {
                    console.log(`Cannot parse json file from ${__dirname}/../${urlOrPath}. Error: ${e}`);
                    callback && callback(null, urlOrPath);
                    return;
                }
                callback && callback(sources, urlOrPath);
            } else if (fs.existsSync(`${__dirname}/../tmp/${urlOrPath}`)) {
                try {
                    sources = JSON.parse(fs.readFileSync(`${__dirname}/../tmp/${urlOrPath}`, 'utf8'));
                } catch (e) {
                    console.log(`Cannot parse json file from ${__dirname}/../tmp/${urlOrPath}. Error: ${e}`);
                    callback && callback(null, urlOrPath);
                    return;
                }
                callback && callback(sources, urlOrPath);
            } else if (fs.existsSync(`${__dirname}/../adapter/${urlOrPath}`)) {
                try {
                    sources = JSON.parse(fs.readFileSync(`${__dirname}/../adapter/${urlOrPath}`, 'utf8'));
                } catch (e) {
                    console.log(`Cannot parse json file from ${__dirname}/../adapter/${urlOrPath}. Error: ${e}`);
                    callback && callback(null, urlOrPath);
                    return;
                }
                callback && callback(sources, urlOrPath);
            } else {
                //if (urlOrPath.indexOf('/example/') === -1) console.log('Json file not found: ' + urlOrPath);
                callback && callback(null, urlOrPath);
            }
        }
    }
}

// Get list of all installed adapters and controller version on this host
function getInstalledInfo(hostRunningVersion) {
    const result = {};
    let path = __dirname + '/../';
    // Get info about host
    let ioPackage = JSON.parse(fs.readFileSync(path + 'io-package.json', 'utf8'));
    let pack = fs.existsSync(path + 'package.json') ? JSON.parse(fs.readFileSync(path + 'package.json', 'utf8')) : {};
    result[ioPackage.common.name] = {
        controller: true,
        version: ioPackage.common.version,
        icon: ioPackage.common.extIcon || ioPackage.common.icon,
        title: ioPackage.common.title,
        desc: ioPackage.common.desc,
        platform: ioPackage.common.platform,
        keywords: ioPackage.common.keywords,
        readme: ioPackage.common.readme,
        runningVersion: hostRunningVersion,
        license: ioPackage.common.license ? ioPackage.common.license : ((pack.licenses && pack.licenses.length) ? pack.licenses[0].type : ''),
        licenseUrl: (pack.licenses && pack.licenses.length) ? pack.licenses[0].url : ''
    };

    let dirs = fs.readdirSync(__dirname + '/../adapter');

    for (let i = 0; i < dirs.length; i++) {
        try {
            path = `${__dirname}/../adapter/${dirs[i]}/`;
            if (fs.existsSync(path + 'io-package.json')) {
                ioPackage = JSON.parse(fs.readFileSync(path + 'io-package.json', 'utf8'));
                pack = fs.existsSync(path + 'package.json') ? JSON.parse(fs.readFileSync(path + 'package.json', 'utf8')) : {};
                result[ioPackage.common.name] = {
                    controller: false,
                    version: ioPackage.common.version,
                    icon: ioPackage.common.extIcon || (ioPackage.common.icon ? `/adapter/${dirs[i]}/${ioPackage.common.icon}` : ''),
                    title: ioPackage.common.title,
                    desc: ioPackage.common.desc,
                    platform: ioPackage.common.platform,
                    keywords: ioPackage.common.keywords,
                    readme: ioPackage.common.readme,
                    type: ioPackage.common.type,
                    license: ioPackage.common.license ? ioPackage.common.license : ((pack.licenses && pack.licenses.length) ? pack.licenses[0].type : ''),
                    licenseUrl: (pack.licenses && pack.licenses.length) ? pack.licenses[0].url : ''
                };
            }
        } catch (e) {
            console.log(`Cannot read or parse ${__dirname}/../adapter/${dirs[i]}/io-package.json: ${e.toString()}`);
        }
    }
    dirs = fs.readdirSync(__dirname + '/../node_modules');
    for (let i = 0; i < dirs.length; i++) {
        try {
            path = `${__dirname}/../node_modules/${dirs[i]}/`;
            if (dirs[i].match(/^iobroker\./i) && fs.existsSync(path + 'io-package.json')) {
                ioPackage = JSON.parse(fs.readFileSync(path + 'io-package.json', 'utf8'));
                pack = fs.existsSync(path + 'package.json') ? JSON.parse(fs.readFileSync(path + 'package.json', 'utf8')) : {};
                result[ioPackage.common.name] = {
                    controller: false,
                    version: ioPackage.common.version,
                    icon: ioPackage.common.extIcon || (ioPackage.common.icon ? `/adapter/${dirs[i]}/${ioPackage.common.icon}` : ''),
                    title: ioPackage.common.title,
                    desc: ioPackage.common.desc,
                    platform: ioPackage.common.platform,
                    keywords: ioPackage.common.keywords,
                    readme: ioPackage.common.readme,
                    type: ioPackage.common.type,
                    license: ioPackage.common.license ? ioPackage.common.license : ((pack.licenses && pack.licenses.length) ? pack.licenses[0].type : ''),
                    licenseUrl: (pack.licenses && pack.licenses.length) ? pack.licenses[0].url : ''
                };
            }
        } catch (e) {
            console.log(`Cannot read or parse ${__dirname}/../node_modules/${dirs[i]}/io-package.json: ${e.toString()}`);
        }
    }
    if (fs.existsSync(__dirname + '/../../../node_modules/iobroker.js-controller') ||
        fs.existsSync(__dirname + '/../../../node_modules/ioBroker.js-controller')) {
        dirs = fs.readdirSync(__dirname + '/../..');
        for (let i = 0; i < dirs.length; i++) {
            try {
                path = `${__dirname}/../../${dirs[i]}/`;
                if (dirs[i].match(/^iobroker\./i) && dirs[i].substring('iobroker.'.length) !== 'js-controller' &&
                    fs.existsSync(path + 'io-package.json')) {
                    ioPackage = JSON.parse(fs.readFileSync(path + 'io-package.json', 'utf8'));
                    pack = fs.existsSync(path + 'package.json') ? JSON.parse(fs.readFileSync(path + 'package.json', 'utf8')) : {};
                    result[ioPackage.common.name] = {
                        controller: false,
                        version: ioPackage.common.version,
                        icon: ioPackage.common.extIcon || (ioPackage.common.icon ? `/adapter/${dirs[i]}/${ioPackage.common.icon}` : ''),
                        title: ioPackage.common.title,
                        desc: ioPackage.common.desc,
                        platform: ioPackage.common.platform,
                        keywords: ioPackage.common.keywords,
                        readme: ioPackage.common.readme,
                        license: ioPackage.common.license ? ioPackage.common.license : ((pack.licenses && pack.licenses.length) ? pack.licenses[0].type : ''),
                        licenseUrl: (pack.licenses && pack.licenses.length) ? pack.licenses[0].url : ''
                    };
                }
            } catch (e) {
                console.log(`Cannot read or parse ${__dirname}/../node_modules/${dirs[i]}/io-package.json: ${e.toString()}`);
            }
        }
    }
    return result;
}
*/

/**
 * Reads an adapter's npm version
 * @param {string | null} adapter The adapter to read the npm version from. Null for the root ioBroker packet
 * @param {(err: Error | null, version?: string) => void} [callback]
 */
/*
function getNpmVersion(adapter, callback) {
    adapter = adapter ? 'iobroker.' + adapter : 'iobroker';
    adapter = adapter.toLowerCase();

    const cliCommand = `npm view ${adapter}@latest version`;

    const exec = require('child_process').exec;
    exec(cliCommand, { timeout: 2000 }, (error, stdout, stderr) => {
        let version;
        if (error) {
            // command failed
            if (typeof callback === 'function') {
                callback(error);
                return;
            }
        } else if (stdout) {
            version = semver.valid(stdout.trim());
        }

        typeof callback === 'function' && callback(null, version);
    });
}

function getIoPack(sources, name, callback) {
    getJson(sources[name].meta, function (ioPack) {
        const packUrl = sources[name].meta.replace('io-package.json', 'package.json');

        getJson(packUrl, pack => {
            // If installed from git or something else
            // js-controller is exception, because can be installed from npm and from git
            if (sources[name].url && name !== 'js-controller') {
                if (ioPack && ioPack.common) {
                    sources[name] = Object.assign(sources[name], ioPack.common);
                    if (pack && pack.licenses && pack.licenses.length) {
                        sources[name].license = sources[name].license || pack.licenses[0].type;
                        sources[name].licenseUrl = sources[name].licenseUrl || pack.licenses[0].url;
                    }
                }

                callback && callback(sources, name);
            } else {
                if (ioPack && ioPack.common) {
                    sources[name] = Object.assign(sources[name], ioPack.common);
                    if (pack && pack.licenses && pack.licenses.length) {
                        sources[name].license = sources[name].license || pack.licenses[0].type;
                        sources[name].licenseUrl = sources[name].licenseUrl || pack.licenses[0].url;
                    }
                }

                if (sources[name].meta.substring(0, 'http://'.length) === 'http://' ||
                    sources[name].meta.substring(0, 'https://'.length) === 'https://') {
                    //installed from npm
                    getNpmVersion(name, function (err, version) {
                        if (version) {
                            sources[name].version = version;
                        }
                        callback && callback(sources, name);
                    });
                } else {
                    callback && callback(sources, name);
                }
            }
        });
    });
}

// Get list of all adapters and controller in some repository file or in /conf/source-dist.json
function getRepositoryFile(urlOrPath, callback) {
    let sources = {};
    let path = '';
    let toRead = 0;
    let timeout = null;
    let count = 0;

    if (urlOrPath) {
        const parts = urlOrPath.split('/');
        path = parts.splice(0, parts.length - 1).join('/') + '/';
    }

    // If object was read
    if (urlOrPath && typeof urlOrPath === 'object') {
        callback && callback(urlOrPath);
    } else if (!urlOrPath) {
        try {
            sources = JSON.parse(fs.readFileSync(__dirname + '/../conf/sources.json', 'utf8'));
        } catch (e) {
            sources = {};
        }
        try {
            const sourcesDist = JSON.parse(fs.readFileSync(__dirname + '/../conf/sources-dist.json', 'utf8'));
            sources = Object.assign({}, sourcesDist, sources);
        } catch (e) {
            // Don't care
        }

        for (const name in sources) {
            if (sources[name].url) {
                sources[name].url = findPath(path, sources[name].url);
            }
            if (sources[name].meta) {
                sources[name].meta = findPath(path, sources[name].meta);
            }
            if (sources[name].icon) {
                sources[name].icon = findPath(path, sources[name].icon);
            }

            if (!sources[name].version && sources[name].meta) {
                toRead++;
                count++;
                getIoPack(sources, name, (ignore, name) => {
                    toRead--;
                    if (!toRead && timeout) {
                        clearTimeout(timeout);
                        callback && callback(sources);
                        timeout = null;
                        callback = null;
                    }
                });
            }
        }

        if (!toRead) {
            callback && callback(sources);
        } else {
            timeout = setTimeout(() => {
                if (timeout) {
                    console.log(`Timeout by read all package.json (${count}) seconds`);
                    clearTimeout(timeout);
                    callback && callback(sources);
                    timeout = null;
                    callback = null;
                }
            }, count * 500);
        }
    } else {
        getJson(urlOrPath, function (sources) {
            if (sources) {
                for (const name in sources) {
                    if (!sources.hasOwnProperty(name)) {
                        continue;
                    }
                    if (sources[name].url) {
                        sources[name].url = findPath(path, sources[name].url);
                    }
                    if (sources[name].meta) {
                        sources[name].meta = findPath(path, sources[name].meta);
                    }
                    if (sources[name].icon) {
                        sources[name].icon = findPath(path, sources[name].icon);
                    }

                    if (!sources[name].version && sources[name].meta) {
                        toRead++;
                        count++;
                        getIoPack(sources, name, (ignore, name) => {
                            toRead--;
                            if (!toRead && timeout) {
                                clearTimeout(timeout);
                                callback && callback(sources);
                                timeout = null;
                                callback = null;
                            }
                        });
                    }
                }
            }
            if (!toRead) {
                callback && callback(sources);
            } else {
                timeout = setTimeout(() => {
                    if (timeout) {
                        console.log(`Timeout by read all package.json (${count}) seconds`);
                        clearTimeout(timeout);
                        callback && callback(sources);
                        timeout = null;
                        callback = null;
                    }
                }, count * 500);
            }
        });
    }
}

function sendDiagInfo(obj, callback) {
    axios = axios || require('axios');

    const objStr = JSON.stringify(obj);
    const params = new URLSearchParams();
    params.append('data', objStr);

    const config = {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 4000
    };

    axios.post(`http://download.${appName}.net/diag.php`, params, config)
        .catch(error => console.warn(`Cannot send diag info: ${error.message}`))
        .then(() => callback && callback());
}

function getAdapterDir(adapter, isNpm) {
    const parts = __dirname.replace(/\\/g, '/').split('/');
    parts.splice(parts.length - 3, 3);
    let dir = parts.join('/');
    if (adapter.startsWith('iobroker.')) {
        adapter = adapter.substring('iobroker.'.length);
    }

    if (fs.existsSync(dir + '/node_modules/iobroker.js-controller') &&
        fs.existsSync(`${dir}/node_modules/iobroker.${adapter}`)) {
        dir = __dirname.replace(/\\/g, '/').split('/');
        dir.splice(dir.length - 2, 2);
        return `${dir.join('/')}/iobroker.${adapter}`;
    } else if (fs.existsSync(`${__dirname}/../node_modules/iobroker.${adapter}`)) {
        dir = __dirname.replace(/\\/g, '/').split('/');
        dir.splice(dir.length - 1, 1);
        return `${dir.join('/')}/node_modules/iobroker.${adapter}`;
    } else if (fs.existsSync(`${__dirname}/../adapter/${adapter}`)) {
        dir = __dirname.replace(/\\/g, '/').split('/');
        dir.splice(dir.length - 1, 1);
        return `${dir.join('/')}/adapter/${adapter}`;
    } else {
        if (isNpm) {
            if (fs.existsSync(__dirname + '/../../node_modules/iobroker.js-controller')) {
                dir = __dirname.replace(/\\/g, '/').split('/');
                dir.splice(dir.length - 2, 2);
                return `${dir.join('/')}/iobroker.${adapter}`;
            } else {
                dir = __dirname.replace(/\\/g, '/').split('/');
                dir.splice(dir.length - 1, 1);
                return `${dir.join('/')}/node_modules/iobroker.${adapter}`;
            }
        } else {
            dir = __dirname.replace(/\\/g, '/').split('/');
            dir.splice(dir.length - 1, 1);
            return `${dir.join('/')}/adapter/${adapter}`;
        }
    }
}
*/
// All paths are returned always relative to /node_modules/iobroker.js-controller
function getDefaultDataDir() {
    /** @type {string | string[]} */
    // let dataDir = __dirname.replace(/\\/g, '/');
    // dataDir = dataDir.split('/');

    // If installed with npm
    if (fs.existsSync(__dirname + '/../../../node_modules/iobroker.js-controller')) {
        return '../../iobroker-data/';
    } else {
        // dataDir.splice(dataDir.length - 1, 1);
        // dataDir = dataDir.join('/');
        return './data/';
    }
}

function getConfigFileName() {
    /** @type {string | string[]} */
    let configDir = __dirname.replace(/\\/g, '/');
    configDir = configDir.split('/');

    // If installed with npm
    if (fs.existsSync(__dirname + '/../../../node_modules/iobroker.js-controller') ||
        fs.existsSync(__dirname + '/../../../node_modules/ioBroker.js-controller')) {
        // remove /node_modules/ioBroker.js-controller/lib
        configDir.splice(configDir.length - 3, 3);
        configDir = configDir.join('/');
        return configDir + '/iobroker-data/iobroker.json';
    } else {
        // Remove /lib
        configDir.splice(configDir.length - 1, 1);
        configDir = configDir.join('/');
        if (fs.existsSync(__dirname + '/../conf/iobroker.json')) {
            return configDir + '/conf/iobroker.json';
        } else {
            return configDir + '/data/iobroker.json';
        }
    }
}

/**
 * Tests if we are currently inside a node_modules folder
 * @returns {boolean}
 */
/*
function isThisInsideNodeModules() {
    return /[\\/]node_modules[\\/]/.test(__dirname) || /[\\/]node_modules[\\/]/.test(process.cwd());
}
*/
/**
 * Recursively enumerates all files in the given directory
 * @param {string} dir The directory to scan
 * @param {(name: string) => boolean} [predicate] An optional predicate to apply to every found file system entry
 * @returns {string[]} A list of all files found
 */
function enumFilesRecursiveSync(dir, predicate) {
    const ret = [];
    if (typeof predicate !== 'function') {
        predicate = () => true;
    }
    // enumerate all files in this directory
    const filesOrDirs = fs.readdirSync(dir)
        .filter(predicate) // exclude all files starting with "."
        .map(f => path.join(dir, f)) // and prepend the full path
        ;
    for (const entry of filesOrDirs) {
        if (fs.statSync(entry).isDirectory()) {
            // Continue recursing this directory and remember the files there
            Array.prototype.push.apply(ret, enumFilesRecursiveSync(entry, predicate));
        } else {
            // remember this file
            ret.push(entry);
        }
    }
    return ret;
}

/**
 * Recursively copies all files from the source to the target directory
 * @param {string} sourceDir The directory to scan
 * @param {string} targetDir The directory to copy to
 * @param {(name: string) => boolean} [predicate] An optional predicate to apply to every found file system entry
 */
function copyFilesRecursiveSync(sourceDir, targetDir, predicate) {
    // Enumerate all files in this module that are supposed to be in the root directory
    const filesToCopy = enumFilesRecursiveSync(sourceDir, predicate);
    // Copy all of them to the corresponding target dir
    for (const file of filesToCopy) {
        // Find out where it's supposed to be
        const targetFileName = path.join(targetDir, path.relative(sourceDir, file));
        // Ensure the directory exists
        fs.ensureDirSync(path.dirname(targetFileName));
        // And copy the file
        fs.copySync(file, targetFileName);
    }
}

/** Checks if this installation process is automated */
function isAutomatedInstallation() {
    return !!process.env.AUTOMATED_INSTALLER;
}

module.exports = {
    /*findIPs,
    rmdirRecursiveSync,
    getRepositoryFile,
    getFile,
    getJson,
    getInstalledInfo,
    sendDiagInfo,
    getAdapterDir,
    isThisInsideNodeModules,
    enumFilesRecursiveSync,*/
    getDefaultDataDir,
    getConfigFileName,
    copyFilesRecursiveSync,
    isAutomatedInstallation
};
