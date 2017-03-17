# node_modules_patches

Many times you'd want to change code in `node_modules` libraries. Even if you've made a pull request to the original author's library it still takes some time.

To ensure you changes are always applied when you fresh install dependencies you should store the affected/changed files separately, in `node_modules_patches`

For example I have made some changes in `isomorphic-webpack\dist\factories\createIsomorphicWebpack.js` and `style-loader\addStyles.js` and I've stored these files in `node_modules_patches`

**`node_modules_patches`** will copy these files onto `node_modules` directory in their respective location and also display a diff of files copied, or show "skipped" if diff doesn't exist.

The diff lets you know if with an updated version you no longer need to be patching the file or if there's been too many changes since you created the patch file and might need to rebase your patch again.

## Install

```
npm i node_modules_patches
```

## Usage

```
node_modules_patches [<patch dir eg. "node_modules_patches" (default)>]
```

## Example

```
$ tree
project
├───files
│   …
├───node_modules_patches // node modules patches folder
│   ├───isomorphic-webpack
│   │   └───dist
│   │       └───factories
│   │           └───createIsomorphicWebpack.js // < copies this
│   └───style-loader
│       ├───index.js
│       └───addStyles.js // < and this
│
├───node_modules
│   …
│   ├───isomorphic-webpack
│   │   ├───dist
│   │   …   ├───factories
│   │       │   └───createIsomorphicWebpack.js // < to here
│   │       ├───schemas
│   │       ├───utilities
│   │       …
│   …
│   ├───style-loader
│   …   ├───.github
│       ├───addStyles.js // < and to here, respectively
│       ├───addStyleUrl.js
│       ├───index.js
…       …
```

```sh
$ node_modules_patches
Copied: isomorphic-webpack\dist\factories\createIsomorphicWebpack.js
  - var relativeEntryScriptPath = './' + _path2.default.relative(webpackConfiguration.context, require.resolve(entryScriptPath));
  + var relativeEntryScriptPath = './' + _path2.default.relative(webpackConfiguration.context, require.resolve(entryScriptPath)).replace(/[/\\]+/g, '/');
Copied: style-loader\addStyles.js
  - return /msie [6-9]\b/.test(self.navigator.userAgent.toLowerCase());
  + return /msie [6-9]\b/.test(window.navigator.userAgent.toLowerCase());
Skipped: style-loader\addStyles.js
```
