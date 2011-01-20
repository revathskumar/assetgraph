var step = require('step'),
    SiteGraph = require('../SiteGraph'),
    FsLoader = require('../loaders/Fs'),
    assets = require('../assets'),
    transforms = require('../transforms'),
    error = require('../error');

var siteGraph = new SiteGraph(),
    loader = new FsLoader({
        siteGraph: siteGraph,
        root: 'parseCacheManifest'
    });

var html = loader.loadAsset({type: 'HTML', url: 'index.html'});
loader.populate(html, function () {return true;}, error.logAndExit(function () {
    step(
        function () {
            console.log("ASSETS:\n\n" + siteGraph.assets.join("\n  "));
            console.log("RELATIONS:\n\n" + siteGraph.relations.join("\n  "));
            console.log("\n");
            process.nextTick(this);
        },
        error.logAndExit(function () {
            transforms.dumpGraph(siteGraph, 'svg', 'parsecachemanifest.svg', this);
        })
    );
}));