var step = require('step'),
    SiteGraph = require('../SiteGraph'),
    FsLoader = require('../loaders/Fs'),
    assets = require('../assets'),
    transforms = require('../transforms'),
    error = require('../error');

var siteGraph = new SiteGraph(),
    loader = new FsLoader({
        siteGraph: siteGraph,
        root: 'simpleSpriteTest'
    });

var stylesheet = loader.loadAsset({type: 'CSS', url: 'style.css'});
loader.populate(stylesheet, function () {return true;}, function () {
    step(
        function () {
            transforms.dumpGraph(siteGraph, 'svg', 'beforesprite.svg', this);
        },
        error.logAndExit(function () {
            console.log("ASSETS:\n\n" + siteGraph.assets.join("\n  "));
            console.log("RELATIONS:\n\n" + siteGraph.relations.join("\n  "));
            console.log("\n");
            process.nextTick(this);
        }),
        error.logAndExit(function () {
            transforms.spriteBackgroundImages(siteGraph, this);
        }),
        error.logAndExit(function () {
            transforms.dumpGraph(siteGraph, 'svg', 'aftersprite.svg', this);
        }),
        error.logAndExit(function () {
            console.log("ASSETS:\n\n  " + siteGraph.assets.join("\n  "));
            console.log("RELATIONS:\n\n  " + siteGraph.relations.join("\n  "));
            console.log("\n");
            process.nextTick(this);
        }),
        error.logAndExit(function () {
            transforms.checkRelationConsistency(siteGraph, this);
        })
    );
});