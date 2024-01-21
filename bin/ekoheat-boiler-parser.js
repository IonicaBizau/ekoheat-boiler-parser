#!/usr/bin/env node
"use strict";

// Disable deprecation warnings
process.removeAllListeners('warning');

const Tilda = require("tilda")
    , EkoheatBoilerParser = require("..")
    ;

// Constants
const GLOBAL_OPTIONS = [
    {
        name: "config"
      , opts: ["c", "config"]
      , desc: "The path to the config file (e.g. config.json)."
      , required: true
    }
]

// Create the cli
const cli = new Tilda(`${__dirname}/../package.json`, {
    options: [ ...GLOBAL_OPTIONS ]
  , examples: [
      "ekoheat-boiler-parser extract-rectangles --config config.json",
      "ekoheat-boiler-parser parse --config config.json",
      "ekoheat-boiler-parser stats --config config.json"
    ]
}).main(action => {
    const configPath = action.options.config.value;
    cli.displayStats()
}).action([
    {
        name: "download-current-frame"
      , desc: "Download the current frame."
      , options: [ ...GLOBAL_OPTIONS ]
    },
    {
        name: "extract-rectangles"
      , desc: "Extract the rectangles from the frame."
      , options: [ ...GLOBAL_OPTIONS ]
    },
    {
        name: "parse"
      , desc: "Parse the rectangles."
      , options: [ ...GLOBAL_OPTIONS ]
    },
    {
        name: "save"
      , desc: "Parse the rectangles and save the output in the csv file."
      , options: [ ...GLOBAL_OPTIONS ]
    },
    {
        name: "stats"
      , desc: "Get the stats."
      , options: [ ...GLOBAL_OPTIONS ]
    },
    {
        name: "keep-live-stream-active"
      , desc: "Get the live stream."
      , options: [ ...GLOBAL_OPTIONS ]
    }
]).on("extract-rectangles", action => {
    const configPath = action.options.config.value;
    const parser = new EkoheatBoilerParser(configPath);
    parser.extractRectangles().then(data => {
        console.log(JSON.stringify(data))
    });
}).on("parse", action => {
    const configPath = action.options.config.value;
    const parser = new EkoheatBoilerParser(configPath);
    parser.parse().then(data => {
        console.log(JSON.stringify(data))
    });
}).on("save", action => {
    const configPath = action.options.config.value;
    const parser = new EkoheatBoilerParser(configPath);
    parser.save().then(data => {
        console.log(JSON.stringify(data))
    });
}).on("stats", action => {
    const configPath = action.options.config.value;
    const parser = new EkoheatBoilerParser(configPath);
    parser.stats().then(data => {
        console.log(data)
    }).catch(err => {
        console.log(err)
    })
}).on("keep-live-stream-active", action => {
    const configPath = action.options.config.value;
    const parser = new EkoheatBoilerParser(configPath);
    parser.keepLiveStreamActive();
}).on("download-current-frame", action => {
    const configPath = action.options.config.value;
    const parser = new EkoheatBoilerParser(configPath);
    parser.downloadCurrentFrame();
})
