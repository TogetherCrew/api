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

function calculateAdjustedDate(endDate: Date, dayMonth: string) {
    const end = moment(endDate);
    const dayMonthMoment = moment(dayMonth + ' ' + end.year(), 'DD MMM YYYY');
    return (moment(dayMonthMoment).subtract(7, 'days')).format('YYYY-MM-DD')
}
/**
 * Returns the UTC timestamp of yesterday with hour, minute, second and millisecond equal to 0.
 *
 * @return {number} The UTC timestamp of yesterday.
 */
function getYesterdayUTCtimestamp(){
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    const year = yesterday.getUTCFullYear()
    const month = yesterday.getUTCMonth()
    const day = yesterday.getUTCDate()

    const yesterdayUTC = new Date(Date.UTC(year, month, day))
    const yesterdayUTCtimestamp = yesterdayUTC.getTime()

    return yesterdayUTCtimestamp
}

function get7daysAgoUTCtimestamp(){
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const year = sevenDaysAgo.getUTCFullYear()
    const month = sevenDaysAgo.getUTCMonth()
    const day = sevenDaysAgo.getUTCDate()

    const sevenDaysAgoUTC = new Date(Date.UTC(year, month, day))
    const sevenDaysAgoUTCtimestamp = sevenDaysAgoUTC.getTime()

    return sevenDaysAgoUTCtimestamp
}

export default {
    shiftHeatmapsHours,
    calculateAdjustedDate,
    getYesterdayUTCtimestamp,
    get7daysAgoUTCtimestamp
}



