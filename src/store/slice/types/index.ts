export type CustomError = {
  error?: {
    status?: number | string;
    data?: {
      message?: string;
      // Present on routes behind `validateBody` (backend/src/middleware/validate.js):
      // the specific, user-safe per-field messages behind the generic `message`.
      errors?: string[];
    };
  };
};
export * from "./auth.types";
export * from "./setting.types";
