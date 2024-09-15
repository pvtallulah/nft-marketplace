import { ViewEntity, ViewColumn } from "typeorm";
import { stringToBool, fixedPrice } from "../../utils";
@ViewEntity({
  expression: `
SELECT market_listing.id as 'market_listing_id', 
  market_listing.tokenId as 'market_listing_tokenId', 
  market_listing.active as 'market_listing_active', 
  market_listing.price AS 'market_listing_price', 
  market_listing.resourceGroupId as 'market_listing_resourceGroupId', 
  market_listing.sellerId as 'market_listing_sellerId', 
  market_listing.uriId as 'market_listing_uriId', 
  market_listing.animationId as 'market_listing_animationId', 
  market_listing.youtubeId as 'market_listing_youtubeId', 
  market_listing.descriptionId as 'market_listing_descriptionId', 
  uri.id as 'uri_id', 
  uri.uriUrl as 'uri_uriUrl',
  uri.s3Url as uri_s3Url,
  description.id as 'description_id', 
  description.hashDescription as 'description_hashDescription', 
  description.description as 'description_description', 
  seller.id as 'seller_id', 
  seller.sellerAddress as 'seller_sellerAddress', 
  youtube.id as 'youtube_id', 
  youtube.url as 'youtube_youtubeUrl', 
  animation.id as 'animation_id', 
  animation.url as 'animation_animationUrl',
  audio.id as 'audio_id', 
  audio.url as 'audio_audioUrl',
  resource_group.id as 'resource_group_id', 
  resource_group.resourceId as 'resource_group_resourceId', 
  resource_group.imageUrl as 'resource_group_imageUrl',
  resource_group.width as 'resource_group_width',
  resource_group.height as 'resource_group_height',
  resource_group.nftAddressId as 'resource_group_nftAddressId',
  resource_group.name as resource_group_collectionName,
  nft_address.id as 'nft_address_id', 
  nft_address.nftAddress as 'nft_address_nftAddress', 
  nft_address.name as 'nft_address_name', 
  nft_address.symbol as 'nft_address_symbol', 
  nft_address.isWearable as 'nft_address_isWearable', 
  nft_address.isIceCollection as 'nft_address_isIceCollection', 
  nft_address.isDecentraland as 'nft_address_isDecentraland', 
  nft_address.isVerifiedCollection as 'nft_address_isVerifiedCollection',  
  nft_address.nftTypeId as 'nft_address_nftTypeId', 
  nft_address.totalSales as 'nft_address_totalSales', 
  nft_address.iceAmount as 'nft_address_iceAmount', 
  nft_address.banned as nft_address_banned,
  nft_type.id as 'nft_type_id', 
  nft_type.type as 'nft_type_type'
FROM 
  market_listing 
  LEFT JOIN uri ON uri.id = market_listing.uriId 
  LEFT JOIN description ON description.id = market_listing.descriptionId 
  LEFT JOIN seller ON seller.id = market_listing.sellerId 
  LEFT JOIN youtube ON youtube.id = market_listing.youtubeId 
  LEFT JOIN animation ON animation.id = market_listing.animationId
  LEFT JOIN audio ON audio.id = market_listing.audioId
  LEFT JOIN resource_group ON resource_group.id = market_listing.resourceGroupId 
  LEFT JOIN nft_address ON nft_address.id = resource_group.nftAddressId 
  LEFT JOIN nft_type ON nft_type.id = nft_address.nftTypeId
  GROUP BY resource_group.resourceId;`,
})

// @ViewEntity({
//   expression: `
//   SELECT
//     market_listing.id
//     ,market_listing.sellerAddress
//     ,market_listing.sync
//     ,market_listing.lastSync
//     ,market_listing.active
//     ,market_listing.created_at
//     ,market_listing.updated_at
//     ,market_listing.nftAddress
//     ,market_listing.tokenId
//     ,token.resourceId
//     ,token.imageUrl
//     ,token.name
//     ,token.description
//     ,token.thumbnailUrl
//     ,token_gruped.price
//     ,token_gruped.symbol
//     ,token_gruped.contractType
//     ,token_gruped.isDecentraland
//     ,CASE WHEN vf.address IS NOT NULL
//         THEN TRUE
//         ELSE FALSE
//     END AS 'isVerifiedCreator'
//     ,CASE WHEN ic.address IS NOT NULL
//         THEN TRUE
//         ELSE FALSE
// END AS 'isIceCollection'
// ,token_gruped.isWearable
//   FROM market_listing
//   INNER JOIN token ON market_listing.nftAddress = token.nftAddress
//     AND market_listing.tokenId = token.id
//   INNER JOIN (
// SELECT market_listing.nftAddress
//      ,token.resourceId
//     -- , token.id
//      ,min(market_listing.price) AS price
//      ,min(market_listing.updated_at) AS dates
// 	  ,nft.symbol
// 	  ,nft.contractType
//     ,nft.isDecentraland
//     ,nft.isWearable
// 	  ,market_listing.tokenId
//     FROM market_listing
//     INNER JOIN nft ON market_listing.nftAddress = nft.address
//    INNER JOIN token ON market_listing.nftAddress = token.nftAddress
//       AND market_listing.tokenId = token.id
//     GROUP BY token.resourceId
//     ,market_listing.nftAddress
//     ,nft.contractType
//     ,nft.symbol
//    -- ,token.id
//     ) token_gruped ON market_listing.nftAddress = token_gruped.nftAddress
//     -- AND market_listing.price = token_gruped.price
//     AND market_listing.updated_at = token_gruped.dates
//     AND token.resourceId = token_gruped.resourceId
//     LEFT JOIN verified_creator vf ON vf.address = market_listing.sellerAddress AND vf.isActive = TRUE
//     LEFT JOIN ice_collection ic ON ic.address = market_listing.nftAddress AND ic.isActive = TRUE
//   `,
// })
// OLD
export class MarketListingNotGrouped {
  @ViewColumn()
  market_listing_id: number;

  @ViewColumn()
  market_listing_tokenId: string;

  @ViewColumn({ transformer: stringToBool })
  market_listing_active: boolean;

  @ViewColumn({ transformer: fixedPrice })
  market_listing_price: number;

  @ViewColumn()
  market_listing_resourceGroupId: string;

  @ViewColumn()
  market_listing_sellerId: string;

  @ViewColumn()
  market_listing_uriId: string;

  @ViewColumn()
  market_listing_animationId: string;

  @ViewColumn()
  market_listing_youtubeId: string;

  @ViewColumn()
  market_listing_descriptionId: string;

  @ViewColumn()
  description_hashDescription: string;

  @ViewColumn()
  uri_id: number;

  @ViewColumn()
  uri_uriUrl: string;

  @ViewColumn()
  uri_s3Url: string;

  @ViewColumn()
  description_id: number;

  @ViewColumn()
  description_description: string;

  @ViewColumn()
  seller_id: number;

  @ViewColumn()
  seller_sellerAddress: string;

  @ViewColumn()
  youtube_id: number;

  @ViewColumn()
  youtube_youtubeUrl: string;

  @ViewColumn()
  animation_id: number;

  @ViewColumn()
  animation_animationUrl: string;

  @ViewColumn()
  audio_id: number;

  @ViewColumn()
  audio_audioUrl: string;

  @ViewColumn()
  resource_group_id: number;

  @ViewColumn()
  resource_group_resourceId: string;

  @ViewColumn()
  resource_group_imageUrl: string;

  @ViewColumn()
  resource_group_width: number;

  @ViewColumn()
  resource_group_height: number;

  @ViewColumn()
  resource_group_nftAddressId: string;

  @ViewColumn()
  resource_group_collectionName: string;

  @ViewColumn()
  nft_address_id: number;

  @ViewColumn()
  nft_address_nftAddress: string;

  @ViewColumn()
  nft_address_name: string;

  @ViewColumn()
  nft_address_symbol: string;

  @ViewColumn()
  nft_address_nftTypeId: string;

  @ViewColumn({ transformer: stringToBool })
  nft_address_banned: boolean;

  @ViewColumn()
  nft_type_id: number;

  @ViewColumn()
  nft_type_type: string;

  @ViewColumn({ transformer: stringToBool })
  nft_address_isWearable: boolean;

  @ViewColumn({ transformer: stringToBool })
  nft_address_isIceCollection: boolean;

  @ViewColumn({ transformer: stringToBool })
  nft_address_isDecentraland: boolean;

  @ViewColumn({ transformer: stringToBool })
  nft_address_isVerifiedCollection: boolean;

  @ViewColumn()
  nft_address_totalSales: number;

  @ViewColumn({ transformer: fixedPrice })
  nft_address_iceAmount: number;
}

// create or replace view market_listing_grouped
// AS
// select `market_listing`.`id` AS `market_listing_id`,
// `market_listing`.`tokenId` AS `market_listing_tokenId`,
// `market_listing`.`active` AS `market_listing_active`,
// min(`market_listing`.`price`) AS `market_listing_price`,
// `market_listing`.`resourceGroupId` AS `market_listing_resourceGroupId`,
// `market_listing`.`sellerId` AS `market_listing_sellerId`,
// `market_listing`.`uriId` AS `market_listing_uriId`,
// `market_listing`.`animationId` AS `market_listing_animationId`,
// `market_listing`.`youtubeId` AS `market_listing_youtubeId`,
// `market_listing`.`descriptionId` AS `market_listing_descriptionId`,
// `uri`.`id` AS `uri_id`,
// `uri`.`uriUrl` AS `uri_uriUrl`,
// `description`.`id` AS `description_id`,
// `description`.`hashDescription` AS `description_hashDescription`,
// `description`.`description` AS `description_description`,
// `seller`.`id` AS `seller_id`,
// `seller`.`sellerAddress` AS `seller_sellerAddress`,
// `seller`.`isVerifiedCreator` AS `seller_isVerifiedCreator`,
// `youtube`.`id` AS `youtube_id`,
// `youtube`.`youtubeUrl` AS `youtube_youtubeUrl`,
// `animation`.`id` AS `animation_id`,
// `animation`.`animationUrl` AS `animation_animationUrl`,
// `resource_group`.`id` AS `resource_group_id`,
// `resource_group`.`resourceId` AS `resource_group_resourceId`,
// `resource_group`.`imageUrl` AS `resource_group_imageUrl`,
// `resource_group`.`nftAddressId` AS `resource_group_nftAddressId`,
// `nft_address`.`id` AS `nft_address_id`,
// `nft_address`.`nftAddress` AS `nft_address_nftAddress`,
// `nft_address`.`name` AS `nft_address_name`,
// `nft_address`.`symbol` AS `nft_address_symbol`,
// `nft_address`.`isWearable` AS `nft_address_isWearable`,
// `nft_address`.`isIceCollection` AS `nft_address_isIceCollection`,
// `nft_address`.`isDecentraland` AS `nft_address_isDecentraland`,
// `nft_address`.`nftTypeId` AS `nft_address_nftTypeId`,
// `nft_type`.`id` AS `nft_type_id`,
// `nft_type`.`type` AS `nft_type_type`
// FROM
//   `market_listing` `market_listing`
//   LEFT JOIN `uri` `uri` ON `uri`.`id` = `market_listing`.`uriId`
//   LEFT JOIN `description` `description` ON `description`.`id` = `market_listing`.`descriptionId`
//   LEFT JOIN `seller` `seller` ON `seller`.`id` = `market_listing`.`sellerId`
//   LEFT JOIN `youtube` `youtube` ON `youtube`.`id` = `market_listing`.`youtubeId`
//   LEFT JOIN `animation` `animation` ON `animation`.`id` = `market_listing`.`animationId`
//   LEFT JOIN `resource_group` `resource_group` ON `resource_group`.`id` = `market_listing`.`resourceGroupId`
//   LEFT JOIN `nft_address` `nft_address` ON `nft_address`.`id` = `resource_group`.`nftAddressId`
//   LEFT JOIN `nft_type` `nft_type` ON `nft_type`.`id` = `nft_address`.`nftTypeId`
//   group by resource_group_id
