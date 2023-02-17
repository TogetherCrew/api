function sortHeatmap(a: Array<number>, b: Array<number>) {
    if (a[0] === b[0]) {
        if (a[1] === b[1]) {
            return 0;
        }
        else {
            return (a[1] < b[1]) ? -1 : 1;
        }
    }
    else {
        return (a[0] < b[0]) ? -1 : 1;
    }
}



/**
 * sort channels
 * @param {Array} channels
 * @returns {Array}
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sortChannels(channels: Array<any>) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sortedChannels: Array<any> = [];
    let i, j, m = 0;
    for (i = 0; i < channels.length; i++) {
        if (channels[i].parent_id === null) {
            sortedChannels.push({ id: channels[i].id, title: channels[i].name, subChannels: [] });
            //  TODO: Remove channel from array
            for (j = 0; j < channels.length; j++) {
                if (sortedChannels[m].id === channels[j].parent_id) {
                    sortedChannels[m].subChannels.push(channels[j]);
                    //  TODO: Remove channel from array
                }
            }
            m++;
        }
    }
    return sortedChannels;
}



export default {
    sortChannels,
    sortHeatmap
}