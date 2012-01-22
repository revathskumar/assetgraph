var vows = require('vows'),
    assert = require('assert'),
    uglifyJs = require('uglify-js'),
    AssetGraph = require('../lib/AssetGraph'),
    transforms = AssetGraph.transforms;

function getFunctionBodySource(fn) {
    return uglifyJs.uglify.gen_code(uglifyJs.parser.parse(fn.toString().replace(/^function \(\) \{\n|\}$/g, '')), {beautify: true});
}

vows.describe('transforms.pullGlobalsIntoVariables').addBatch({
    'After loading a test case with a single JavaScript asset, then running the pullGlobalsIntoVariables transform': {
        topic: function () {
            new AssetGraph({root: __dirname + '/setAssetUrl/simple/'}).queue(
                transforms.loadAssets({
                    type: 'JavaScript',
                    url: 'file:///foo.js',
                    text: getFunctionBodySource(function () {
                        var MATHMIN = 2;
                        var id = setTimeout(function foo() {
                            var bar = Math.min(Math.min(4, 6), Math.max(4, 6) + Math.floor(8.2) + foo.bar.quux.baz + foo.bar.quux.w00p);
                            setTimeout(foo, 100);
                        }, 100);
                    })
                }),
                transforms.pullGlobalsIntoVariables({type: 'JavaScript'}, ['foo.bar.quux', 'setTimeout', 'Math', 'Math.max', 'Math.floor', 'Math.min']),
                transforms.prettyPrintAssets()
            ).run(this.callback);
        },
        'the globals in the JavaScript should be hoisted': function (assetGraph) {
            assert.equal(assetGraph.findAssets({type: 'JavaScript'})[0].text,
                         getFunctionBodySource(function () {
                             var SETTIMEOUT = setTimeout;
                             var MATH = Math;
                             var MATHMIN_ = MATH.min;
                             var FOOBARQUUX = foo.bar.quux;
                             var MATHMIN = 2;
                             var id = SETTIMEOUT(function foo() {
                                 var bar = MATHMIN_(MATHMIN_(4, 6), MATH.max(4, 6) + MATH.floor(8.2) + FOOBARQUUX.baz + FOOBARQUUX.w00p);
                                 SETTIMEOUT(foo, 100);
                             }, 100);
                         }));;
        }
    }
})['export'](module);
