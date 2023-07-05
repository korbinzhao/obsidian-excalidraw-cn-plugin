const { src, dest } = require('gulp');
const { version } = require('./package.json');

function defaultTask(cb) {

    src(['./main.js', 'manifest.json', 'styles.css']).pipe(dest(`obsidian-excalidraw-cn-plugin-${version}/`));

    cb();
}

exports.default = defaultTask;