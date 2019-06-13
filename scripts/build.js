const vfs = require("vinyl-fs");
const babel = require("@babel/core");
const through = require("through2");
const chalk = require("chalk");
const rimraf = require("rimraf");
// const { readdirSync, readFileSync, writeFileSync, existsSync } = require("fs");
const { join } = require("path");

const LIB_DIR = 'lib'
const BABEL_TARGETS = {
  "browsers": [
    "Android >= 4.0",
    "iOS >= 6",
    "last 10 QQAndroid versions",
    "last 10 UCAndroid versions"
  ]
}

const nodeBabelConfig = {
  presets: [
    [
      require.resolve("@babel/preset-env"),
      {
        targets: {
          node: 6
        }
      }
    ]
  ]
};
const browserBabelConfig = {
  presets: [
    [
      require.resolve("@babel/preset-env"),
      {
        targets: BABEL_TARGETS,
        // modules: false
      }
    ],
    // require.resolve("@babel/preset-react")
  ],
  plugins: [
    [require.resolve("@babel/plugin-transform-runtime"), {
      corejs: 2
    }],
    require.resolve("@babel/plugin-proposal-export-default-from")
  ]
};

const cwd = process.cwd();

function isBrowserTransform(path) {
  return true;
}

function transform(opts = {}) {
  const { content, path } = opts;
  const isBrowser = isBrowserTransform(path);
  console.log(
    chalk[isBrowser ? "yellow" : "blue"](
      `[TRANSFORM] ${path.replace(`${cwd}/`, "")}`
    )
  );
  const config = isBrowser ? browserBabelConfig : nodeBabelConfig;
  return babel.transform(content, config).code;
}

function buildPkg(pkg) {
  rimraf.sync(join(cwd, pkg, LIB_DIR));
  vfs
    .src(`./${pkg}/**/*.js`)
    .pipe(
      through.obj((f, enc, cb) => {
        f.contents = new Buffer( // eslint-disable-line
          transform({
            content: f.contents,
            path: f.path
          })
        );
        cb(null, f);
      })
    )
    .pipe(vfs.dest(`./${LIB_DIR}/`));
}

// function build() {
//   const dirs = readdirSync(join(cwd, "packages"));
//   const arg = process.argv[2];
//   const isWatch = arg === "-w" || arg === "--watch";
//   dirs.forEach(pkg => {
//     if (pkg.charAt(0) === ".") return;
//     buildPkg(pkg);
//     if (isWatch) {
//       const watcher = chokidar.watch(join(cwd, "packages", pkg, "src"), {
//         ignoreInitial: true
//       });
//       watcher.on("all", (event, fullPath) => {
//         if (!existsSync(fullPath)) return;
//         const relPath = fullPath.replace(`${cwd}/packages/${pkg}/src/`, "");
//         const content = readFileSync(fullPath, "utf-8");
//         try {
//           const code = transform({
//             content,
//             path: fullPath
//           });
//           writeFileSync(
//             join(cwd, "packages", pkg, LIB_DIR, relPath),
//             code,
//             "utf-8"
//           );
//         } catch (e) {
//           console.log(chalk.red("Compiled failed."));
//           console.log(chalk.red(e.message));
//         }
//       });
//     }
//   });
// }

buildPkg('src');
