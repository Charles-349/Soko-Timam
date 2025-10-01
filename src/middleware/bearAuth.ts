import Jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import "dotenv/config";


export const checkRoles = (allowedRoles: ("admin" | "vendor" | "customer")[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "Unauthorized: No token provided" });
      return;
    }

    const token = authHeader.split(" ")[1];

    try {
      const decoded = Jwt.verify(token, process.env.JWT_SECRET_KEY as string);

      (req as any).user = decoded;

      if (typeof decoded === "object" && decoded !== null && "role" in decoded) {
        const role = decoded.role;

        if (allowedRoles.includes(role)) {
          next();
          return;
        }

        res.status(403).json({ message: "unauthorized" });
      } else {
        res.status(401).json({ message: "Invalid token payload" });
      }
    } catch (error) {
      res.status(401).json({ message: "Invalid or expired token" });
    }
  };
};

export const adminRoleAuth = checkRoles(["admin"]);
export const vendorRoleAuth = checkRoles(["vendor"]);
export const customerRoleAuth = checkRoles(["customer"]);


