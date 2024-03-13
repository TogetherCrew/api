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
    fullArray[heatmaps[counter][0] * 24 + heatmaps[counter][1] - 1] = heatmaps[counter];
  }
  return fullArray;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fillHeatmapLineGraph(lineGraph: any, startDate: Date, endDate: Date) {
  const chartData = {
    categories: [] as string[],
    series: [] as { name: string; data: number[] }[],
    emojis: lineGraph.emojis,
    messages: lineGraph.messages,
    msgPercentageChange: lineGraph.msgPercentageChange,
    emojiPercentageChange: lineGraph.emojiPercentageChange,
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fillActiveMembersCompositionLineGraph(lineGraph: any, startDate: Date, endDate: Date) {
  const chartData = {
    categories: [] as string[],
    series: [] as { name: string; data: number[] }[],
    totActiveMembers: lineGraph.totActiveMembers,
    newlyActive: lineGraph.newlyActive,
    consistentlyActive: lineGraph.consistentlyActive,
    vitalMembers: lineGraph.vitalMembers,
    becameDisengaged: lineGraph.becameDisengaged,
    totActiveMembersPercentageChange: lineGraph.totActiveMembersPercentageChange,
    newlyActivePercentageChange: lineGraph.newlyActivePercentageChange,
    consistentlyActivePercentageChange: lineGraph.consistentlyActivePercentageChange,
    vitalMembersPercentageChange: lineGraph.vitalMembersPercentageChange,
    becameDisengagedPercentageChange: lineGraph.becameDisengagedPercentageChange,
  };
  let currentDate = moment(startDate);
  const stopDate = moment(endDate);
  while (currentDate <= stopDate) {
    chartData.categories.push(currentDate.format('DD MMM'));
    currentDate = moment(currentDate).add(1, 'days');
  }

  chartData.series = [
    { name: 'totActiveMembers', data: new Array(chartData.categories.length).fill(0) },
    { name: 'newlyActive', data: new Array(chartData.categories.length).fill(0) },
    { name: 'consistentlyActive', data: new Array(chartData.categories.length).fill(0) },
    { name: 'vitalMembers', data: new Array(chartData.categories.length).fill(0) },
    { name: 'becameDisengaged', data: new Array(chartData.categories.length).fill(0) },
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fillActiveMembersOnboardingLineGraph(lineGraph: any, startDate: Date, endDate: Date) {
  const chartData = {
    categories: [] as string[],
    series: [] as { name: string; data: number[] }[],
    joined: lineGraph.joined,
    newlyActive: lineGraph.newlyActive,
    stillActive: lineGraph.stillActive,
    dropped: lineGraph.dropped,
    joinedPercentageChange: lineGraph.joinedPercentageChange,
    newlyActivePercentageChange: lineGraph.newlyActivePercentageChange,
    stillActivePercentageChange: lineGraph.stillActivePercentageChange,
    droppedPercentageChange: lineGraph.droppedPercentageChange,
  };
  let currentDate = moment(startDate);
  const stopDate = moment(endDate);
  while (currentDate <= stopDate) {
    chartData.categories.push(currentDate.format('DD MMM'));
    currentDate = moment(currentDate).add(1, 'days');
  }

  chartData.series = [
    { name: 'joined', data: new Array(chartData.categories.length).fill(0) },
    { name: 'newlyActive', data: new Array(chartData.categories.length).fill(0) },
    { name: 'stillActive', data: new Array(chartData.categories.length).fill(0) },
    { name: 'dropped', data: new Array(chartData.categories.length).fill(0) },
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fillDisengagedMembersCompositionLineGraph(lineGraph: any, startDate: Date, endDate: Date) {
  const chartData = {
    categories: [] as string[],
    series: [] as { name: string; data: number[] }[],
    becameDisengaged: lineGraph.becameDisengaged,
    wereNewlyActive: lineGraph.wereNewlyActive,
    wereConsistentlyActive: lineGraph.wereConsistentlyActive,
    wereVitalMembers: lineGraph.wereVitalMembers,
    becameDisengagedPercentageChange: lineGraph.becameDisengagedPercentageChange,
    wereNewlyActivePercentageChange: lineGraph.wereNewlyActivePercentageChange,
    wereConsistentlyActivePercentageChange: lineGraph.wereConsistentlyActivePercentageChange,
    wereVitalMembersPercentageChange: lineGraph.wereVitalMembersPercentageChange,
  };
  let currentDate = moment(startDate);
  const stopDate = moment(endDate);
  while (currentDate <= stopDate) {
    chartData.categories.push(currentDate.format('DD MMM'));
    currentDate = moment(currentDate).add(1, 'days');
  }

  chartData.series = [
    { name: 'becameDisengaged', data: new Array(chartData.categories.length).fill(0) },
    { name: 'wereNewlyActive', data: new Array(chartData.categories.length).fill(0) },
    { name: 'wereConsistentlyActive', data: new Array(chartData.categories.length).fill(0) },
    { name: 'wereVitalMembers', data: new Array(chartData.categories.length).fill(0) },
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fillInactiveMembersLineGraph(lineGraph: any, startDate: Date, endDate: Date) {
  const chartData = {
    categories: [] as string[],
    series: [] as { name: string; data: number[] }[],
    returned: lineGraph.returned,
    returnedPercentageChange: lineGraph.returnedPercentageChange,
  };
  let currentDate = moment(startDate);
  const stopDate = moment(endDate);
  while (currentDate <= stopDate) {
    chartData.categories.push(currentDate.format('DD MMM'));
    currentDate = moment(currentDate).add(1, 'days');
  }

  chartData.series = [{ name: 'returned', data: new Array(chartData.categories.length).fill(0) }];

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
  fillHeatmapLineGraph,
  fillActiveMembersCompositionLineGraph,
  fillActiveMembersOnboardingLineGraph,
  fillDisengagedMembersCompositionLineGraph,
  fillInactiveMembersLineGraph,
};
