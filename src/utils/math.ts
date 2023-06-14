function calculatePercentageChange(oldValue: number, newValue: number): number | string {
    if (oldValue === 0) {
        return 'N/A';
    }

    const percentageChange = ((newValue - oldValue) / oldValue) * 100;

    // if (isNaN(percentageChange) || !isFinite(percentageChange)) {
    //     return 0;
    // }

    return percentageChange;
}


export default {
    calculatePercentageChange
}

