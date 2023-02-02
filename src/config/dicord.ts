const scopes = {
    login: "identify email guilds",
    bot: "bot applications.commands identify email guilds",
    connectGuild: "bot applications.commands",
};

const permissions = {
    ViewChannels: 0x400,
    manageServer: 0x20
}

export {
    scopes,
    permissions
}

