#!/usr/bin/env node
import * as program from 'commander';

const pkg = require('../package.json');

program.version(pkg.version)
    .command('config [options]', 'Update skyeye configuration.')
    .command('start [options]', 'Start skyeye monitor server and dashboard.')
    .command('close [options]', 'Close skyeye monitor server and dashboard.')
    .parse(process.argv);