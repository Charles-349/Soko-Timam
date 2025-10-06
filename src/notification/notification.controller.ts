import { Request, Response } from "express";
import {
  createNotificationService,
  getNotificationsService,
  getNotificationByIdService,
  getNotificationsByUserService,
  getUnreadNotificationsService,
  markNotificationAsReadService,
  markAllNotificationsAsReadService,
  updateNotificationService,
  deleteNotificationService,
  deleteAllUserNotificationsService,
  getNotificationWithUserService,
  getUserWithNotificationsService,
} from "./notification.service";

// Create Notification
export const createNotificationController = async (req: Request, res: Response) => {
  try {
    const notification = req.body;
    await createNotificationService(notification);
    return res.status(201).json({ message: "Notification created successfully" });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Get All Notifications
export const getNotificationsController = async (req: Request, res: Response) => {
  try {
    const notifications = await getNotificationsService();
    return res.status(200).json({
      message: "Notifications retrieved successfully",
      data: notifications,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Get Notification by ID
export const getNotificationByIdController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const notification = await getNotificationByIdService(id);
    if (!notification)
      return res.status(404).json({ message: "Notification not found" });

    return res.status(200).json({
      message: "Notification retrieved successfully",
      data: notification,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Get Notifications by User ID
export const getNotificationsByUserController = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const notifications = await getNotificationsByUserService(userId);
    return res.status(200).json({
      message: "User notifications retrieved successfully",
      data: notifications,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Get Unread Notifications by User
export const getUnreadNotificationsController = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const unread = await getUnreadNotificationsService(userId);
    return res.status(200).json({
      message: "Unread notifications retrieved successfully",
      data: unread,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Mark Notification as Read
export const markNotificationAsReadController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const updated = await markNotificationAsReadService(id);
    if (!updated)
      return res.status(404).json({ message: "Notification not found" });

    return res.status(200).json({ message: "Notification marked as read" });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Mark All Notifications as Read (for User)
export const markAllNotificationsAsReadController = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    await markAllNotificationsAsReadService(userId);
    return res
      .status(200)
      .json({ message: "All notifications marked as read successfully" });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Update Notification
export const updateNotificationController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const updated = await updateNotificationService(id, req.body);
    if (!updated)
      return res.status(404).json({ message: "Notification not found" });

    return res.status(200).json({ message: "Notification updated successfully" });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Delete Notification
export const deleteNotificationController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const deleted = await deleteNotificationService(id);
    if (!deleted)
      return res.status(404).json({ message: "Notification not found" });

    return res.status(200).json({ message: "Notification deleted successfully" });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Delete All Notifications for a User
export const deleteAllUserNotificationsController = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    await deleteAllUserNotificationsService(userId);
    return res
      .status(200)
      .json({ message: "All notifications deleted for the user successfully" });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Get Notification with User Details
export const getNotificationWithUserController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const notification = await getNotificationWithUserService(id);
    if (!notification)
      return res.status(404).json({ message: "Notification not found" });

    return res.status(200).json({
      message: "Notification with user retrieved successfully",
      data: notification,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

// Get User with Notifications
export const getUserWithNotificationsController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const userNotifications = await getUserWithNotificationsService(id);
    return res.status(200).json({
      message: "User with notifications retrieved successfully",
      data: userNotifications,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};
