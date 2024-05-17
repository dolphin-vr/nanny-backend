import "reflect-metadata";
import { PrismaClient } from "@prisma/client";
import { Authorized, BadRequestError, Get, JsonController } from "routing-controllers";
import { ApiError, ApiResponse } from "../../../helpers";
// import { Authentication } from "app/middlewares/Authentication";
// import { Authorization } from "app/middlewares/AuthChecker";
import { ACCESS_LIST } from "config/accessList";

const prisma = new PrismaClient();

@JsonController("/favorites")
@Authorized(ACCESS_LIST.all)
export default class FavoriteController {
  @Get()
  async getAllFavorites() {
    try {
      console.log("ctrl 1");
      const nannies = prisma.nanny.findMany({ take: 10 });
      const total = await prisma.nanny.count();
      return new ApiResponse(true, { total, nannies });
      // return new ApiResponse(true, { nannies });
    } catch (error) {
      console.log("ctrl error 1");
      throw new BadRequestError("OOPS!"); // ApiError(400, { code: "BAD_REQUEST", message: "Bad Request" });
    }
  }
}
