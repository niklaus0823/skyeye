#!/usr/bin/env node
import * as program from 'commander';

const pkg = require('../package.json');

program.version(pkg.version)
    .command('config [options]', 'Update skyeye configuration.')
    .command('start [options]', 'Start skyeye monitor server and register server.')
    .command('add [options]', 'Create a secret token.')
    .command('cmd [options]', 'Send command to monitor server.')
    .parse(process.argv);