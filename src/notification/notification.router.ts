import { adminRoleAuth } from "../middleware/bearAuth";
import {
  createNotificationController,
  getNotificationsController,
  getNotificationByIdController,
  getNotificationsByUserController,
  getUnreadNotificationsController,
  markNotificationAsReadController,
  markAllNotificationsAsReadController,
  updateNotificationController,
  deleteNotificationController,
  deleteAllUserNotificationsController,
  getNotificationWithUserController,
  getUserWithNotificationsController,
} from "./notification.controller";
import { Express } from "express";

const notification = (app: Express) => {
  // Create Notification
  app.route("/notification").post(async (req, res, next) => {
    try {
      await createNotificationController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Get All Notifications (Admin only)
  app.route("/notification").get(adminRoleAuth, async (req, res, next) => {
    try {
      await getNotificationsController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Get Notification by ID
  app.route("/notification/:id").get(async (req, res, next) => {
    try {
      await getNotificationByIdController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Get Notifications by User ID
  app.route("/notification/user/:userId").get(async (req, res, next) => {
    try {
      await getNotificationsByUserController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Get Unread Notifications for a User
  app.route("/notification/user/:userId/unread").get(async (req, res, next) => {
    try {
      await getUnreadNotificationsController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Mark Notification as Read
  app.route("/notification/:id/read").put(async (req, res, next) => {
    try {
      await markNotificationAsReadController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Mark All Notifications as Read (for a User)
  app.route("/notification/user/:userId/read-all").put(async (req, res, next) => {
    try {
      await markAllNotificationsAsReadController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Update Notification by ID
  app.route("/notification/:id").put(async (req, res, next) => {
    try {
      await updateNotificationController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Delete Notification by ID
  app.route("/notification/:id").delete(async (req, res, next) => {
    try {
      await deleteNotificationController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // Delete All Notifications for a User
  app.route("/notification/user/:userId").delete(async (req, res, next) => {
    try {
      await deleteAllUserNotificationsController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // JOINS: Notification with User
  app.route("/notification/:id/user").get(async (req, res, next) => {
    try {
      await getNotificationWithUserController(req, res);
    } catch (error) {
      next(error);
    }
  });

  // JOINS: User with Notifications
  app.route("/user/:id/notifications").get(async (req, res, next) => {
    try {
      await getUserWithNotificationsController(req, res);
    } catch (error) {
      next(error);
    }
  });
};

export default notification;
