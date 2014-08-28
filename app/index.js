// 'use strict';
var fs = require('fs');
var util = require('util');
var path = require('path');
var spawn = require('child_process').spawn;
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var wiredep = require('wiredep');

var AppGenerator = module.exports = function Appgenerator(args, options, config) {
  yeoman.generators.Base.apply(this, arguments);

  // setup the test-framework property, gulpfile template will need this
  this.testFramework = options['test-framework'] || 'mocha';

  // for hooks to resolve on mocha by default
  options['test-framework'] = this.testFramework;

  // resolved to mocha by default (could be switched to jasmine for instance)
  this.hookFor('test-framework', {
    as: 'app',
    options: {
      options: {
        'skip-install': options['skip-install-message'],
        'skip-message': options['skip-install']
      }
    }
  });

  this.options = options;
  this.pkg = JSON.parse(this.readFileAsString(path.join(__dirname, '../package.json')));
};

util.inherits(AppGenerator, yeoman.generators.Base);

AppGenerator.prototype.askFor = function askFor() {
  var cb = this.async();

  // welcome message
  if (!this.options['skip-welcome-message']) {
    console.log(this.yeoman);
    console.log(chalk.magenta('Out of the box I include HTML5 Boilerplate, jQuery, and a gulpfile.js to build your app.'));
  }

  var prompts = [{
    type: 'checkbox',
    name: 'features',
    message: 'What more would you like?',
    choices: [{
      name: 'Sass',
      value: 'includeSass',
      checked: true
    }, {
      name: 'Foundation (Needs Sass to be installed)',
      value: 'includeFoundation',
      checked: true
    }, {
      name: 'Modernizr',
      value: 'includeModernizr',
      checked: true
    }, {
      name: 'Assemble',
      value: 'includeAssemble',
      checked: false
    }, {
      name: 'CakePHP',
      value: 'includeCakephp',
      checked: false
    }]
  }];

  this.prompt(prompts, function (answers) {
    var features = answers.features;

    var hasFeature = function (feat) {
      return features.indexOf(feat) !== -1;
    }

    // manually deal with the response, get back and store the results.
    // we change a bit this way of doing to automatically do this in the self.prompt() method.
    this.includeSass = hasFeature('includeSass');
    this.includeFoundation = hasFeature('includeFoundation');
    this.includeModernizr = hasFeature('includeModernizr');
    this.includeAssemble = hasFeature('includeAssemble');
    this.includeCakephp = hasFeature('includeCakephp');

    cb();
  }.bind(this));
};

AppGenerator.prototype.cakephp = function () {
  if (this.includeCakephp) {
    this.copy('composer.json', 'composer.json');
    this.spawnCommand('composer', ['install']);
  }
};

AppGenerator.prototype.bake = function () {
    if (this.includeCakephp) {

      var util = require('util')
      var exec = require('child_process').exec;

      function puts(error, stdout, stderr) {util.puts(stdout)}
      exec("Vendor/bin/cake bake project App", puts);
    }
};

AppGenerator.prototype.gulpfile = function () {
  this.template('gulpfile.js');
};

AppGenerator.prototype.packageJSON = function () {
  this.template('_package.json', 'package.json');
};

AppGenerator.prototype.git = function () {
  this.copy('gitignore', '.gitignore');
  this.copy('gitattributes', '.gitattributes');
};

AppGenerator.prototype.bower = function () {
  this.copy('bowerrc', '.bowerrc');
  this.copy('bower.json', 'bower.json');
};

AppGenerator.prototype.jshint = function () {
  this.copy('jshintrc', '.jshintrc');
};

AppGenerator.prototype.editorConfig = function () {
  this.copy('editorconfig', '.editorconfig');
};

AppGenerator.prototype.h5bp = function () {
  this.copy('favicon.ico', 'app/favicon.ico');
  this.copy('404.html', 'app/404.html');
  this.copy('robots.txt', 'app/robots.txt');
  this.copy('htaccess', 'app/.htaccess');
};

AppGenerator.prototype.assemble = function () {
  if (this.includeAssemble) {
    this.copy('default.hbs', 'app/templates/layouts/default.hbs');
  }
};


AppGenerator.prototype.mainStylesheet = function () {
  var css = 'main.' + (this.includeSass ? 's' : '') + 'css';
  this.copy(css, 'app/styles/' + css);
  this.copy('_variables.scss', 'app/styles/_variables.scss');

  if (this.includeFoundation) {
    this.copy('_foundation-settings.scss', 'app/styles/_foundation-settings.scss');
  }
};

AppGenerator.prototype.writeIndex = function () {
  this.indexFile = this.readFileAsString(path.join(this.sourceRoot(), 'index.html'));
  this.indexFile = this.engine(this.indexFile, this);

  // wire Foundation plugins
  if (this.includeFoundation) {
    var bs = 'bower_components/foundation/js/foundation.js';
    this.indexFile = this.appendScripts(this.indexFile, 'scripts/plugins.js', [
      bs
    ]);
  }

  this.indexFile = this.appendFiles({
    html: this.indexFile,
    fileType: 'js',
    optimizedPath: 'scripts/main.js',
    sourceFileList: ['scripts/main.js']
  });
};

AppGenerator.prototype.app = function () {
  this.mkdir('app');
  this.mkdir('app/scripts');
  this.mkdir('app/styles');

  if (this.includeSass) {
    this.mkdir('app/styles/base');
    this.mkdir('app/styles/elements');
    this.mkdir('app/styles/modules');
    this.mkdir('app/styles/plugins');
  }

  this.mkdir('app/images');

  if (this.includeAssemble) {
    this.mkdir('app/templates');
    this.mkdir('app/templates/layouts');
    this.mkdir('app/templates/pages');
    this.mkdir('app/templates/partials');
  }

  this.write('app/index.html', this.indexFile);
  this.write('app/scripts/main.js', 'console.log(\'\\\'Allo \\\'Allo!\');');
};


AppGenerator.prototype.install = function () {
  var howToInstall =
    '\nAfter running `npm install & bower install`, inject your front end dependencies into' +
    '\nyour HTML by running:' +
    '\n' +
    chalk.yellow.bold('\n  gulp wiredep');

  if (this.options['skip-install']) {
    console.log(howToInstall);
    return;
  }

  var done = this.async();
  this.installDependencies({
    skipMessage: this.options['skip-install-message'],
    skipInstall: this.options['skip-install'],
    callback: function () {
      var bowerJson = JSON.parse(fs.readFileSync('./bower.json'));

      // wire Bower packages to .html
      wiredep({
        bowerJson: bowerJson,
        directory: 'app/bower_components',
        exclude: ['foundation'],
        src: 'app/index.html'
      });

      if (this.includeSass) {
        // wire Bower packages to .scss
        wiredep({
          bowerJson: bowerJson,
          directory: 'app/bower_components',
          src: 'app/styles/*.scss'
        });
      }

      done();
    }.bind(this)
  });
};
