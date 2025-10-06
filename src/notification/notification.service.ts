import { eq, sql } from "drizzle-orm";
import db from "../Drizzle/db";
import { TINotification, notifications, users } from "../Drizzle/schema";

// Create Notification
export const createNotificationService = async (notification: TINotification) => {
  await db.insert(notifications).values(notification);
  return "Notification created successfully";
};

// Get all Notifications
export const getNotificationsService = async () => {
  return await db.query.notifications.findMany({
    with: { user: true },
  });
};

// Get Notification by ID
export const getNotificationByIdService = async (id: number) => {
  return await db.query.notifications.findFirst({
    where: eq(notifications.id, id),
    with: { user: true },
  });
};

// Get Notifications by User ID
export const getNotificationsByUserService = async (userId: number) => {
  return await db.query.notifications.findMany({
    where: eq(notifications.userId, userId),
    with: { user: true },
  });
};

// Get Unread Notifications for User
export const getUnreadNotificationsService = async (userId: number) => {
  return await db.query.notifications.findMany({
    where: sql`${notifications.userId} = ${userId} AND ${notifications.isRead} = false`,
  });
};

// Mark Notification as Read
export const markNotificationAsReadService = async (id: number) => {
  const updated = await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.id, id))
    .returning();

  if (updated.length === 0) return null;
  return "Notification marked as read";
};

// Mark All Notifications as Read for User
export const markAllNotificationsAsReadService = async (userId: number) => {
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.userId, userId));

  return "All notifications marked as read";
};

// Update Notification
export const updateNotificationService = async (
  id: number,
  notification: Partial<TINotification>
) => {
  const updated = await db
    .update(notifications)
    .set(notification)
    .where(eq(notifications.id, id))
    .returning();

  if (updated.length === 0) return null;
  return "Notification updated successfully";
};

// Delete Notification
export const deleteNotificationService = async (id: number) => {
  const deleted = await db.delete(notifications).where(eq(notifications.id, id)).returning();

  if (deleted.length === 0) return null;
  return "Notification deleted successfully";
};

// Delete All Notifications for User
export const deleteAllUserNotificationsService = async (userId: number) => {
  await db.delete(notifications).where(eq(notifications.userId, userId));
  return "All user notifications deleted successfully";
};

// Notification with User
export const getNotificationWithUserService = async (id: number) => {
  return await db.query.notifications.findFirst({
    where: eq(notifications.id, id),
    with: { user: true },
  });
};

// User with Notifications
export const getUserWithNotificationsService = async (id: number) => {
  return await db.query.users.findFirst({
    where: eq(users.id, id),
    with: { notifications: true },
  });
};
