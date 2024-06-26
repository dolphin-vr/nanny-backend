import { DBService,  } from ".";
import { ApiError,  } from "../helpers";
import { HttpError } from "routing-controllers";

class NannyService {
  async getNannies(page: number, limit: number) {
    try {
      const nannies = await DBService.getNanniesPage((page - 1) * limit, limit);
      const total = await DBService.getNanniesCount()
      return ({nannies, total});
    } catch (error) {
        throw new HttpError(500, "INTERNAL_SERVER_ERROR");
    }
  }

}

export default new NannyService();
