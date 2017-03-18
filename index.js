#!/usr/bin/env node

const path = require('path')
const fs = require('fs-promise')
const { diffLines } = require('diff')

const cwd = p => p && path.join(process.cwd(), p) || process.cwd()

const srcM = cwd(process.argv[2] || 'node_modules_patches')
const dest = cwd(process.argv[3] || 'node_modules')

const log = (...m) => console.log(`[node_modules_patches]`, ...m)
const logError = (...m) => console.error(`[node_modules_patches] Error:`, ...m)

readDir(srcM).then(({ skipped = [] } = {}) => {
  if (skipped.length) {
    log(`Skipped ${skipped.length} files`);
  }
}).catch(logError)

const DIFFLEN = 100
const DIFFLINES = 5

async function readDir(src, { skipped = [] } = {}) {
  return await Promise.all((await fs.readdir(src)).map(async s => {
    const ss = path.join(src, s)
    const stats = await fs.stat(ss)
    if (stats.isDirectory()) {
      return readDir(ss, { skipped })
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
          skipped.push(rl)
          // log(`Skipped: ${rl} (same contents)`)
        } else {
          if (!(await fs.exists(dd + '.bkp')) && await fs.exists(dd)) {
            await fs.copy(dd, dd + '.bkp');
          }
          await fs.copy(ss, dd)
          log(`Copied: ${rl}`)
          diff.forEach((d, i) => {
            if (i > DIFFLINES) {
              return;
            }
            let value = d.value.replace(/(?: |\r|\n)+/g, ' ').trim();
            if ((d.added || d.removed) && value.length) {
              if (value.length > DIFFLEN) {
                const a = value.substr(0, value.length / 2)
                const b = value.substr(value.length / 2)
                value = a.substr(0, (DIFFLEN / 2)) + ` ...[+${d.value.length-DIFFLEN} more chars]... ` + b.substr(-(DIFFLEN / 2))
              }
              log(` `, d.added ? '+' : '-', value)
            }
          });
          if (diff.length > DIFFLINES) {
            log(`  + ${diff.length-DIFFLINES} more diffs`)
          }
        }
      } catch (err) {
        err.message = `Couldn't copy: ${rl} -> ${dest}\n` + err.message;
        throw err;
      }
    }
  })).then(() => ({ skipped }));
}
