import { PrismaClient } from "@prisma/client";
import { Get, JsonController, QueryParams } from "routing-controllers";
import { ApiError, ApiResponse } from "../../../helpers";
import { IPagination } from "types/rest";

const prisma = new PrismaClient();

@JsonController("/nanny")
export default class NannyController {
  @Get()
  async getAllNannies(@QueryParams() query: IPagination) {
    try {
      const page = !query.page || !parseInt(query.page) || parseInt(query.page) < 1 ? 1 : parseInt(query.page);
      const limit = !query.limit || !parseInt(query.limit) || parseInt(query.limit) < 1 ? 10 : parseInt(query.limit);
			const nannies = await prisma.nanny.findMany({ skip: (page - 1) * limit, take: limit });
      const total = await prisma.nanny.count();
      return new ApiResponse(true, { total, nannies });
    } catch (error) {
      return new ApiError(400, { code: "BAD_REQUEST", message: "Bad Request" });
    }
  }
}
