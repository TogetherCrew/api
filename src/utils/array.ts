function fillEmptyElemetns(heatmaps: number[][]) {
    const fullArray: number[][] = [];
    for (let counter = 0, i = 0, j = 1; counter < 168; j++, counter++) {
        if (j > 24) {
            j = 1;
            i++;
        }
        fullArray.push([i, j, 0]);
    }
    for (let counter = 0; counter < heatmaps.length; counter++) {
        fullArray[((heatmaps[counter][0] * 24) + heatmaps[counter][1]) - 1] = heatmaps[counter]
    }
    return fullArray;
}

export default {
    fillEmptyElemetns
}