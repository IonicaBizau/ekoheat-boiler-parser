## Documentation

You can see below the API reference of this module.

### `EkoHeatBoilerParser(config)`
Creates a new `EkoHeatBoilerParser` instance.

Example of a config file:

```js
{
     live_stream_urls: {
         video: "http://example.com/video",
         override: "http://example.com/override",
         zoomout: "http://example.com/cam/1/zoomout",
         zoomin: "http://example.com/cam/1/zoomin",
         frame: "http://example.com/cam/1/frame.jpg",
     },
     paths: {
         frame: "./frame.jpg",
         power: "./power.png",
         time: "./time.png",
         data: "./data_new.csv",
         stats: "./stats.txt"
     },
     crops: {
         time: {
             top: 140,
             left: 137,
             width: 323,
             height: 121
         },
         power: {
             top: 258,
             left: 238,
             width: 68,
             height: 37
         }
     },
     operating_hours: [
         {
             start: 3
           , end: 13
         },
         {
             start: 15
           , end: 20
         }
     ],
     estimations: {
         pellet_kg_power: 4.5,  // kg/h
         pellet_kg_cost: 0.34,  // EUR/kg
         last_fuel_level: 238.4 // kg
     },
     verbose: true
}
```

#### Params

- **String|Object** `config`: The path to the config file or the config object itself. The configuration object containing the following fields:
  - `live_stream_urls` (Object): An object containing the live stream URLs:
    - `video` (String): The URL to the video stream.
    - `override` (String): The URL to the override stream.
    - `zoomout` (String): The URL to the zoom out stream.
    - `zoomin` (String): The URL to the zoom in stream.
    - `frame` (String): The URL to the frame image.
  - `paths` (Object): An object containing the paths to the files:
    - `frame` (String): The path to the frame image.
    - `power` (String): The path to the power image.
    - `time` (String): The path to the time image.
    - `data` (String): The path to the data CSV file.
    - `stats` (String): The path to the stats file.
  - `crops` (Object): An object containing the crops:
    - `time` (Object): The time crop.
      - `top` (Number): The top position.
      - `left` (Number): The left position.
      - `width` (Number): The width.
      - `height` (Number): The height.
    - `power` (Object): The power crop.
      - `top` (Number): The top position.
      - `left` (Number): The left position.
      - `width` (Number): The width.
      - `height` (Number): The height.
  - `operating_hours` (Array): An array of objects containing the operating hours:
    - `start` (Number): The start hour.
    - `end` (Number): The end hour.
  - `estimations` (Object): An object containing the estimations:
    - `pellet_kg_power` (Number): The pellet consumption per hour (kg).
    - `pellet_kg_cost` (Number): The pellet cost per kg (EUR).
    - `last_fuel_level` (Number): The last fuel level (kg).
  - `verbose` (Boolean): If `true`, the logs will be printed in the console.

#### Return
- **EkoHeatBoilerParser** The `EkoHeatBoilerParser` instance.

### `extractRectangles()`
Extracts the rectangles from the frame.

#### Return
- **Promise** A promise resolving with the following structure:   - `paths` (Object): An object containing the output paths:
     - `power` (String): The path to the power output file.
     - `time` (String): The path to the time output file.
  - `info` (Object): An object containing the information about the
     extracted rectangles:
     - `power` (Object): The power rectangle info.
     - `time` (Object): The time rectangle info.

### `parse()`

#### Return
- **Promise** A promise resolving with the following structure:   - `power` (Number): The power value (kW).
  - `raw` (Object): The raw text.
  - `error` (null|Error): The error message.
  - `time` (String): The time value.
  - `in_operation` (Boolean): `true` if the boiler is in operation, `false` otherwise (this uses the opearting hours).

### `save()`

#### Return
- **Promise** A promise resolving with the data object returned by the `parse` method.

### `keepLiveStreamActive()`

### `downloadCurrentFrame()`
Downloads the live stream frame.

#### Return
- **Promise** A promise resolving when the frame is downloaded.

### `getConfig()`
EkoHeatBoilerParser.getConfig

#### Return
- **Object** An object containing the parsed configuration from the file.

