export const processBulkReturns = async (
  returnIds: number[],
  processor: (id: number) => Promise<any>
) => {

  const results: Array<{ returnId: number; success: boolean; data?: any; error?: string }> = [];

  for (const id of returnIds) {
    try {
      const data = await processor(id);

      results.push({
        returnId: id,
        success: true,
        data
      });

    } catch (err: any) {
      results.push({
        returnId: id,
        success: false,
        error: err.message
      });
    }
  }

  return results;
};