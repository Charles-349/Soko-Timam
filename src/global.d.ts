import "express-serve-static-core";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role: "admin" | "vendor" | "customer";
        firstname?: string;
        lastname?: string;
      };
    }
  }
}
