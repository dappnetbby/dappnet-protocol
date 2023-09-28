import React from 'react';
import ReactDOM from 'react-dom';
import { scaleTime } from 'd3-scale';
import { ChartCanvas, Chart } from 'react-stockcharts';
import { LineSeries } from 'react-stockcharts/lib/series';
import { XAxis, YAxis } from 'react-stockcharts/lib/axes';
import { timeFormat } from 'd3-time-format';
import { discontinuousTimeScaleProvider } from "react-stockcharts/lib/scale";
import { last } from "react-stockcharts/lib/utils";


import { format } from "d3-format";

import {
    ScatterSeries,
    SquareMarker,
    TriangleMarker,
    CircleMarker,
} from "react-stockcharts/lib/series";

import {
    CrossHairCursor,
    MouseCoordinateX,
    MouseCoordinateY,
} from "react-stockcharts/lib/coordinates";

import {
    OHLCTooltip,
} from "react-stockcharts/lib/tooltip";
import { fitWidth } from "react-stockcharts/lib/helper";

// const initialData = [
//     { date: new Date(2020, 0, 1), value: 85 },
//     { date: new Date(2020, 1, 1), value: 90 },
//     { date: new Date(2020, 2, 1), value: 88 },
//     // ... more data points
// ];
let xxxx_prev = 0
const initialData = [...Array(30).keys()].map(i => {
    // let deltaX = 1 + (Math.random());
    let deltaX = i * 1000 * 60 * 60 * 24;
    let deltaY = xxxx_prev + (Math.random() - 0.5);

    // start date
    const today = Date.now();

    xxxx_prev = deltaY

    return {
        date: new Date(+today + deltaX),
        value: deltaY + 100
    }
});


export function SimpleLineChart() {
    // const xAccessor = d => d.date;


    const xScaleProvider = discontinuousTimeScaleProvider
        .inputDateAccessor(d => d.date);
    const {
        data,
        xScale,
        xAccessor,
        displayXAccessor,
    } = xScaleProvider(initialData);

    const xExtents = [xAccessor(data[0]), xAccessor(data[data.length - 1])];
    // const xExtents = [
    //     xAccessor(last(data)),
    //     xAccessor(data[data.length - 1])
    // ];

    return (
        <ChartCanvas
            height={400}
            width={800}
            ratio={1}
            margin={{ left: 100, right: 50, top: 10, bottom: 30 }}
            data={data}
            type="hybrid"
            // xAccessor={xAccessor}
            // xScale={scaleTime()}
            // xExtents={xExtents}
            xAccessor={xAccessor}
            displayXAccessor={displayXAccessor}
            xScale={xScale}
            xExtents={xExtents}
        >
            <Chart id={0} yExtents={d => d.value}>
                {/* <XAxis axisAt="bottom" orient="bottom" ticks={6} tickFormat={timeFormat("%Y-%m-%d")} />
                <YAxis axisAt="left" orient="left" ticks={5} /> */}
                <XAxis
                    axisAt="bottom"
                    orient="bottom"
                    ticks={7}
                />
                <YAxis
                    axisAt="left"
                    orient="left"
                    tickFormat={x => `${x} GB`}
                    // tickInterval={5}
                    // tickValues={[40, 60]}
                    ticks={5}
                />

                <LineSeries yAccessor={d => d.value} stroke="blue" />
            </Chart>
        </ChartCanvas>
    );
}