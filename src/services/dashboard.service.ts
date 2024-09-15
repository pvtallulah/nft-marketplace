import dotenv from "dotenv";
import { AppDataSource } from "../db/data-source";
import { DashboardQueue } from "../db/entity";
import {
  IJoystickSlotData,
  IJoystickBannerData,
  IWSNotifyMarketplace,
} from "../interfaces";
import { dashboardApi } from "../dg-api/dg-api";
import { DeleteResult } from "typeorm";
dotenv.config();

const { DG_DASHBOARD_API_KEY } = process.env;

const dashboardQueueRepository = AppDataSource.getRepository(DashboardQueue);

export const notifyToDashboardSlotData = async ({
  payload,
  slotId,
}: {
  payload: IJoystickSlotData;
  slotId: string;
}): Promise<any> => {
  try {
    const { key } = payload;
    delete payload.key;
    const res = await dashboardApi.post(`/updateSlot/${slotId}/${key}`, {
      pos_x: payload.posX,
      pos_y: payload.posY,
      pos_z: payload.posZ,
      rot_x: payload.rotX,
      rot_y: payload.rotY,
      rot_z: payload.rotZ,
      size_x: payload.scaleX,
      size_y: payload.scaleY,
      size_z: payload.scaleZ,
    });
    return res;
  } catch (err) {
    throw err;
  }
};

export const notifyToDashboardBannerData = async ({
  payload,
  bannerId,
}: {
  payload: IJoystickBannerData;
  bannerId: string;
}): Promise<any> => {
  try {
    const { key } = payload;
    delete payload.key;
    const res = await dashboardApi.post(
      `/updateMediaResourcePosition/${bannerId}/${key}`,
      {
        pos_x: payload.posX,
        pos_y: payload.posY,
        pos_z: payload.posZ,
        rot_x: payload.rotX,
        rot_y: payload.rotY,
        rot_z: payload.rotZ,
        size_x: payload.scaleX,
        size_y: payload.scaleY,
        size_z: payload.scaleZ,
      }
    );
    return res.data;
  } catch (err) {
    throw err;
  }
};

export const getNotificationsIntent = async (): Promise<DashboardQueue[]> => {
  try {
    const failedItems = await dashboardQueueRepository.find();
    return failedItems;
  } catch (err) {
    throw err;
  }
};

export const saveNotificationIntent = async (
  payload: IWSNotifyMarketplace
): Promise<DashboardQueue> => {
  try {
    const dashboardQueue = new DashboardQueue();
    dashboardQueue.data = { ...payload };
    const savedItem = await dashboardQueueRepository.save(dashboardQueue);
    return savedItem;
  } catch (err) {
    throw err;
  }
};

export const deleteNotificationIntent = async (
  id: number
): Promise<DeleteResult> => {
  try {
    const deletedItem = await dashboardQueueRepository.delete(id);
    return deletedItem;
  } catch (err) {
    throw err;
  }
};
