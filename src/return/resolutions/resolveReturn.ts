import { processReturn } from "../processors/returnProcessor";
import { exchangeResolution } from "./exchangeResolution";
import { refundResolution } from "./refundResolution";
import { storeCreditResolution } from "./storeCreditResolution";

//union type for resolution results
type ResolutionResult =
  | { type: "exchange"; data: ReturnType<typeof exchangeResolution> }
  | { type: "refund"; data: ReturnType<typeof refundResolution> }
  | { type: "store_credit"; data: ReturnType<typeof storeCreditResolution> };

export const resolveReturn = async (
  returnId: number
): Promise<ResolutionResult> => {
  return processReturn(returnId, async (returnRecord) => {
    switch (returnRecord.resolutionType) {
      case "exchange": {
        const data = await exchangeResolution(returnRecord);
        return { type: "exchange", data };
      }
      case "refund": {
        const data = await refundResolution(returnRecord);
        return { type: "refund", data };
      }
      case "store_credit": {
        const data = await storeCreditResolution(returnRecord);
        return { type: "store_credit", data };
      }
      default:
        throw new Error("Unsupported resolution type");
    }
  });
};