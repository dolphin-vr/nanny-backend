import "reflect-metadata";
import { PrismaClient } from "@prisma/client";
import { Authorized, BadRequestError, Get, JsonController, QueryParams } from "routing-controllers";
import { ApiError, ApiResponse } from "../../../helpers";
import { IPagination } from "types/rest";
import { ACCESS_LIST } from "config/accessList";

const prisma = new PrismaClient();

@JsonController("/nanny")
// @Authorized(ACCESS_LIST.managers)
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
      throw new BadRequestError("OOPS!"); // ApiError(400, { code: "BAD_REQUEST", message: "Bad Request" });
    }
  }
}
