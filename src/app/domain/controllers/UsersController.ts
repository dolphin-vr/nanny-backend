import { PrismaClient } from "@prisma/client";
import { ApiError } from "../../../helpers/ApiError";
import { ApiResponse } from "../../../helpers/ApiResponse";
import { Controller, Delete } from "routing-controllers";

const prisma = new PrismaClient();

@Controller("/users")
export default class UsersController {

  // FOR DEV ONLY!!! REMOVE IN PRODUCTION!!!!!
  @Delete("/delete")
  async deleteUsers() {
    try {
      const result = await prisma.user.deleteMany({});
      return new ApiResponse(true, "Successful deleted");
    } catch (error) {
      console.log(error);
      return new ApiError(400, { code: "BAD_REQ", message: "Deletion error" });
    }
  }

}
