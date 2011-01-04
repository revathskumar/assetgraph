#!/usr/bin/env node

var util = require('util'),
    path = require('path'),
    fs = require('fs'),
    step = require('step'),
    _ = require('underscore'),
    assets = require('./assets'),
    resolvers = require('./loaders/Fs/resolvers'),
    SiteGraph = require('./SiteGraph'),
    FsLoader = require('./loaders/Fs'),
    error = require('./error'),
    options = {};

process.on('uncaughtException', function (e) {
    console.log("Uncaught exception: " + sys.inspect(e.msg) + "\n" + e.stack);
});

_.each(require('optimist').usage('FIXME').demand(['assets-root']).argv,
    function (value, optionName) {
        options[optionName.replace(/-([a-z])/g, function ($0, $1) {
            return $1.toUpperCase();
        })] = value;
    }
);

var siteGraph = new SiteGraph(),
    loader = new FsLoader({
        siteGraph: siteGraph,
        root: options.assetsRoot
    });

step(
    function () {
        var group = this.group();
        (options.label || []).forEach(function (labelDefinition) {
            var keyValue = labelDefinition.split('=');
            if (keyValue.length != 2) {
                throw "Invalid label syntax: " + labelDefinition;
            }
            var labelName = keyValue[0],
                labelValue = keyValue[1],
                callback = group(),
                matchSenchaJSBuilder = labelValue.match(/\.jsb(\d)$/);
            if (matchSenchaJSBuilder) {
                var url = path.dirname(labelValue) || '',
                    version = parseInt(matchSenchaJSBuilder[1], 10);
                fs.readFile(path.join(loader.root, labelValue), 'utf8', error.throwException(function (fileBody) {
                    loader.addLabelResolver(labelName, resolvers.SenchaJSBuilder, {
                        url: url,
                        version: version,
                        body: JSON.parse(fileBody)
                    });
                    callback();
                }));
            } else {
                path.exists(path.join(loader.root, labelValue), function (exists) {
                    if (!exists) {
                        throw new Error("Label " + labelName + ": Dir not found: " + labelValue);
                    }
                    loader.addLabelResolver(labelName, resolvers.Directory, {url: labelValue});
                    callback();
                });
            }
        });
        process.nextTick(group());
    },
    function () {
        var group = this.group();
        (options._ || []).forEach(function (templateUrl) {
            var asset = loader.loadAsset({type: 'HTML', url: templateUrl});
            loader.populate(asset, ['htmlScript', 'jsStaticInclude'], group());
        });
    },
    error.throwException(function () {
        siteGraph.toGraphViz();
    }),
    function (err) {
        console.log("error: " + err + "\n" + err.stack);
    }
);
