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
            // Remove channel from array ()
            channels.splice(i, 1);
            i--;
            for (j = 0; j < channels.length; j++) {
                if (sortedChannels[m].id === channels[j].parent_id) {
                    sortedChannels[m].subChannels.push(channels[j]);
                    // Remove channel from array ()
                    channels.splice(j, 1);
                    j--;
                }
            }
            m++;
        }
    }
    return sortedChannels;
}



export default {
    sortChannels
}