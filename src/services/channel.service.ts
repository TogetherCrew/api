/**
 *  check if a bot has the "Read Message History" permissio 
 * @param {number} botPermissions
 * @returns {boolean}
 */
function hasReadMessageHistory(botPermissions: number): boolean {
    const READ_MESSAGE_HISTORY = 0x40;
    return (botPermissions & READ_MESSAGE_HISTORY) !== 0;
}



export default {
    hasReadMessageHistory
}