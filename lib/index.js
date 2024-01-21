const sharp = require('sharp');
const { createWorker } = require('tesseract.js');
const fs = require("fs").promises;
const csvIt = require("csv-it");
const asciichart = require ('asciichart');
const fillo = require("fillo");
const Daty = require("daty");
const spawn = require("child_process").spawn;
const OUT_OF_HOURS_MESSAGES = require("./messages");

class EkoHeatBoilerParser {

    /**
     * EkoHeatBoilerParser
     * Creates a new `EkoHeatBoilerParser` instance.
     *
     * Example of a config file:
     *
     * ```js
     * {
     *      live_stream_urls: {
     *          video: "http://example.com/video",
     *          override: "http://example.com/override",
     *          zoomout: "http://example.com/cam/1/zoomout",
     *          zoomin: "http://example.com/cam/1/zoomin",
     *          frame: "http://example.com/cam/1/frame.jpg",
     *      },
     *      paths: {
     *          frame: "./frame.jpg",
     *          power: "./power.png",
     *          time: "./time.png",
     *          data: "./data_new.csv",
     *          stats: "./stats.txt"
     *      },
     *      crops: {
     *          time: {
     *              top: 140,
     *              left: 137,
     *              width: 323,
     *              height: 121
     *          },
     *          power: {
     *              top: 258,
     *              left: 238,
     *              width: 68,
     *              height: 37
     *          }
     *      },
     *      operating_hours: [
     *          {
     *              start: 3
     *            , end: 13
     *          },
     *          {
     *              start: 15
     *            , end: 20
     *          }
     *      ],
     *      estimations: {
     *          pellet_kg_power: 4.5,  // kg/h
     *          pellet_kg_cost: 0.34,  // EUR/kg
     *          last_fuel_level: 238.4 // kg
     *      },
     *      verbose: true
     * }
     * ```
     *
     * @name EkoHeatBoilerParser
     * @function
     * @param {String|Object} config The path to the config file or the config object itself. The configuration object containing the following fields:
     *
     *   - `live_stream_urls` (Object): An object containing the live stream URLs:
     *     - `video` (String): The URL to the video stream.
     *     - `override` (String): The URL to the override stream.
     *     - `zoomout` (String): The URL to the zoom out stream.
     *     - `zoomin` (String): The URL to the zoom in stream.
     *     - `frame` (String): The URL to the frame image.
     *   - `paths` (Object): An object containing the paths to the files:
     *     - `frame` (String): The path to the frame image.
     *     - `power` (String): The path to the power image.
     *     - `time` (String): The path to the time image.
     *     - `data` (String): The path to the data CSV file.
     *     - `stats` (String): The path to the stats file.
     *   - `crops` (Object): An object containing the crops:
     *     - `time` (Object): The time crop.
     *       - `top` (Number): The top position.
     *       - `left` (Number): The left position.
     *       - `width` (Number): The width.
     *       - `height` (Number): The height.
     *     - `power` (Object): The power crop.
     *       - `top` (Number): The top position.
     *       - `left` (Number): The left position.
     *       - `width` (Number): The width.
     *       - `height` (Number): The height.
     *   - `operating_hours` (Array): An array of objects containing the operating hours:
     *     - `start` (Number): The start hour.
     *     - `end` (Number): The end hour.
     *   - `estimations` (Object): An object containing the estimations:
     *     - `pellet_kg_power` (Number): The pellet consumption per hour (kg).
     *     - `pellet_kg_cost` (Number): The pellet cost per kg (EUR).
     *     - `last_fuel_level` (Number): The last fuel level (kg).
     *   - `verbose` (Boolean): If `true`, the logs will be printed in the console.
     * @return {EkoHeatBoilerParser} The `EkoHeatBoilerParser` instance.
     */
    constructor (config) {
        if (typeof config === 'string') {
            config = EkoHeatBoilerParser.getConfig(config)
        }
        this.config = config
        this.crops = this.config.crops
        this.paths = this.config.paths
        this.verbose = this.config.verbose
    }

    /**
     * extractRectangles
     * Extracts the rectangles from the frame.
     *
     * @name extractRectangles
     * @function
     * @return {Promise} A promise resolving with the following structure:
     *   - `paths` (Object): An object containing the output paths:
     *      - `power` (String): The path to the power output file.
     *      - `time` (String): The path to the time output file.
     *   - `info` (Object): An object containing the information about the
     *      extracted rectangles:
     *      - `power` (Object): The power rectangle info.
     *      - `time` (Object): The time rectangle info.
     */
    async extractRectangles () {

        if (this.verbose) {
            console.warn(`Parsing ${this.config.paths.frame}`)
        }

        // Crop the power rectangle
        const powerInfo = await sharp(this.config.paths.frame)
                .extract(this.crops.power)
                .modulate({
                    brightness: 0.5,
                    saturation: 0,
                })
                .sharpen()
                .median(1)
                .threshold(160)
                .normalise()
                .toFile(this.paths.power)

        // Crop the time rectangle
        const timeInfo = await sharp(this.config.paths.frame)
                .extract(this.crops.time)
                .modulate({
                    brightness: 0.5,
                    saturation: 0,
                })
                .sharpen()
                .median(1)
                .threshold(160)
                .normalise()
                .toFile(this.paths.time);

        return {
            paths: this.paths,
            info: {
                power: powerInfo,
                time: timeInfo,
            }
        }
    }

    /**
     * parse
     *
     * @name parse
     * @function
     * @return {Promise} A promise resolving with the following structure:
     *   - `power` (Number): The power value (kW).
     *   - `raw` (Object): The raw text.
     *   - `error` (null|Error): The error message.
     *   - `time` (String): The time value.
     *   - `in_operation` (Boolean): `true` if the boiler is in operation, `false` otherwise (this uses the opearting hours).
     */
    async parse () {

        const worker = await createWorker("eng");

        await worker.setParameters({
            tessedit_char_whitelist: '0123456789.-',
            preserve_interword_spaces: '0',
        });

        const ret = {
            power: -1,
            raw: "",
            error: null,
        }

        const currentPowerRet = await worker.recognize(this.paths.power);

        ret.raw = currentPowerRet.data.text.trim()

        let powerVal = currentPowerRet.data.text.replace(/kw/gi, "").trim();

        if (this.verbose) {
            console.log("Processing", powerVal, currentPowerRet.data.text);
        }

        powerVal = powerVal.replace(/[^0-9]/g, "");
        powerVal = powerVal.replace(/(\d+)(\d{1})/, "$1.$2");
        powerVal = Number(powerVal);

        if (isNaN(powerVal)) {
            console.error("Warning: Power value is not a number", powerVal, currentPowerRet.data.text);
            ret.error = "Power value is not a number";
            powerVal = 0
        } else if (powerVal < 0 || powerVal > 15) {
            console.error("ERROR: Power value out of range");
            ret.error = "Power value out of range";
            powerVal = 0
        }

        const cHour = new Date().getHours();
        const opeartingHours = this.config.operating_hours
        ret.in_operation = opeartingHours.some(({ start, end }) => {
            return cHour >= start && cHour < end
        })

        if (ret.in_operation && powerVal === 0) {
            ret.error = "Boiler is in operation but the power value is 0.";
        }

        ret.power = powerVal;

        await worker.terminate();

        return ret
    }

    /**
     * save
     *
     * @name save
     * @function
     * @return {Promise} A promise resolving with the data object returned by the `parse` method.
     */
    async save () {
        const ret = await this.parse()

        const csv = csvIt.writeAsync(this.config.paths.data, {
            append: true,
            includeEndRowDelimiter: true
        }, () => {})

        await csv.write([
            new Date().toISOString(),
            ret.in_operation,
            ret.power,
            ret.error || ""
        ])

        await csv.end()

        return ret
    }

    async stats () {
        const originalData = await csvIt.read(this.config.paths.data, {
            headers: ["time", "in_operation", "power", "error"]
        })

        // Detect invalid values
        originalData.forEach((c, index) => {
            if (c.power < 0 || c.power > 15) {
                console.error("Invalid power value detected", c.power, index + 1)
            }
            if (isNaN(c.power)) {
                console.error("Invalid power value detected", c.power, index + 1)
            }
            if (isNaN(new Date(c.time).getTime())) {
                console.error("Invalid time value detected", index + 1)
            }
        })


        if (originalData.length < 15) {
            return "Not enough data to generate stats"
        }

        const now = new Date()

        const output = []

        // Filter the data to the last day
        const lastDayData = originalData.filter(
            c => new Date(c.time) > new Date(now.getTime() - 24 * 60 * 60 * 1000)
        )

        // Filter the data to the last 42 minutes
        const lastHourData = originalData.filter(
            c => new Date(c.time) > new Date(now.getTime() - 42 * 60 * 1000)
        )

        // 42 Minute Chart
        const chartData = lastHourData.map(c => +c.power)
        const lastChange = chartData[chartData.length - 1] - chartData[chartData.length - 2]
        const change = `Power now: ${(chartData[chartData.length - 1]).toFixed(1)} kW ${lastChange > 0 ? "(⬆" + lastChange.toFixed(1) + ")" : lastChange < 0 ? "(⬇" + lastChange.toFixed(1) + ")" : ""}`

        // Array of averages of last and next 5 elements
        const lastHourSmoothedData = chartData.map((c, i) => {
            const lastThreeElements = [chartData[i - 1], chartData[i - 2], chartData[i - 3]].filter(c => c !== undefined)
            const nextThreeElements = [chartData[i + 1], chartData[i + 2], chartData[i + 3]].filter(c => c !== undefined)
            const lastThreeSum = lastThreeElements.reduce((a, b) => a + b, 0)
            const nextThreeSum = nextThreeElements.reduce((a, b) => a + b, 0)
            return +((lastThreeSum + nextThreeSum + c) / (lastThreeElements.length + nextThreeElements.length + 1)).toFixed(3)
        })


        const powerAverage = lastHourSmoothedData.reduce((a, b) => a + b, 0) / chartData.length
        if (powerAverage === 0) {
            const currentHour = new Date().getHours()
            if (currentHour > 18 || currentHour < 8) {
                output.push(OUT_OF_HOURS_MESSAGES.NIGHT)
            } else {
                output.push(OUT_OF_HOURS_MESSAGES.DAY)
            }
        } else {
            output.push("Heating Power (kW)                    𝐏𝐞𝐥𝐥𝐞𝐭 𝐁𝐨𝐢𝐥𝐞𝐫 𝐇𝐞𝐚𝐭𝐢𝐧𝐠 𝐏𝐨𝐰𝐞𝐫 𝐕𝐚𝐫𝐢𝐚𝐭𝐢𝐨𝐧 𝐢𝐧 𝐭𝐡𝐞 𝐋𝐚𝐬𝐭 𝟒𝟐 𝐌𝐢𝐧𝐮𝐭𝐞𝐬")
            output.push("            ^")
            output.push(asciichart.plot(lastHourSmoothedData, { height: 10 }))
            output.push("       -----+---------------------------------------------------------------------------->")
            output.push("    Time:  " + new Daty(lastHourData[0].time).format("HH:mm A") + " - " + new Daty(lastHourData[lastHourData.length - 1].time).format("hh:mm A") + " | " + change)
            output.push("")
        }

        // Averages per hour of the day
        const averagesPerHour = lastDayData.reduce((acc, c) => {
            const date = new Date(c.time)
            const hour = date.getHours()
            const yyyymmddhh = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + hour + ":00"
            if (acc[yyyymmddhh] === undefined) {
                acc[yyyymmddhh] = []
            }
            acc[yyyymmddhh].push(+c.power)
            return acc
        }, {})

        const averagesPerHourArray = Object.keys(averagesPerHour).map(hour => {
            const average = averagesPerHour[hour].reduce((a, b) => a + b, 0) / averagesPerHour[hour].length
            return { hour: new Date(hour), average }
        })

        const averagesPerHourArraySorted = averagesPerHourArray.sort((a, b) => a.hour - b.hour)
        const averagesPerHourArraySortedString = averagesPerHourArraySorted.map(c => c.average)
        const duplicateAveragesPerHourArraySortedString = averagesPerHourArraySortedString.reduce((acc, c) => {
            acc.push(c)
            acc.push(c)
            acc.push(c)
            return acc
        }, [])

        output.push("")
        output.push("Heating Power (kW)                                                             𝐋𝐚𝐬𝐭 𝟐𝟒 𝐇𝐨𝐮𝐫𝐬")
        output.push("            ^")
        output.push(asciichart.plot(duplicateAveragesPerHourArraySortedString, { height: 10 }))
        output.push("       -----+---------------------------------------------------------------------------->")

        const dayAverage = averagesPerHourArraySorted.reduce((a, b) => a + b.average, 0) / averagesPerHourArraySorted.length
        output.push("Hour:       " + averagesPerHourArraySorted.map(c => fillo(String(c.hour.getHours()), 2, " ")).join(" "))
        output.push("Average Power: " + dayAverage.toFixed(2) + "kW")
        output.push("")

        // Calculate the consumption / day
        const powerAveragesPerHour = originalData.reduce((acc, c) => {
            const date = new Date(c.time)
            const hour = date.getHours()
            const yyyymmddhh = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate() + " " + hour + ":00"
            if (acc[yyyymmddhh] === undefined) {
                acc[yyyymmddhh] = []
            }
            acc[yyyymmddhh].push(+c.power)
            return acc
        }, {})

        const powerAveragesPerHourArray = Object.keys(powerAveragesPerHour).map(hour => {
            const average = powerAveragesPerHour[hour].reduce((a, b) => a + b, 0) / powerAveragesPerHour[hour].length
            return { hour: new Date(hour), average }
        }).sort((a, b) => a.hour - b.hour)

        const dayConsumptions = powerAveragesPerHourArray.reduce((acc, c) => {
            const date = new Date(c.hour)
            const yyyymmdd = date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate()
            if (acc[yyyymmdd] === undefined) {
                acc[yyyymmdd] = []
            }
            acc[yyyymmdd].push(c.average)
            return acc
        }, {})

        const dayConsumptionsArray = Object.keys(dayConsumptions).map(day => {
            // Check if today is the day but not checking only the getDate
            const isToday =  new Date(day).getFullYear() === new Date().getFullYear() && new Date(day).getMonth() === new Date().getMonth() && new Date(day).getDate() === new Date().getDate()
            const average = dayConsumptions[day].reduce((a, b) => a + b, 0) / dayConsumptions[day].length
            let consumption = null
            if (isToday) {
                const elapsedHoursToday = (new Date().getTime() - new Date(day).getTime()) / 1000 / 60 / 60
                consumption = average * elapsedHoursToday
            } else {
                consumption = average * 24
            }
            return { day: new Date(day), consumption, average: average }
        }).sort((a, b) => a.day - b.day)


        const totalConsumption = dayConsumptionsArray.reduce((acc, c) => acc + c.consumption, 0)
        const totalFuelConsumption = totalConsumption / this.config.estimations.pellet_kg_power
        const averageOfFuelConsumption = totalFuelConsumption / dayConsumptionsArray.length
        const remainingDays = (this.config.estimations.last_fuel_level - totalFuelConsumption) / averageOfFuelConsumption

        // Show the table
        output.push("")
        output.push("      Daily Reports   | Remaining Fuel: " + (this.config.estimations.last_fuel_level - totalFuelConsumption).toFixed(1) + "kg" + " for " + remainingDays.toFixed(1) + " days")
        output.push("      +------------+-------------------+--------+--------+-------------+----------+")
        output.push("      | Day        | Consumption (kWh) |  Fuel  |  Cost  | H. Average  |  Change  |")
        output.push("      +------------+-------------------+--------+--------+-------------+----------+")
        dayConsumptionsArray.forEach((c, index) => {
            const formattedDate = new Daty(c.day).format("YYYY-MM-DD")
            const day = c.day;
            const powerPercentComparedToPreviousDay = index === 0 ? 0 : (c.average - dayConsumptionsArray[index - 1].average) / dayConsumptionsArray[index - 1].average * 100

            output.push("      " +
                "| " + formattedDate + " |       " +
                fillo(c.consumption.toFixed(2), 6, " ") + "      | " +
                fillo((c.consumption / this.config.estimations.pellet_kg_power).toFixed(1) + "kg", " ", 6) + " | " +
                fillo("€" + (c.consumption / this.config.estimations.pellet_kg_power * this.config.estimations.pellet_kg_cost).toFixed(2), 6, " ") + " |  " +
                fillo(c.average.toFixed(4) + " kWh", 10, " ") + " |" +
                fillo((
                    powerPercentComparedToPreviousDay === 0 ? "          " :
                    powerPercentComparedToPreviousDay > 0 ? " ↑  " + powerPercentComparedToPreviousDay.toFixed(1) + "% " :
                                                            " ↓ " + powerPercentComparedToPreviousDay.toFixed(1) + "% "
                ), 10, " ") + "|"
            )
        })
        output.push("      +------------+-------------------+--------+--------+-------------+----------+")
        output.push("")
        return output.join("\n")
    }

    /**
     * keepLiveStreamActive
     *
     * @name keepLiveStreamActive
     * @function
     */
    keepLiveStreamActive () {
        if (this.verbose) {
            console.log("Taking control of the live stream")
        }
        spawn("curl", [this.config.live_stream_urls.override]).on("exit", () => {

            if (this.verbose) {
                console.log("Connecting to the live stream")
            }

            setTimeout(() => {
                const proc = spawn("curl", [this.config.live_stream_urls.video])
                const reconnect = () => {
                    if (reconnect.called) { return }
                    reconnect.called = true
                    if (this.verbose) {
                        console.log("Live stream disconnected.")
                    }
                    setTimeout(() => {
                        this.keepLiveStreamActive()
                    }, 1000)
                }
                proc.stdout.once("data", () => {
                    // Call zoomin 8 times
                    if (this.verbose) {
                        console.log("Calibrating zoom.")
                    }
                    if (this.config.live_stream_urls.zoomin) {
                        for (let i = 0; i < 48; ++i) {
                            setTimeout(() => {
                                if (i < 40) {
                                    if (this.verbose) {
                                        console.log(`${i + 1}/40 Zooming out`)
                                    }
                                    spawn("curl", [this.config.live_stream_urls.zoomout])
                                } else {
                                    if (this.verbose) {
                                        console.log(`${i + 1}/40 Zooming in`)
                                    }
                                    spawn("curl", [this.config.live_stream_urls.zoomin])
                                }
                            }, 1000 * i)
                        }
                    }
                })
                let timeout = null
                proc.stdout.on("data", buff => {
                    //console.log("Still connected to the live stream: " + buff.length)
                    clearTimeout(timeout)
                    timeout = setTimeout(reconnect, 1000 * 10)
                })
                proc.stdout.on("close", reconnect)
            }, 1000)
        })
    }

    /**
     * downloadCurrentFrame
     * Downloads the live stream frame.
     *
     * @name downloadCurrentFrame
     * @function
     * @return {Promise} A promise resolving when the frame is downloaded.
     */
    async downloadCurrentFrame () {
        // wget "$PELLET_BOILER_LIVE_STREAM_ROOT/cam/1/frame.jpg" --timeout=15 --tries=5 --retry-connrefused -O frame.jpg;
        return new Promise((resolve, reject) => {
            const proc = spawn("wget", [this.config.live_stream_urls.frame, "--timeout=15", "--tries=5", "--retry-connrefused", "-O", this.config.paths.frame])
            proc.stdout.pipe(process.stdout)
            proc.stderr.pipe(process.stdout)
            proc.on("exit", code => {
                if (code === 0) {
                    resolve()
                } else {
                    reject(new Error("wget exited with code " + code))
                }
            })
        })
    }

    /**
     * EkoHeatBoilerParser.getConfig
     *
     * @name getConfig
     * @function
     * @return {Object} An object containing the parsed configuration from the file.
     * @throws {Error} If the file is not found.
     * @throws {Error} If the file is not valid JSON.
     */
    static getConfig (path) {
        return require(`${process.cwd()}/${path}`)
    }
}

EkoHeatBoilerParser.OUT_OF_HOURS_MESSAGES = OUT_OF_HOURS_MESSAGES

module.exports = EkoHeatBoilerParser
