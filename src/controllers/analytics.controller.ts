import {
  Controller,
  Route,
  Get,
  Tags,
  Query,
  FieldErrors,
  ValidateError,
} from "tsoa";
import * as analyticsService from "../services/analytics.service";
import {
  IDGResponse,
  IWalletRevenuePerDay,
  IWalletNftSoldPerDay,
  IWalletTotalRevenue,
  IWalletTotalNftSold,
  IWalletNftSoldRanking,
  IWalletRecentSales,
  IMarketplaceSalesPerDay,
  IMarketplaceNftSoldPerDay,
  IMarketplaceTotalSales,
  IMarketplaceTotalNftSold,
  IMarketplaceNftSoldRanking,
  IMarketplaceRecentSales,
  IMarketplaceGeneralActivity,
  ITokenActivity,
  ITradeVolume,
  IRecentActivity,
} from "../interfaces";

import { isAddress } from "../utils";
import { getAnalyticsDate, validateAnalyticsDate } from "../utils";

@Route("analytics")
@Tags("Analytics")
export class Analytics extends Controller {
  @Get("/wallet-revenue-per-day")
  public async getWalletRevenuePerDay(
    @Query() walletAddress: string,
    @Query() from?: string,
    @Query() to?: string
  ): Promise<IDGResponse<IWalletRevenuePerDay[]>> {
    try {
      const { fromDate, toDate } = getAnalyticsDate(from, to);
      validateAnalyticsDate(fromDate, toDate);
      if (!isAddress(walletAddress)) {
        const fields: FieldErrors = {
          walletAddress: {
            message: "Invalid address",
            value: walletAddress,
          },
        };
        throw new ValidateError(fields, "Error with walletAddress params");
      }
      const walletRevenuePerDay = await analyticsService.getWalletRevenuePerDay(
        {
          from: fromDate,
          to: toDate,
          walletAddress,
        }
      );
      return {
        status: 200,
        data: walletRevenuePerDay,
        message: "getWalletRevenuePerDay listed successfully",
      };
    } catch (e) {
      throw e;
    }
  }
  @Get("/wallet-nft-sold-per-day")
  public async getWalletNftSoldPerDay(
    @Query() walletAddress: string,
    @Query() from?: string,
    @Query() to?: string
  ): Promise<IDGResponse<IWalletNftSoldPerDay[]>> {
    try {
      const { fromDate, toDate } = getAnalyticsDate(from, to);
      validateAnalyticsDate(fromDate, toDate);
      if (!isAddress(walletAddress)) {
        const fields: FieldErrors = {
          walletAddress: {
            message: "Invalid address",
            value: walletAddress,
          },
        };
        throw new ValidateError(fields, "Error with walletAddress params");
      }
      const walletNftSoldPerDay = await analyticsService.getWalletNftSoldPerDay(
        {
          from: fromDate,
          to: toDate,
          walletAddress,
        }
      );
      return {
        status: 200,
        data: walletNftSoldPerDay,
        message: "getWalletNftSoldPerDay listed successfully",
      };
    } catch (e) {
      throw e;
    }
  }

  @Get("/wallet-total-revenue")
  public async getWalletTotalRevenue(
    @Query() walletAddress: string,
    @Query() from?: string,
    @Query() to?: string
  ): Promise<IDGResponse<IWalletTotalRevenue>> {
    try {
      const { fromDate, toDate } = getAnalyticsDate(from, to);
      validateAnalyticsDate(fromDate, toDate);
      if (!isAddress(walletAddress)) {
        const fields: FieldErrors = {
          walletAddress: {
            message: "Invalid address",
            value: walletAddress,
          },
        };
        throw new ValidateError(fields, "Error with walletAddress params");
      }
      const walletTotalRevenue = await analyticsService.getWalletTotalRevenue({
        from: fromDate,
        to: toDate,
        walletAddress,
      });
      return {
        status: 200,
        data: walletTotalRevenue,
        message: "walletTotalRevenue listed successfully",
      };
    } catch (e) {
      throw e;
    }
  }

  @Get("/wallet-total-nft-sold")
  public async getWalletTotalNftSold(
    @Query() walletAddress: string,
    @Query() from?: string,
    @Query() to?: string
  ): Promise<IDGResponse<IWalletTotalNftSold>> {
    try {
      const { fromDate, toDate } = getAnalyticsDate(from, to);
      validateAnalyticsDate(fromDate, toDate);
      if (!isAddress(walletAddress)) {
        const fields: FieldErrors = {
          walletAddress: {
            message: "Invalid address",
            value: walletAddress,
          },
        };
        throw new ValidateError(fields, "Error with walletAddress params");
      }
      const walletTotalNftSold = await analyticsService.getWalletTotalNftSold({
        from: fromDate,
        to: toDate,
        walletAddress,
      });
      return {
        status: 200,
        data: walletTotalNftSold,
        message: "getWalletTotalNftSold listed successfully",
      };
    } catch (e) {
      throw e;
    }
  }

  @Get("/wallet-nft-sold-ranking")
  public async getWalletNftSoldRanking(
    @Query() walletAddress: string,
    @Query() from?: string,
    @Query() to?: string
  ): Promise<IDGResponse<IWalletNftSoldRanking[]>> {
    try {
      const { fromDate, toDate } = getAnalyticsDate(from, to);
      validateAnalyticsDate(fromDate, toDate);
      if (!isAddress(walletAddress)) {
        const fields: FieldErrors = {
          walletAddress: {
            message: "Invalid address",
            value: walletAddress,
          },
        };
        throw new ValidateError(fields, "Error with walletAddress params");
      }
      const walletNftSoldRanking =
        await analyticsService.getWalletNftSoldRanking({
          from: fromDate,
          to: toDate,
          walletAddress,
        });
      return {
        status: 200,
        data: walletNftSoldRanking,
        message: "getWalletNftSoldRanking listed successfully",
      };
    } catch (e) {
      throw e;
    }
  }

  @Get("/wallet-recent-sales")
  public async getWalletRecentSales(
    @Query() walletAddress: string,
    @Query() from?: string,
    @Query() to?: string
  ): Promise<IDGResponse<IWalletRecentSales[]>> {
    try {
      const { fromDate, toDate } = getAnalyticsDate(from, to);
      validateAnalyticsDate(fromDate, toDate);
      if (!isAddress(walletAddress)) {
        const fields: FieldErrors = {
          walletAddress: {
            message: "Invalid address",
            value: walletAddress,
          },
        };
        throw new ValidateError(fields, "Error with walletAddress params");
      }
      const walletRecentSales = await analyticsService.getWalletRecentSales({
        from: fromDate,
        to: toDate,
        walletAddress,
      });
      return {
        status: 200,
        data: walletRecentSales,
        message: "getWalletRecentSales listed successfully",
      };
    } catch (e) {
      throw e;
    }
  }
  // getMarketplaceSalesPerDay
  @Get("/marketplace-sales-per-day")
  public async getMarketplaceSalesPerDay(
    @Query() from?: string,
    @Query() to?: string
  ): Promise<IDGResponse<IMarketplaceSalesPerDay[]>> {
    const { fromDate, toDate } = getAnalyticsDate(from, to);
    try {
      validateAnalyticsDate(fromDate, toDate);
      const marketplaceSalesPerDay =
        await analyticsService.getMarketplaceSalesPerDay({
          from: fromDate,
          to: toDate,
        });
      return {
        status: 200,
        data: marketplaceSalesPerDay,
        message: "getMarketplaceSalesPerDay listed successfully",
      };
    } catch (e) {
      throw e;
    }
  }
  // getMarketplaceNftSoldPerDay
  @Get("/marketplace-nft-sold-per-day")
  public async getMarketplaceNftSoldPerDay(
    @Query() from?: string,
    @Query() to?: string
  ): Promise<IDGResponse<IMarketplaceNftSoldPerDay[]>> {
    const { fromDate, toDate } = getAnalyticsDate(from, to);
    try {
      validateAnalyticsDate(fromDate, toDate);
      const marketplaceNftSoldPerDay =
        await analyticsService.getMarketplaceNftSoldPerDay({
          from: fromDate,
          to: toDate,
        });
      return {
        status: 200,
        data: marketplaceNftSoldPerDay,
        message: "getMarketplaceNftSoldPerDay listed successfully",
      };
    } catch (e) {
      throw e;
    }
  }
  // getMarketplaceTotalSales
  @Get("/marketplace-total-sales")
  public async getMarketplaceTotalSales(
    @Query() from?: string,
    @Query() to?: string
  ): Promise<IDGResponse<IMarketplaceTotalSales>> {
    const { fromDate, toDate } = getAnalyticsDate(from, to);
    try {
      validateAnalyticsDate(fromDate, toDate);
      const marketplaceTotalSales =
        await analyticsService.getMarketplaceTotalSales({
          from: fromDate,
          to: toDate,
        });
      return {
        status: 200,
        data: marketplaceTotalSales,
        message: "getMarketplaceTotalSales listed successfully",
      };
    } catch (e) {
      throw e;
    }
  }
  // getMarketplaceTotalNftSold
  @Get("/marketplace-total-nft-sold")
  public async getMarketplaceTotalNftSold(
    @Query() from?: string,
    @Query() to?: string
  ): Promise<IDGResponse<IMarketplaceTotalNftSold>> {
    const { fromDate, toDate } = getAnalyticsDate(from, to);
    try {
      validateAnalyticsDate(fromDate, toDate);
      const marketplaceTotalNftSold =
        await analyticsService.getMarketplaceTotalNftSold({
          from: fromDate,
          to: toDate,
        });
      return {
        status: 200,
        data: marketplaceTotalNftSold,
        message: "getMarketplaceTotalNftSold listed successfully",
      };
    } catch (e) {
      throw e;
    }
  }
  // getMarketplaceNftSoldRanking
  @Get("/marketplace-nft-sold-ranking")
  public async getMarketplaceNftSoldRanking(
    @Query() from?: string,
    @Query() to?: string
  ): Promise<IDGResponse<IMarketplaceNftSoldRanking[]>> {
    const { fromDate, toDate } = getAnalyticsDate(from, to);
    try {
      const marketplaceNftSoldRanking =
        await analyticsService.getMarketplaceNftSoldRanking({
          from: fromDate,
          to: toDate,
        });
      return {
        status: 200,
        data: marketplaceNftSoldRanking,
        message: "getMarketplaceNftSoldRanking listed successfully",
      };
    } catch (e) {
      throw e;
    }
  }
  // getMarketplaceRecentSales
  @Get("/marketplace-recent-sales")
  public async getMarketplaceRecentSales(
    @Query() from?: string,
    @Query() to?: string
  ): Promise<IDGResponse<IMarketplaceRecentSales[]>> {
    const { fromDate, toDate } = getAnalyticsDate(from, to);
    try {
      validateAnalyticsDate(fromDate, toDate);
      const marketplaceRecentSales =
        await analyticsService.getMarketplaceRecentSales({
          from: fromDate,
          to: toDate,
        });
      return {
        status: 200,
        data: marketplaceRecentSales,
        message: "getMarketplaceRecentSales listed successfully",
      };
    } catch (e) {
      throw e;
    }
  }
  // getMarketplaceGeneralActivity
  @Get("/marketplace-general-activity")
  public async getMarketplaceGeneralActivity(
    @Query() from?: string,
    @Query() to?: string
  ): Promise<IDGResponse<IMarketplaceGeneralActivity[]>> {
    const { fromDate, toDate } = getAnalyticsDate(from, to);
    try {
      validateAnalyticsDate(fromDate, toDate);
      const marketplaceGeneralActivity =
        await analyticsService.getMarketplaceGeneralActivity({
          from: fromDate,
          to: toDate,
        });
      return {
        status: 200,
        data: marketplaceGeneralActivity,
        message: "getMarketplaceGeneralActivity listed successfully",
      };
    } catch (e) {
      throw e;
    }
  }
  // getTokenActivity
  @Get("/token-activity")
  public async getTokenActivity(
    @Query() nftAddress: string,
    @Query() tokenId: string
  ): Promise<IDGResponse<ITokenActivity[]>> {
    try {
      if (!isAddress(nftAddress)) {
        const fields: FieldErrors = {
          walletAddress: {
            message: "Invalid nftAddress",
            value: nftAddress,
          },
        };
        throw new ValidateError(fields, "Error with nftAddress params");
      }
      const tokenActivity = await analyticsService.getTokenActivity({
        nftAddress,
        tokenId,
      });
      return {
        status: 200,
        data: tokenActivity,
        message: "getTokenActivity listed successfully",
      };
    } catch (e) {
      throw e;
    }
  }
  // getNftCollectionTradedVolume
  @Get("/nft-collection-traded-volume")
  public async getNftCollectionTradedVolume(
    @Query() nftAddress: string
  ): Promise<IDGResponse<ITradeVolume>> {
    try {
      if (!isAddress(nftAddress)) {
        const fields: FieldErrors = {
          walletAddress: {
            message: "Invalid nftAddress",
            value: nftAddress,
          },
        };
        throw new ValidateError(fields, "Error with nftAddress params");
      }
      const nftCollectionTradedVolume =
        await analyticsService.getNftCollectionTradedVolume({
          nftAddress,
        });
      return {
        status: 200,
        data: nftCollectionTradedVolume,
        message: "getNftCollectionTradedVolume listed successfully",
      };
    } catch (e) {
      throw e;
    }
  }
  // getWalletRecentActivity
  @Get("/wallet-recent-activity")
  public async getWalletRecentActivity(
    @Query() sellerAddress: string
  ): Promise<IDGResponse<IRecentActivity[]>> {
    try {
      if (!isAddress(sellerAddress)) {
        const fields: FieldErrors = {
          walletAddress: {
            message: "Invalid sellerAddress",
            value: sellerAddress,
          },
        };
        throw new ValidateError(fields, "Error with sellerAddress params");
      }
      const walletRecentActivity =
        await analyticsService.getWalletRecentActivity({
          sellerAddress,
        });
      return {
        status: 200,
        data: walletRecentActivity,
        message: "getWalletRecentActivity listed successfully",
      };
    } catch (e) {
      throw e;
    }
  }
}
