export interface ITwitterUser {
  profile_image_url: string;
  username: string;
  id: string;
}

export interface ITwitterOAuth2EchangeCode {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}
