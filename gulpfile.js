const gulp = require('gulp');
const autoprefixer = require('autoprefixer');
const minimist = require('minimist');
const $ = require('gulp-load-plugins')({ lazy: false });
const browserSync = require('browser-sync').create();
const htmlreplace = require('gulp-html-replace');
// const $ = require('gulp-load-plugins');
// const sass = require('gulp-sass');
// const sourcemaps = require('gulp-sourcemaps');
// const postcss = require('gulp-postcss');
// const cssnano = require('gulp-cssnano');
// const gulpif = require('gulp-if');


let envOptions = {
    string: 'env',
    default: {
        env: 'develop'
    }
};
let options = minimist(process.argv.slice(2), envOptions);


gulp.task('copyHTML', () => {
    return gulp.src('./source/view/*.html')
        .pipe(
            htmlreplace({
                dev_css: '', // 針對 dev_css 塊做替換
                prod_css: 'css/all.css', // 針對 prod_css 塊做替換
                dev_js: '', // 針對 dev_js 塊做替換
                prod_js: 'js/all.js', // 針對 prod_js 塊做替換
            })
        )
        .pipe($.if(options.env === 'prod', $.htmlmin({ collapseWhitespace: true })))//壓縮 HTML
        .pipe(gulp.dest('./public/'))
        .pipe(browserSync.stream()); // <= 注入更改內容
    done();
});


gulp.task('vendorJs', function () {
    return gulp.src([
      './node_modules/jquery/dist/jquery.slim.min.js',
      './node_modules/bootstrap/dist/js/bootstrap.bundle.min.js'
    ])
    .pipe($.concat('vendor.js'))
    .pipe(gulp.dest('./public/js'))
})

gulp.task('scss', function () {
    const plugins = [
        autoprefixer(),
    ];
    return gulp.src('./source/sass/**/*.scss')
        .pipe($.sourcemaps.init())
        // .pipe($.sass().on('error', $.sass.logError))
        .pipe(
            $.sass({
                includePaths: ['node_modules/bootstrap/scss/'], // 導入 sass 模塊可能路徑
            }).on('error', $.sass.logError)
        )
        .pipe($.postcss(plugins))
        .pipe($.if(options.env === 'prod', $.cssnano()))
        .pipe($.sourcemaps.write('.'))
        .pipe(gulp.dest('./public/css'))
        .pipe(browserSync.stream());
});

gulp.task('sass:watch', function () {
    gulp.watch('./sass/**/*.scss', ['sass']);
});

gulp.task('babel', () => {
    return gulp.src('./source/js/**/*.js')
        .pipe($.sourcemaps.init())
        .pipe($.babel({
            presets: ['@babel/env']
        }))
        .pipe($.concat('all.js'))
        .pipe($.if(options.env === 'prod', $.uglify()))
        .pipe($.sourcemaps.write('.'))
        .pipe(gulp.dest('./public/js'))
        .pipe(browserSync.stream());
});

gulp.task('image', () => {
    return gulp.src('./source/img/**/*')
        .pipe($.if(options.env === 'prod', $.image()))
        .pipe(gulp.dest('./public/img/'));
});

// Static server
gulp.task('browser-sync', function () {
    browserSync.init({
        server: {
            baseDir: "./public",
        },
        port: 8080
    });
});

gulp.task('watch', gulp.parallel('browser-sync', () => {
    gulp.watch('./source/**/*.html', gulp.series('copyHTML'));
    gulp.watch('./source/sass/**/*.scss', gulp.series('scss'));
    gulp.watch('./source/js/**/*.js', gulp.series('babel'));
}));

gulp.task('clean', () => {
    return gulp.src('./public', { read: false })
        .pipe($.clean());
});

gulp.task('htmlTask', () => {
    return gulp.src('./source/**/*.html')
        .pipe(
            $.if(
                argv === 'prod',
                htmlreplace({
                    css1: 'css/all.min.css', // 針對指定 name 做替換
                })
            )
        )
        .pipe(gulp.dest('./public'));
});



gulp.task('rebulid', gulp.series('clean', 'copyHTML', 'scss', 'babel', 'vendorJs', 'image'));

gulp.task('default', gulp.series('copyHTML', 'scss', gulp.parallel('babel', 'vendorJs', 'image'), 'watch'))
