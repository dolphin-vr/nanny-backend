import { IsPositive } from "class-validator";

export interface IPagination {
	page: string;
	limit: string;
}