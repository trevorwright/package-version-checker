#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const npmRun = require('npm-run');
require('colors');

const packagePath = path.join(path.join(process.cwd()), 'package.json');

if (!fs.existsSync(packagePath)) {
    console.log('Failed to find package.json in root directory'.red);
}


const packageJSON = JSON.parse(fs.readFileSync(packagePath));

// const dependencies = pac.dependencies;
const dependencies = Object.assign(packageJSON.dependencies, packageJSON.devDependencies);

const VER_SIZE = 12;

const outdated = [];
const tasks = [];
// eslint-disable-next-line
for (let dep in dependencies) {
    const task = new Promise((resolve) => {
        npmRun.exec(`npm view ${dep} version`, { cwd: __dirname }, (error, ver) => {
            const version = ver.trim();
            const current = dependencies[dep].replace(/[^/\d.]/g, '');

            if (current !== version) {
                outdated.push({
                    name: dep,
                    installed: current,
                    latest: version,
                });
            }

            resolve();
        });
    });

    tasks.push(task);
}

function setLength(value, totalLength) {
    return `${value}${' '.repeat(totalLength - value.length)}`;
}

function padLeft(value, amount) {
    return `${' '.repeat(amount)}${value}`;
}

function formatVersions(installed, latest) {
    const installedPieces = installed.split('.');
    const latestPieces = latest.split('.');

    const formattedInstalled = [];
    const formattedLatest = [];

    for (let x = 0; x < 3; x += 1) {
        if (installedPieces[x] === latestPieces[x]) {
            formattedInstalled.push(installedPieces[x]);
            formattedLatest.push(latestPieces[x]);
        } else {
            const restInstalled = installedPieces.slice(x).join('.').red;
            const restLatest = latestPieces.slice(x).join('.').green;
            formattedInstalled.push(restInstalled);
            formattedLatest.push(restLatest);
            break;
        }
    }

    return {
        installed: padLeft(formattedInstalled.join('.'), VER_SIZE - installed.length),
        latest: padLeft(formattedLatest.join('.'), VER_SIZE - latest.length),
    };
}

function prettyOutput() {
    const nameLength = outdated.reduce((max, current) => {
        return Math.max(max, current.name.length);
    }, 0) + 5;

    outdated.forEach(({ name, installed, latest }) => {
        const versions = formatVersions(installed, latest);
        console.log(`${setLength(name, nameLength)} ${versions.installed} \t-> ${versions.latest}`);
    });
}

Promise.all(tasks).then(() => {
    prettyOutput();
});
