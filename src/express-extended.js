import fs from 'fs';
import path from 'path';

import favicon from 'serve-favicon';
import logger from 'morgan';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import nunjucks from 'nunjucks';
import session from 'express-session';
import flash from 'connect-flash';
import express from 'express';
import winston from 'winston';
import _ from 'lodash';

import Module from './module';
import nunjucksModuleLoader from './nunjucks/module-loader';

const expressExtended = express.application;

expressExtended._DEFAULT_CONFIG = {
  basePath: '/',
  db: false,
  secret: false,
  mainModuleName: "__main",
}

/**
 * Load main modules. load config,  initialize modules, etc
 *
 * @param String _ROOT
 * @return undefined
 */
expressExtended.load = function load(_ROOT, config) {
  this._ROOT = _ROOT;
  this._models = [];
  this._modules = [];
  this._modulePaths =  this.registerModules();
  this._initConfig(config);
  this._initModules();
  this._boot();
}

/**
 * Built in register method, this typiccally will by overrided.
 *
 * @return array
 */
expressExtended.registerModules = function() {
  return [];
}

/**
 * Return registered modules.
 *
 * @return array
 */
expressExtended.getModules = function() {
  return this._modules;
}

/**
 * Get a module by given name.
 *
 * @return object
 */
expressExtended.getModule = function(name) {

  if(name in this._modules) {
    return this._modules[name];
  }

  throw new Error("Unregistered module: '"+name+"'");
}

/**
 * Acess to model by given name or path.
 *
 * @return object
 */
expressExtended.model = function(name) {

  let knex = this.get('db');

  if(typeof knex == 'undefined') {
    throw new Error("Can not create model without db config");
  }

  if(typeof this._models[name] !== 'undefined') {
    return this._models[name];
  }

  if(name.indexOf('@') === 0) {
      let tmp = name.split('/');
      let module = tmp.shift().substr(1);

      // @todo move this to module manager
      if(!this._modules[module]) {
        throw Error("Unregistered module: '"+module+"'");
      }

      let basePath = this._modules[module].getModelPath();
      let fName =  tmp.join('/');

      name = path.join(basePath, fName);
  }

  let ModelClass = require(name);
  this._models[name] = new ModelClass({ knex: knex });

  return this._models[name];
}

expressExtended._boot = function() {
  this._initDB();
  this._initViews();
  this._initBaseMiddlewares();
  this._initStaticMiddlewares();

  this._initRoutes();

  // not found handle
  this.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
  });

  this._initErrorhandler();
  return true;
}

expressExtended._initErrorhandler = function() {
  if (this.get('env') === 'development') {
    this.use(function(err, req, res, next) {
      res.status(err.status || 500);
      res.render('error', {
        message: err.message,
        error: err
      });
    });
  }

  // production error handler
  // no stacktraces leaked to user
  this.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: {}
    });
  });
}

expressExtended._initStaticMiddlewares = function() {
  for(var name in this._modules) {
    if(name === this._CONFIG.mainModuleName) {
      continue;
    }

    this.use('/'+name, express.static( this._modules[name].getPublicPath()));
  }
}

expressExtended._initBaseMiddlewares = function() {
  this.use(logger('dev'));
  this.use(bodyParser.urlencoded({ extended: true }));
  this.use(bodyParser.json());
  this.use(cookieParser());
  this.use(express.static(path.join(this._ROOT, 'public')));

  if(this._CONFIG.secret !== false) {
    this.use(session({ secret: this._CONFIG.secret, resave: true, saveUninitialized: true })); // session secret
    this.use(flash()); // use connect-flash for flash messages stored in session
  }
}


expressExtended._initViews = function() {

  let viewPaths = [this._ROOT+'/views'];
  let loader = new nunjucksModuleLoader(this._modules, {paths: viewPaths});
  this._nunjucksEnv = new nunjucks.Environment(loader, { autoescape: false });
  this._nunjucksEnv.express(this);
  this.set('view engine', 'html');
}

/**
 * Initialize database, we are using knexjs library.
 *
 * @return undefined
 */
expressExtended._initDB = function(){

  if(!this._CONFIG.db) {
    return;
  }

  let knex = require('knex')(this._CONFIG.db);
  this.set('knex', knex);
  this.set('db', knex); // alias
}

expressExtended._initConfig = function(config) {

  let c = _.merge(this._DEFAULT_CONFIG, config);

  this._CONFIG = c;
  this.set('_CONFIG', this._CONFIG);
  this.set('config', this._CONFIG);
  this.set('secret', this._CONFIG.secret);
}

expressExtended._initRoutes = function() {
  // @todo add route priority options
  for(var name in this._modules) {

    let routes = this._modules[name].getRoutes();

    if(!routes) {
      continue;
    }

    this.use(this._CONFIG.basePath, routes);
  }
}

expressExtended._initModules = function(){
  let _this = this;
  // create main/fallback module first
  class mainModule extends Module {
      getName() {
          return _this._CONFIG.mainModuleName;
      }
  }

  var mM = new mainModule(this);
  mM.dirname = this._ROOT;
  this._modules[mM.getName()] = mM;

  const ModulePathResolver = require('./module-path-resolver');
  this._modulePathResolver = new ModulePathResolver(this._ROOT);

  for(var i=0;i<this._modulePaths.length;i++){

    let rP = this._modulePathResolver.resolve(this._modulePaths[i])
    let moduleF = require(rP);
    let m = new moduleF(this);
    m.resolvedPath = rP;

    if(fs.lstatSync(m.resolvedPath).isDirectory()) {
      m.dirname = m.resolvedPath;
    } else {
      m.dirname = path.dirname(m.resolvedPath);
    }

    // @todo validate name
    this._modules[m.getName()] = m;
  }
}

export default expressExtended;
