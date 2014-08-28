'use strict';
// generated on <%= (new Date).toISOString().split('T')[0] %> using <%= pkg.name %> <%= pkg.version %>

var gulp = require('gulp');
<% if (includeAssemble) { %>
    var assemble    = require('gulp-assemble');
<% } %>

// load plugins
var $ = require('gulp-load-plugins')();
var browserSync = require('browser-sync');

gulp.task('styles', function () {<% if (includeSass) { %>
    return gulp.src('app/styles/main.scss')
        .pipe($.plumber())
        .pipe($.rubySass({
            style: 'expanded',
            precision: 10
        }))<% } else { %>
    return gulp.src('app/styles/main.css')<% } %>
        .pipe($.autoprefixer('last 1 version'))
        .pipe(gulp.dest('.tmp/styles'))
        .pipe($.size())
        .pipe(browserSync.reload({stream:true}));
});

gulp.task('scripts', function () {
    return gulp.src('app/scripts/**/*.js')
        .pipe($.jshint())
        .pipe($.jshint.reporter(require('jshint-stylish')))
        .pipe($.size());
});

<% if (includeAssemble) { %>
    var options = {
      data: 'app/data/*.json',
      partials: 'app/templates/partials/*.hbs',
      layoutdir: 'app/templates/layouts/',
      layout: 'default.hbs'
    };

    gulp.task('assemble', function () {
      gulp.src(['app/templates/*.hbs', 'app/templates/pages/*.hbs'])
        .pipe(assemble(options))
        .pipe(gulp.dest('app'));
    });
<% } %>

gulp.task('html', ['styles', 'scripts'], function () {
    var jsFilter = $.filter('**/*.js');
    var cssFilter = $.filter('**/*.css');

    return gulp.src('app/*.html')
        .pipe($.useref.assets({searchPath: '{.tmp,app}'}))
        .pipe(jsFilter)
        .pipe($.uglify())
        .pipe(jsFilter.restore())
        .pipe(cssFilter)
        .pipe($.csso())
        .pipe(cssFilter.restore())
        .pipe($.useref.restore())
        .pipe($.useref())
        .pipe(gulp.dest('dist'))
        .pipe($.size());
});

gulp.task('images', function () {
    return gulp.src('app/images/**/*')
        .pipe($.cache($.imagemin({
            optimizationLevel: 3,
            progressive: true,
            interlaced: true
        })))
        .pipe(gulp.dest('dist/images'))
        .pipe($.size());
});

gulp.task('fonts', function () {
    return $.bowerFiles()
        .pipe($.filter('**/*.{eot,svg,ttf,woff}'))
        .pipe($.flatten())
        .pipe(gulp.dest('dist/fonts'))
        .pipe($.size());
});

gulp.task('extras', function () {
    return gulp.src(['app/*.*', '!app/*.html'], { dot: true })
        .pipe(gulp.dest('dist'));
});

gulp.task('clean', function () {
    return gulp.src(['.tmp', 'dist'], { read: false }).pipe($.clean());
});

gulp.task('build', [<% if (includeAssemble) { %>'assemble'<% } %>, 'html', 'images', 'fonts', 'extras']);

gulp.task('default', ['clean'], function () {
    gulp.start('build');
});

gulp.task('serve', ['browser-sync'<% if (includeSass) { %>, 'styles'<% } %>, <% if (includeAssemble) { %>'assemble'<% } %>], function () {});

// browser-sync task for starting the server.
gulp.task('browser-sync', function() {
    browserSync({
        server: {
            baseDir: ["app", ".tmp"]
        }
    });
});

// inject bower components
gulp.task('wiredep', function () {
    var wiredep = require('wiredep').stream;
<% if (includeSass) { %>
    gulp.src('app/styles/*.scss')
        .pipe(wiredep({
            directory: 'app/bower_components'
        }))
        .pipe(gulp.dest('app/styles'));
<% } %>
    gulp.src('app/*.html')
        .pipe(wiredep({
            directory: 'app/bower_components'<% if (includeSass && includeFoundation) { %>,
            exclude: ['foundation']<% } %>
        }))
        .pipe(gulp.dest('app'));
});

gulp.task('watch', ['browser-sync', 'serve'], function () {

    // watch for changes

    gulp.watch([
        'app/*.html',
        '.tmp/styles/**/*.css',
        'app/scripts/**/*.js',
        'app/images/**/*'
    ]).on('change', function (file) {
        browserSync.reload();
    });
    <% if (includeAssemble) { %>
    gulp.watch('app/templates/**/*.hbs', ['assemble']);<% } %>
    gulp.watch('app/styles/**/*.<%= includeSass ? 'scss' : 'css' %>', ['styles']);
    gulp.watch('app/scripts/**/*.js', ['scripts']);
    gulp.watch('app/images/**/*', ['images']);
    gulp.watch('bower.json', ['wiredep']);
});
