import { ViewEntity, ViewColumn } from "typeorm";
import { stringToBool, fixedPrice } from "../../utils";
@ViewEntity({
  expression: `
  select 
  market_listing.id as market_listing_id, 
  min(market_listing.tokenId) as market_listing_tokenId, 
  market_listing.active as market_listing_active, 
  min(market_listing.price) as market_listing_price, 
  market_listing.resourceGroupId as market_listing_resourceGroupId, 
  market_listing.sellerId as market_listing_sellerId, 
  market_listing.uriId as market_listing_uriId, 
  market_listing.animationId as market_listing_animationId, 
  market_listing.youtubeId as market_listing_youtubeId, 
  market_listing.descriptionId as market_listing_descriptionId, 
  uri.id as uri_id,
  uri.uriUrl as uri_uriUrl,
  uri.s3Url as uri_s3Url,
  description.id as description_id, 
  description.hashDescription as description_hashDescription, 
  description.description as description_description, 
  seller.id as seller_id, 
  seller.sellerAddress as seller_sellerAddress, 
  youtube.id as youtube_id, 
  youtube.url as youtube_youtubeUrl, 
  animation.id as animation_id, 
  animation.url as animation_animationUrl, 
  audio.id as audio_id, 
  audio.url as audio_audioUrl, 
  resource_group.id as resource_group_id, 
  resource_group.resourceId as resource_group_resourceId, 
  resource_group.imageUrl as resource_group_imageUrl, 
  resource_group.width as resource_group_width, 
  resource_group.height as resource_group_height, 
  resource_group.nftAddressId as resource_group_nftAddressId,
  resource_group.name as resource_group_collectionName,
  nft_address.id as nft_address_id, 
  nft_address.nftAddress as nft_address_nftAddress, 
  nft_address.name as nft_address_name, 
  nft_address.symbol as nft_address_symbol, 
  nft_address.isWearable as nft_address_isWearable, 
  nft_address.isIceCollection as nft_address_isIceCollection, 
  nft_address.isDecentraland as nft_address_isDecentraland, 
  nft_address.isVerifiedCollection as nft_address_isVerifiedCollection, 
  nft_address.nftTypeId as nft_address_nftTypeId, 
  nft_address.totalSales as nft_address_totalSales, 
  nft_address.iceAmount as nft_address_iceAmount,
  nft_address.banned as nft_address_banned,
  nft_type.id as nft_type_id, 
  nft_type.type as nft_type_type 
from 
  market_listing market_listing 
  left join uri on uri.id = market_listing.uriId 
  left join description on description.id = market_listing.descriptionId 
  left join seller on seller.id = market_listing.sellerId 
  left join youtube on youtube.id = market_listing.youtubeId 
  left join animation on animation.id = market_listing.animationId 
  left join audio on audio.id = market_listing.audioId 
  left join resource_group on resource_group.id = market_listing.resourceGroupId 
  left join nft_address on nft_address.id = resource_group.nftAddressId 
  left join nft_type on nft_type.id = nft_address.nftTypeId 
WHERE 
  NOT EXISTS (
    SELECT 
      1 
    FROM 
      market_listing m2 
    WHERE 
      m2.resourceGroupId = market_listing.resourceGroupId 
      AND m2.tokenId <> market_listing.tokenId 
      AND m2.price < market_listing.price
  )
  GROUP BY 
  resourceGroupId;`,
})
export class MarketListingGrouped {
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
