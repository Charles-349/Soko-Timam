import { eq, sql, and } from "drizzle-orm";
import db from "../Drizzle/db";
import { coupons, TICoupon } from "../Drizzle/schema";

// Create Coupon
export const createCouponService = async (coupon: TICoupon) => {
  // Check for existing coupon with the same code
  const existing = await db.query.coupons.findFirst({
    where: eq(coupons.code, coupon.code),
  });
  if (existing) {
    throw new Error("Coupon code already exists");
  }

  await db.insert(coupons).values(coupon);
  return "Coupon created successfully";
};

// Get all Coupons
export const getCouponsService = async () => {
  return await db.query.coupons.findMany({
    orderBy: (coupons, { desc }) => [desc(coupons.createdAt)],
  });
};

// Get Coupon by ID
export const getCouponByIdService = async (id: number) => {
  return await db.query.coupons.findFirst({
    where: eq(coupons.id, id),
  });
};

// Get Coupon by Code
export const getCouponByCodeService = async (code: string) => {
  return await db.query.coupons.findFirst({
    where: eq(coupons.code, code),
  });
};

// Update Coupon
export const updateCouponService = async (
  id: number,
  coupon: Partial<TICoupon>
) => {
  const updatedCoupon = await db
    .update(coupons)
    .set({ ...coupon, updatedAt: new Date() })
    .where(eq(coupons.id, id))
    .returning();

  if (updatedCoupon.length === 0) {
    return null;
  }

  return updatedCoupon[0];
};

// Delete Coupon
export const deleteCouponService = async (id: number) => {
  const deletedCoupon = await db
    .delete(coupons)
    .where(eq(coupons.id, id))
    .returning();

  if (deletedCoupon.length === 0) {
    return null;
  }

  return deletedCoupon[0];
};

// Get Active (Valid) Coupons — not expired
export const getActiveCouponsService = async () => {
  return await db.query.coupons.findMany({
    where: sql`${coupons.expiryDate} > NOW() AND ${coupons.isActive} = true`,
    orderBy: (coupons, { asc }) => [asc(coupons.expiryDate)],
  });
};

// Get Expired Coupons
export const getExpiredCouponsService = async () => {
  return await db.query.coupons.findMany({
    where: sql`${coupons.expiryDate} <= NOW()`,
    orderBy: (coupons, { desc }) => [desc(coupons.expiryDate)],
  });
};

// Apply Coupon (calculates discount on total)
export const applyCouponService = async (code: string, total: number) => {
  const coupon = await getCouponByCodeService(code);
  if (!coupon) return null;

  // Check if coupon is active and not expired
  const now = new Date();
  if (!coupon.isActive || (coupon.expiryDate && now > new Date(coupon.expiryDate))) {
    return null;
  }

  // Apply discount
const discountAmount =
  coupon.discountType === "percentage"
    ? (total * (coupon.discountPercent ?? 0)) / 100
    : Number(coupon.discountAmount ?? 0);


  const newTotal = Math.max(total - discountAmount, 0);

  return {
    code: coupon.code,
    discount: discountAmount,
    newTotal,
  };
};
