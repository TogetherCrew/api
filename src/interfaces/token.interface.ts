export interface authTokens {
    access: {
        token: string,
        expires: Date
    },
    refresh: {
        token: string,
        expires: Date
    }
}