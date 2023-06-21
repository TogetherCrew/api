/**
 * sort channels
 * @param {Array} channels
 * @returns {Array}
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sortChannels(channels: Array<any>) {
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

function sortByHandler(sortBy: string): Record<string, 1 | -1> {
    let sortParams: Record<string, 1 | -1> = {};
    sortParams = sortBy.split(',').reduce((acc, curr) => {
        const [field, order] = curr.split(':');
        acc[field] = order === 'desc' ? -1 : 1;
        return acc;
    }, sortParams);
    return sortParams;
}




export default {
    sortChannels,
    sortByHandler
}