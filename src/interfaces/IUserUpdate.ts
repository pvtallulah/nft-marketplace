export interface IUserUpdate {
  username?: string;
  email?: string;
  emailEnabled?: boolean;
  bio?: string;
  profileHash?: string;
  portraitHash?: string;
  spotifyUser?: string;
  spotifyEnabled?: boolean;
  youtubeUser?: string;
  youtubeEnabled?: boolean;
  twitchUser?: string;
  twitchEnabled?: boolean;
  kickUser?: string;
  kickEnabled?: boolean;
  soundCloudUser?: string;
  soundCloudEnabled?: boolean;
  decentralandEnabled?: boolean;
  decentralGamesEnabled?: boolean;
  instagramUser?: string;
  instagramEnabled?: boolean;
  tiktokUser?: string;
  tiktokEnabled?: boolean;
  twitterUser?: string;
  twitterEnabled?: boolean;
  tipsEnabled?: boolean;
  footerEnabled?: boolean;
  collectionsEnabled?: boolean;
  forSaleEnabled?: boolean;
  primaryColor?: string;
  secondaryColor?: string;
  backgroundHash?: string;
  backgroundRepeat?: boolean;
  fontType?: string;
  titleSize?: number;
  descriptionSize?: number;
  titleColor?: string;
  descriptionColor?: string;
  defaultProfile?: boolean;
}
