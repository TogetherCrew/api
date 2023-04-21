function calculatePercentageChange(oldValue: number, newValue: number): number {
    if (oldValue === 0 && newValue === 0) {
        return 0;
    }

    const percentageChange = ((newValue - oldValue) / oldValue) * 100;

    if (isNaN(percentageChange) || !isFinite(percentageChange)) {
        return 0;
    }

    return percentageChange;
}


export default {
    calculatePercentageChange
}

