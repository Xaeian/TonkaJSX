#!/usr/bin/env node

const cmd = process.argv[2];
process.argv.splice(2, 1);
if(cmd === 'serve') await import('./serve.js');
else if(cmd === 'build') await import('./build.js');
else console.log('Usage: tonka <serve|build> <project> [options]');