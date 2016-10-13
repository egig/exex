#!/usr/bin/env node

var path = require('path');
var fs = require('fs-extra');
var commander = require('commander');
var app = require(process.cwd()+'/app');
// Node <0.7.1 compatibility
var existsSync = fs.existsSync || path.existsSync;

var _config = app.get('_CONFIG');
var knex = app.get('knex');

function exit(text) {
  if (text instanceof Error) {
     console.error(text.stack);
  } else {
     console.error(text);
  }
  process.exit(1);
}

function success(text) {
  console.log(text);
  process.exit(0);
}

commander
  .command('migration:make <name>')
  .description("Create migration file on specified module")
  .option('-m, --module <module>', 'Specify module')
  .action(function (name, options) {

    var m = options.module || _config.mainModuleName;
    var dir = app.getModule(m).getMigrationPath();

      knex.migrate.make(name, {directory: dir}).then(function(name){
         success("Create migration file : " +name);
      }).catch(exit);
  });

  commander
    .command('migrate:latest')
    .option('-m, --module <module>', 'Specify module')
    .description('        Run all migrations that have not yet been run.')
    .action(function(options) {

      var name = options.module || _config.mainModuleName;
      var dir = app.getModule(name).getMigrationPath();
       if(existsSync(dir) ) {

         var config = { directory: dir, tableName: name+'_migrations' };
         knex.migrate.latest(config).spread(function(batchNo, log) {
           if (log.length === 0) {
             success('Migration on module '+name+' Already up to date');
           }
           success(
              "Batch "+batchNo+ " run: "+log.length+" migrations \n"+
               log.join('\n')
           );
         }).catch(exit);

       }

    });

  commander
    .command('migrate:rollback')
    .option('-m, --module <module>', 'Specify module')
    .description('        Rollback the last set of migrations performed.')
    .action(function(options) {

      var name = options.module || _config.mainModuleName;
      var dir = app.getModule(name).getMigrationPath();

      var config = { directory: dir, tableName: name+'_migrations' };
      knex.migrate.rollback(config).spread(function(batchNo, log) {
        if (log.length === 0) {
          success('Already at the base migration');
        }
        success(
          'Batch '+batchNo+' rolled back: '+log.length+' migrations \n' +
          log.join('\n')
        );
      }).catch(exit);
    });

  commander
    .command('seed:create <name>')
    .description("Create seed file on specified module")
    .option('-m, --module <module>', 'Specify module')
    .action(function (name, options) {

      var m = options.module || _config.mainModuleName;
      var dir = app.getModule(m).getSeedPath();

        knex.seed.make(name, {directory: dir}).then(function(name){
           success("Create seed file : " +name);
        }).catch(exit);
    });

  commander
    .command('seed:run')
    .description('       Run seed files.')
    .option('-m, --module <module>', 'Specify module')
    .action(function(options) {


      var m = options.module || _config.mainModuleName;
      var dir = app.getModule(m).getSeedPath();

      if(!existsSync(dir)) {
        exit("No directory: "+ dir);
      }

      knex.seed.run({directory: dir}).spread(function(log) {
        if (log.length === 0) {
          success('No seed files exist');
        }
        success('Ran '+log.length+' seed files \n'+ log.join('\n'));
      }).catch(exit);
    });

commander.parse(process.argv);
