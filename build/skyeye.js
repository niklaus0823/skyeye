#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const program = require("commander");
const pkg = require('../package.json');
program.version(pkg.version)
    .command('config [options]', 'Update skyeye configuration.')
    .command('start [options]', 'Start skyeye monitor server and dashboard.')
    .command('close [options]', 'Close skyeye monitor server and dashboard.')
    .parse(process.argv);
