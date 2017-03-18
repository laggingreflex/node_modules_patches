#!/usr/bin/env node

const path = require('path')
const fs = require('fs-promise')
const { diffLines } = require('diff')

const cwd = p => p && path.join(process.cwd(), p) || process.cwd()

const srcM = cwd(process.argv[2] || 'node_modules_patches')
const dest = cwd(process.argv[3] || 'node_modules')

readDir(srcM).catch(console.error)

async function readDir(src) {
  return await Promise.all((await fs.readdir(src)).map(async s => {
    const ss = path.join(src, s)
    const stats = await fs.stat(ss)
    if (stats.isDirectory()) {
      return readDir(ss)
    } else {
      const rl = path.relative(srcM, ss)
      const dd = path.join(dest, rl)
      try {
        const [ss_str, dd_str] = await Promise.all([
          fs.readFile(ss, 'utf8'),
          fs.readFile(dd, 'utf8').catch(() => ''),
        ]);
        const diff = diffLines(dd_str, ss_str, { newlineIsToken: false });
        if (!diff || !diff.length || !diff.find(d => d.added || d.removed)) {
          console.log(`Skipped: ${rl} (same contents)`)
        } else {
          if (!(await fs.exists(dd + '.bkp'))) {
            await fs.copy(dd, dd + '.bkp');
          }
          await fs.copy(ss, dd)
          console.log(`Copied: ${rl}`)
          diff.forEach(d => {
            let value = d.value.replace(/(?: |\r|\n)+/g, ' ').trim();
            if ((d.added || d.removed) && value.length) {
              console.log(` `, d.added ? '+' : '-', value)
            }
          });
        }
      } catch (err) {
        err.message = `Couldn't copy: ${rl} -> ${dest}\n` + err.message;
        throw err;
      }
    }
  }));
}
