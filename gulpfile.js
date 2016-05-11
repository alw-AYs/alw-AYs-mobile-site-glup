// Load plugins
var gulp = require('gulp'), // 必须先引入gulp插件
  gulpSequence = require('gulp-sequence'),
  browserify = require('browserify'), //browserify
  sourcemaps = require("gulp-sourcemaps"),
  source = require('vinyl-source-stream'),
  buffer = require('vinyl-buffer'),
  del = require('del'), // 文件删除
  sass = require('gulp-sass'), // sass 编译
  cached = require('gulp-cached'), // 缓存当前任务中的文件，只让已修改的文件通过管道
  uglify = require('gulp-uglify'), // js 压缩
  rename = require('gulp-rename'), // 重命名
  concat = require('gulp-concat'), // 合并文件
  notify = require('gulp-notify'), // 相当于 console.log()
  filter = require('gulp-filter'), // 过滤筛选指定文件
  jshint = require('gulp-jshint'), // js 语法校验
  rev = require('gulp-rev-append'), // 插入文件指纹（MD5）
  cssnano = require('gulp-cssnano'), // CSS 压缩
  tinypng = require('gulp-tinypng-compress'), // tinypng
  svgmin = require('gulp-svgmin'), // svgmin
  imagemin = require('gulp-imagemin'), // 图片优化
  fontSpider = require('gulp-font-spider'),
  browserSync = require('browser-sync'), // 保存自动刷新
  fileinclude = require('gulp-file-include'), // 可以 include html 文件
  autoprefixer = require('gulp-autoprefixer'); // 添加 CSS 浏览器前缀

// sass
gulp.task('sass', function() {
  return gulp.src('src/sass/**/*.scss') // 传入 sass 目录及子目录下的所有 .scss 文件生成文件流通过管道
    .pipe(cached('sass')) // 缓存传入文件，只让已修改的文件通过管道（第一次执行是全部通过，因为还没有记录缓存）
    .pipe(sass({
      outputStyle: 'expanded'
    })) // 编译 sass 并设置输出格式
    .pipe(autoprefixer('last 5 version')) // 添加 CSS 浏览器前缀，兼容最新的5个版本
    .pipe(cssnano()) // 压缩 CSS
    .pipe(gulp.dest('dist/css')) // 输出到 dist/css 目录下（不影响此时管道里的文件流）
});

// css （拷贝 *.min.css，常规 CSS 则输出压缩与未压缩两个版本）
gulp.task('css', function() {
  return gulp.src('src/css/**/*.css')
    .pipe(cached('css'))
    .pipe(gulp.dest('dist/css')) // 把管道里的所有文件输出到 dist/css 目录
    .pipe(filter(['*', '!*.min.css'])) // 筛选出管道中的非 *.min.css 文件
    .pipe(autoprefixer('last 5 version'))
    .pipe(cssnano()) // 压缩 CSS
    .pipe(gulp.dest('dist/css')) // 把处理过的 css 输出到 dist/css 目录
});

// styleReload （结合 watch 任务，无刷新CSS注入）
gulp.task('styleReload', ['sass-test', 'css-test'], function() {
  return gulp.src(['dist/css/**/*.css'])
    .pipe(cached('style'))
    .pipe(browserSync.reload({
      stream: true
    })); // 使用无刷新 browserSync 注入 CSS
});

//browserify
gulp.task("browserify", function() {
  var b = browserify({
    entries: "src/js/main.js",
    debug: true
  });

  return b.bundle()
    .pipe(source("main.js"))
    .pipe(buffer())
    .pipe(uglify())
    .pipe(sourcemaps.init({
      loadMaps: true
    }))
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest("dist/js"));
});


// sass-test
gulp.task('sass-test', function() {
  return gulp.src('src/sass/**/*.scss') // 传入 sass 目录及子目录下的所有 .scss 文件生成文件流通过管道
    .pipe(cached('sass')) // 缓存传入文件，只让已修改的文件通过管道（第一次执行是全部通过，因为还没有记录缓存）
    .pipe(sass({
      outputStyle: 'expanded'
    })) // 编译 sass 并设置输出格式
    .pipe(autoprefixer('last 5 version')) // 添加 CSS 浏览器前缀，兼容最新的5个版本
    .pipe(gulp.dest('dist/css')) // 输出到 dist/css 目录下（不影响此时管道里的文件流）
});

// css-test
gulp.task('css-test', function() {
  return gulp.src('src/css/**/*.css')
    .pipe(cached('css'))
    .pipe(gulp.dest('dist/css')) // 把管道里的所有文件输出到 dist/css 目录
    .pipe(filter(['*', '!*.min.css'])) // 筛选出管道中的非 *.min.css 文件
    .pipe(autoprefixer('last 5 version'))
    .pipe(gulp.dest('dist/css')) // 把处理过的 css 输出到 dist/css 目录
});

//browserify-test
gulp.task("browserify-test", function() {
  var b = browserify({
    entries: "src/js/main.js",
    debug: true
  });

  return b.bundle()
    .pipe(source("main.js"))
    .pipe(buffer())
    .pipe(sourcemaps.init({
      loadMaps: true
    }))
    .pipe(sourcemaps.write("."))
    .pipe(gulp.dest("dist/js"));
});

// image
gulp.task('image', function() {
  return gulp.src('src/img/**/*.{jpg,jpeg,png,gif}')
    .pipe(cached('image'))
    .pipe(imagemin({
      optimizationLevel: 3,
      progressive: true,
      interlaced: true,
      multipass: true
    })) // 取值范围：0-7（优化等级）,是否无损压缩jpg图片，是否隔行扫描gif进行渲染，是否多次优化svg直到完全优化
    .pipe(gulp.dest('dist/img'))
});

//tinypng
gulp.task('tinypng', function() {
  gulp.src('src/img/**/*.{png,jpg,jpeg}')
    .pipe(tinypng({
      key: '84eA9r0V_ZvRmB-sf3MjFdYgSmfniV0-',
      sigFile: 'src/img/.tinypng-sigs',
      log: true
    }))
    .pipe(gulp.dest('dist/img'))
    .pipe(notify({
      message: 'tinypng compress done'
    }));;
});

//svgmin
gulp.task('svg', function() {
  return gulp.src('src/img/**/*.svg')
    .pipe(cached('svg'))
    .pipe(svgmin({
      plugins: [{
        collapseGroups: false
      }, {
        cleanupIDs: false
      }, {
        cleanupNumericValues: {
          floatPrecision: 2
        }
      }, {
        removeHiddenElems: false
      }]
    }))
    .pipe(gulp.dest('dist/img'));
});

// html 编译 html 文件
gulp.task('html', function() {
  return gulp.src('src/*.html')
    .pipe(fileinclude()) // include html
    .pipe(gulp.dest('dist/'));
});

gulp.task('webfont', function() {
  del('dist/font/**/*');

  gulp.src('src/font/**/*')
    .pipe(gulp.dest('dist/font'));

  return gulp.src('dist/**/*.html')
    .pipe(fontSpider())
    .pipe(notify({
      message: 'font compress done'
    }));
});

gulp.task('rev', function() {
  return gulp.src('dist/**/*.html')
    .pipe(rev())
    .pipe(gulp.dest('dist/'));
});

// clean 清空 dist 目录
gulp.task('clean', function() {
  return del(['dist/**/*', '!dist/img', '!dist/img/**/*.jpg', '!dist/img/**/*.jpeg', '!dist/img/**/*.png', '!dist/img/**/*.gif']);
});

gulp.task('font&rev', gulpSequence('webfont', 'rev'));

// build 需要插入资源指纹（MD5），html 最后执行
gulp.task('build', gulpSequence('clean', ['sass', 'css', 'browserify', 'tinypng', 'svg'], 'html', 'webfont', 'rev'));

// default 默认任务，依赖清空任务
gulp.task('default', ['clean'], function() {
  gulp.start('build');
});

// watch 开启本地服务器并监听
gulp.task('watch', function() {
  browserSync.init({
    server: {
      baseDir: 'dist' // 在 dist 目录下启动本地服务器环境，自动启动默认浏览器
    }
  });

  // 监控 SASS 文件，有变动则执行CSS注入
  gulp.watch('src/sass/**/*.scss', ['styleReload']);
  // 监控 CSS 文件，有变动则执行CSS注入
  gulp.watch('src/css/**/*.css', ['styleReload']);
  // 监控 js 文件，有变动则执行 browserify 任务
  gulp.watch('src/js/**/*.js', ['browserify-test']);
  // 监控图片文件，有变动则执行 image 任务
  gulp.watch('src/img/**/*', ['image', 'svg']);
  // 监控 html 文件，有变动则执行 html 任务
  gulp.watch('src/**/*.html', ['html']);
  // 监控 dist 目录下除 css 目录以外的变动（如js，图片等），则自动刷新页面
  gulp.watch(['dist/**/*', '!dist/css/**/*']).on('change', browserSync.reload);

});
