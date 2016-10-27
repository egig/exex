var expect = require('chai').expect;


var app;
var ee;

beforeEach(function(){
  ee = require('../lib/index');
  app = ee();
});

describe('Expressjs Extended', function(){

  it('shoud have desired feature', function(){

      expect(app.model).to.be.a('function');
      expect(app.load).to.be.a('function');
      expect(app.getModules).to.be.a('function');
  });

  it('shoud have desired component', function(){

    expect(ee.Module).to.exist;
    expect(ee.Model).to.exist;
  })

  describe('#load', function(){

    it('shoud have desired library after load', function(){

      app.load(__dirname+'/test-root-module-with-no-content');
      expect(app.get('view engine')).is.equal('html');

    })

    it("should have default config", function(){
      app.load(__dirname+'/test-root-module-with-no-content');
      expect(app.get('secret')).to.be.equal(app._DEFAULT_CONFIG.secret);
    });

    it("should override default config", function(){
      app.load(__dirname+'/test-root-module-with-no-content', {
        secret: "foo"
      });
      expect(app.get('secret')).to.be.equal('foo');
    });

    it("should load routes on root module", function(){
      app.load(__dirname+'/test-root-module');

      var r = app.getModule(app.get('config').mainModuleName).getRoutes();
      var rtest = require(__dirname+'/test-root-module/routes');

      expect(r).to.be.equal(rtest);
    });

  });

  describe('#getModule', function(){

    it('should throw error if unknown module', function() {
      app.load(__dirname+'/test-root-module-with-no-content');
      expect(function(){
        var foo = app.getModule('foo');
      }).to.throw(Error, /Unregistered module:/);
    });
  });

});
