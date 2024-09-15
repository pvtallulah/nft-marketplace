import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  PrimaryColumn,
  Unique,
} from "typeorm";

@Entity()
@Unique(["address"])
export class User {
  @PrimaryGeneratedColumn()
  idUser: number;

  @Column({ length: 42 })
  address: string;

  @Column({ length: 40, nullable: true })
  username: string;

  @Column({ length: 255, nullable: true })
  email: string;

  @Column({ default: false })
  emailEnabled: boolean;

  @Column({ length: 500, nullable: true })
  bio: string;

  @Column({ length: 255, nullable: true })
  profileHash: string;

  @Column({ length: 255, nullable: true })
  portraitHash: string;

  @Column()
  apiKey: string;

  @Column()
  apiExpiration: Date;

  @Column({ length: 255, nullable: true })
  spotifyUser: string;

  @Column({ default: false })
  spotifyEnabled: boolean;

  @Column({ length: 255, nullable: true })
  youtubeUser: string;

  @Column({ default: false })
  youtubeEnabled: boolean;

  @Column({ length: 255, nullable: true })
  twitchUser: string;

  @Column({ default: false })
  twitchEnabled: boolean;

  @Column({ length: 255, nullable: true })
  kickUser: string;

  @Column({ default: false })
  kickEnabled: boolean;

  @Column({ length: 255, nullable: true })
  soundCloudUser: string;

  @Column({ default: false })
  soundCloudEnabled: boolean;

  @Column({ default: false })
  decentralandEnabled: boolean;

  @Column({ default: false })
  decentralGamesEnabled: boolean;

  @Column({ length: 255, nullable: true })
  instagramUser: string;

  @Column({ default: false })
  instagramEnabled: boolean;

  @Column({ length: 255, nullable: true })
  tiktokUser: string;

  @Column({ default: false })
  tiktokEnabled: boolean;

  @Column({ length: 255, nullable: true })
  twitterUser: string;

  @Column({ default: false })
  twitterEnabled: boolean;

  @Column({ default: true })
  tipsEnabled: boolean;

  @Column({ default: true })
  footerEnabled: boolean;

  @Column({ default: true })
  collectionsEnabled: boolean;

  @Column({ default: true })
  forSaleEnabled: boolean;

  @Column({ nullable: true })
  primaryColor: string;

  @Column({ nullable: true })
  secondaryColor: string;

  @Column({ length: 37, nullable: true })
  backgroundHash: string;

  @Column({ default: false })
  backgroundRepeat: boolean;

  @Column({ length: 60, nullable: true })
  fontType: string;

  @Column({ nullable: true })
  titleSize: number;

  @Column({ nullable: true })
  descriptionSize: number;

  @Column({ nullable: true })
  titleColor: string;

  @Column({ nullable: true })
  descriptionColor: string;

  @Column({ default: true })
  defaultProfile: boolean;

  @Column({ type: "varchar", length: 255, nullable: true })
  avatar: string;
}
