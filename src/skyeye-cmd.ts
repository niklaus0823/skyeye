#!/usr/bin/env node
import * as program from 'commander';

const pkg = require('../package.json');

program.version(pkg.version)
    .command('list [options]', 'Report all online agent.')
    .command('stat [options]', 'Report target agent server stat.')
    .command('profiler [options]', 'Report target agent server cpu profiler.')
    .command('heap [options]', 'Report target agent heap snapshot.')
    .parse(process.argv);