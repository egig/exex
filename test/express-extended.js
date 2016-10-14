var expect = require('chai').expect;


var app;
var ee;

beforeEach(function(){
  ee = require('../lib/index');
  app = ee();
});

describe('Expressjs Extended', function(){

  it('shoud have desired feature', function(){

      expect(app.baseUrl).to.be.a('function');
      expect(app.model).to.be.a('function');
      expect(app.load).to.be.a('function');
      expect(app.getModules).to.be.a('function');
  });

  it('shoud have desired component', function(){

    expect(ee.Module).to.exist;
    expect(ee.Model).to.exist;
  })

  describe('#load', function(){

    it('should throw error on load if no config file', function() {

      expect(function(){
        app.load(__dirname+'/test-no-config')
      }).to.throw(Error, /You must create config.js/) ;

    })

    it('should fine if config file exists and have one main module', function() {

      expect(function(){
        app.load(__dirname+'/test-config-no-modules');

      }).not.to.throw(Error, /You must create config.js/) ;

      expect(Object.keys(app.getModules())).length.to.be(1);

    })
  });

  describe('#getModule', function(){

    it('should throw error if unknown module', function() {
      app.load(__dirname+'/test-config-no-modules');
      expect(function(){
        var foo = app.getModule('foo');
      }).to.throw(Error, /Unregistered module:/);
    });
  });

});
