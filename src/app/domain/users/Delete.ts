import { PrismaClient } from "@prisma/client";
import { ApiError } from "helpers/ApiError";
import { ApiResponse } from "helpers/ApiResponse";
import { Controller, Delete } from "routing-controllers";

const prisma = new PrismaClient();

@Controller("/users/delete")
export default class UsersDelete{
	@Delete()
	async deleteUsers() {
		try {
			const result = await prisma.user.deleteMany({});
			// console.log("del= ", result)
			return new ApiResponse(true, "Successful deleted")
		} catch (error) {
			console.log(error)
			return new ApiError(400, {code:"BAD_REQ", message:"Deletion error"})
		}
	}
}