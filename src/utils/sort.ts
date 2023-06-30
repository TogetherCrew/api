
import { ICustomChannel } from '../interfaces/guild.interface';
interface SortedChannel {
    channelId: string;
    title: string;
    subChannels: ICustomChannel[];
}

function sortChannels(channels: any[]) {
    const sortedChannels: any[] = [];
    const unCategorized: any = {
        channelId: "0",
        title: "unCategorized",
        subChannels: []
    };

    for (const channel of channels) {
        if (channel.parentId === null) {
            const subChannels = channels.filter((c: any) => c.parentId === channel.channelId);
            if (subChannels.length > 0) {
                sortedChannels.push({
                    channelId: channel.channelId,
                    title: channel.name,
                    subChannels,
                });
            } else {
                unCategorized.subChannels.push({ ...channel, channelId: channel.channelId, parentId: channel.channelId, name: channel.name });
            }
        }
    }

    if (unCategorized.subChannels.length > 0) {
        sortedChannels.push(unCategorized);
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
    sortByHandler,
}