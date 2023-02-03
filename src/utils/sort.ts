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

export default {
    sortHeatmap
}