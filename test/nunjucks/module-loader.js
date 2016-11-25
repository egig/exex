let path = require('path');
let assert = require('assert');
let express = require('express');
let nunjucksModuleLoader = require('./../../lib/nunjucks/module-loader');
let EE = require('./../../lib');
const testApp = EE();

describe('Nunjucks module loader', function(){
    it('should return null on load unexsiting template', function(){

      testApp.load(__dirname+'../test-root-module');
      let i = new nunjucksModuleLoader(testApp);
      assert.equal(null, i.getSource('dont-exists.html'));

    });

    it('should return module template', function(){

      testApp.registerModules = function() {
        return [
          __dirname+'/../test-relative-module'
        ]
      }

      testApp.load(__dirname+'/../test-root-module');

      let i = new nunjucksModuleLoader(testApp);

      let srcObject =  i.getSource('@test-relative-module/test-template.html');

      assert.equal("Test Template\n", srcObject.src);
      assert.equal(path.resolve(__dirname+"/../test-relative-module/views/test-template.html"), srcObject.path);
    });
});
