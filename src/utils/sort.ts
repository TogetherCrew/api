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
    for (const channel of channels) {
        if (channel.parent_id === null) {
            const subChannels = channels.filter((c) => c.parent_id === channel.id);
            if (subChannels.length > 0) {
                sortedChannels.push({
                    id: channel.id,
                    title: channel.name,
                    subChannels: subChannels,
                });
            }
        }
    }

    return sortedChannels;
}


export default {
    sortChannels,
    sortHeatmap
}