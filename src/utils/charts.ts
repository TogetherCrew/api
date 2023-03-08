import moment from 'moment';

function fillHeatmapChart(heatmaps: number[][]) {
    const fullArray: number[][] = [];
    for (let counter = 0, i = 0, j = 1; counter < 168; j++, counter++) {
        if (j > 24) {
            j = 1;
            i++;
        }
        fullArray.push([i, j, 0]);
    }
    for (let counter = 0; counter < heatmaps.length; counter++) {
        fullArray[((heatmaps[counter][0] * 24) + heatmaps[counter][1]) - 1] = heatmaps[counter]
    }
    return fullArray;
}

function fillLineGraph(lineGraph: any, startDate: Date, endDate: Date) {
    const chartData = {
        categories: [] as string[],
        series: [] as { name: string, data: number[] }[],
        emojis: lineGraph.emojis,
        messages: lineGraph.messages,
        msgPercentageChange: lineGraph.msgPercentageChange,
        emojiPercentageChange: lineGraph.emojiPercentageChange
    };
    let currentDate = moment(startDate);
    const stopDate = moment(endDate);
    while (currentDate <= stopDate) {
        chartData.categories.push(currentDate.format('DD MMM'));
        currentDate = moment(currentDate).add(1, 'days');
    }

    chartData.series = [
        { name: 'emojis', data: new Array(chartData.categories.length).fill(0) },
        { name: 'messages', data: new Array(chartData.categories.length).fill(0) },
    ];



    for (let i = 0; i < lineGraph.categories.length; i++) {
        const category = lineGraph.categories[i];
        const chartIndex = chartData.categories.indexOf(category);
        if (chartIndex >= 0) {
            for (let j = 0; j < chartData.series.length; j++) {
                chartData.series[j].data[chartIndex] = lineGraph.series[j].data[i];
            }
        }
    }
    return chartData;

}
export default {
    fillHeatmapChart,
    fillLineGraph
}