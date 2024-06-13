import "reflect-metadata";
import { PrismaClient } from "@prisma/client";
import { User } from "@prisma/client";
import { Authorized, CurrentUser, Delete, Get, JsonController, Param, Post } from "routing-controllers";
import { ApiError, ApiResponse } from "../../../helpers";
import { ACCESS_LIST } from "../../../config/accessList";
import dbServises from "../../../services/DBService";

const prisma = new PrismaClient();

@JsonController("/favorites")
@Authorized(ACCESS_LIST.allusers)
export default class FavoriteController {
  @Get()
  async getAllFavorites(@CurrentUser({ required: true }) user: User) {
    try {
      const favorites = await dbServises.getFavorites(user.id);
      return new ApiResponse(true, { favorites });
    } catch (error) {
      throw new ApiError(400, { code: "BAD_REQUEST", message: "Bad Request" });
    }
  }

  @Post("/:nanny")
  async addFavorite(@CurrentUser({ required: true }) user: User, @Param("nanny") nanny: number) {
    try {
      // console.log("ctrl 1");
      const favorite = await dbServises.addToFavorites(user.id, nanny);
      return new ApiResponse(true, { favorite });
    } catch (error) {
      throw new ApiError(400, { code: "BAD_REQUEST", message: "Bad Request" });
    }
  }

  // @Delete("/:nanny")
  // async deleteFavorite(@CurrentUser({ required: true }) user: User, @Param("nanny") nanny: number) {
  //   try {
  //     // console.log("ctrl 1");
  //     const favorite = await dbServises.deleteFromFavorites(user.id, nanny);
  //     return new ApiResponse(true, { favorite });
  //   } catch (error) {
  //     throw new ApiError(400, { code: "BAD_REQUEST", message: "Bad Request" });
  //   }
  // }
}
