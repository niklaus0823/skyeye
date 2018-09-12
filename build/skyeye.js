#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const program = require("commander");
const pkg = require('../package.json');
program.version(pkg.version)
    .command('config [options]', 'Update skyeye configuration.')
    .command('start [options]', 'Start skyeye monitor server and register server.')
    .command('add [options]', 'Create a secret token.')
    .command('cmd [options]', 'Send command to monitor server.')
    .parse(process.argv);
