import moment from "moment";

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

function calculateAdjustedDate(startDate: Date, endDate: Date, dayMonth: string) {
    const start = moment(startDate);
    const end = moment(endDate);
    // Parse dayMonth into a moment object
    const dayMonthMoment = moment(dayMonth + ' ' + end.year(), 'DD MMM YYYY');

    // Calculate the period between start and end dates in months
    const periodInMonths = end.diff(start, 'months', true);

    // Calculate the adjusted date based on the period type
    let adjustedDate: moment.Moment;
    if (periodInMonths < 1) {
        adjustedDate = moment(dayMonthMoment).subtract(7, 'days');
    } else if (periodInMonths < 3) {
        adjustedDate = moment(dayMonthMoment).subtract(1, 'months');
    } else if (periodInMonths < 6) {
        adjustedDate = moment(dayMonthMoment).subtract(3, 'months');
    } else if (periodInMonths < 12) {
        adjustedDate = moment(dayMonthMoment).subtract(6, 'months');
    } else {
        adjustedDate = moment(dayMonthMoment).subtract(1, 'years');
    }
    return adjustedDate.format('YYYY-MM-DD');
}

export default {
    shiftHeatmapsHours,
    calculateAdjustedDate
}



