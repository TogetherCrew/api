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

export interface twitterAuthTokens {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    scope: string;
}