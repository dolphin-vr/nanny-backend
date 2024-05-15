import { PrismaClient } from "@prisma/client";
import { Get, HeaderParam, JsonController, QueryParam, QueryParams } from "routing-controllers";
import { ApiError, ApiResponse } from "../../../helpers";

const prisma = new PrismaClient();

@JsonController("/nanny")
export default class FavoriteController {
  @Get()
  async getAllNannies(@HeaderParam("authorization") token: string, @QueryParams() page: number, limit: number) {
    try {
      const nannies = prisma.nanny.findMany({ skip: (page - 1) * limit, take: limit });
      const total = prisma.nanny.count();
      return new ApiResponse(true, { total, nannies });
    } catch (error) {
      return new ApiError(400, { code: "BAD_REQUEST", message: "Bad Request" });
    }
  }
}
