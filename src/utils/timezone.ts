function shiftHeatmapsHours(heatmaps: number[][], timeZoneOffset: number) {
    let shiftedHour, shiftedDay = 0;
    const heatmapsTimezone: number[][] = [];
    if (timeZoneOffset > 0) {
        for (let i = 0; i < heatmaps.length; i++) {
            shiftedHour = heatmaps[i][1] + timeZoneOffset;
            if (shiftedHour > 24) {
                shiftedDay = (heatmaps[i][0] + 1) > 6 ? 0 : heatmaps[i][0] + 1;
                heatmapsTimezone.push([shiftedDay, shiftedHour - 24, heatmaps[i][2]])
            }
            else {
                heatmapsTimezone.push([heatmaps[i][0], shiftedHour, heatmaps[i][2]])
            }
        }
    } else {
        for (let i = 0; i < heatmaps.length; i++) {
            shiftedHour = heatmaps[i][1] + timeZoneOffset;
            if (shiftedHour < 1) {
                shiftedDay = (heatmaps[i][0] - 1) < 0 ? 6 : heatmaps[i][0] - 1;
                heatmapsTimezone.push([shiftedDay, shiftedHour + 24, heatmaps[i][2]])
            }
            else {
                heatmapsTimezone.push([heatmaps[i][0], shiftedHour, heatmaps[i][2]])
            }
        }
    }
    return heatmapsTimezone;
}

export default {
    shiftHeatmapsHours
}

