import "reflect-metadata";
import { PrismaClient } from "@prisma/client";
import { Authorized, BadRequestError, Get, JsonController, QueryParams } from "routing-controllers";
import { ApiError, ApiResponse } from "../../../helpers";
import { IPagination } from "types/rest";
import { ACCESS_LIST } from "config/accessList";
import { DBService } from "../../../services";

const prisma = new PrismaClient();

@JsonController("/nanny")
export default class NannyController {
  @Get()
  async getAllNannies(@QueryParams() query: IPagination) {
    try {
      const page = !query.page || !parseInt(query.page) || parseInt(query.page) < 1 ? 1 : parseInt(query.page);
      const limit = !query.limit || !parseInt(query.limit) || parseInt(query.limit) < 1 ? 10 : parseInt(query.limit);
      const nannies = await DBService.getNanniesPage((page - 1) * limit, limit);
      const total = await DBService.getNanniesCount();
      return new ApiResponse(true, { total, nannies });
    } catch (error) {
      throw new BadRequestError("BAD_REQUEST!"); // ApiError(400, { code: "BAD_REQUEST", message: "Bad Request" });
    }
  }
}
