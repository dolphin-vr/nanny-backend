import { PrismaClient } from "@prisma/client";
import { User } from "@prisma/client";
import { SignupDto } from "../dto/Signup.dto";
import { hashPassword, random } from "../helpers";


const prisma = new PrismaClient();

const createUser = async (newUser: SignupDto): Promise<User> => {
  const salt = random();
  return await prisma.user.create({ data: { username: newUser.username, email: newUser.email, password: hashPassword(salt, newUser.password), salt } });
};

const findUserByEmail = async (email: string): Promise<User | null> => {
  return await prisma.user.findFirst({ where: { email } });
};

const findUserById = async (id: number|undefined): Promise<User | null> => {
  return await prisma.user.findFirst({ where: { id } });
};

const verifyEmail = async (email: string) => {
  return await prisma.user.update({ where: { email }, data: { verified: true } });
};

const changePasswd = async (id: number, password: string) => {
  const salt = random();
  return await prisma.user.update({ where: { id }, data: { password: hashPassword(salt, password), salt } });
};

const createSession = async (user_id: number, sessionToken: string) => {
  return await prisma.session.create({ data: { user_id, sessionToken } });
};

const findSession = async (user_id: number, sessionToken: string) => {
  return await prisma.session.findFirst({ where: { user_id, sessionToken } });
};

const deleteSessionByToken = async (sessionToken: string) => {
  return await prisma.session.delete({ where: { sessionToken } });
};

const deleteAllSessions = async (user_id: number) => {
  return await prisma.session.deleteMany({ where: { user_id } });
};

const getNanniesPage = async (page: number, limit: number) => {
  return await prisma.nanny.findMany({ skip: (page - 1) * limit, take: limit });
};

const getNanniesCount = async () => {
  return await prisma.nanny.count();
};

const getFavorites = async (user_id: number) => {
	return await prisma.favorite.findMany({ where: { user_id } });
}

const addToFavorites = async (user_id: number, nanny_id: number) => {
  return await prisma.favorite.create({ data: { user_id, nanny_id } });
};

const deleteFromFavorites = async (user_id: number, nanny_id: number) => {
  return await prisma.favorite.delete({ where: { user_id_nanny_id: { user_id, nanny_id } } });
};

export default {
  createUser,
  findUserByEmail,
  findUserById,
  verifyEmail,
  changePasswd,
  createSession,
  findSession,
  deleteSessionByToken,
  deleteAllSessions,
  getNanniesPage,
	getNanniesCount,
	getFavorites,
	addToFavorites,
	deleteFromFavorites,
};

// const session = await prisma.session.findFirst({ where: { sessionToken } });
// await prisma.session.delete({ where: { id: verificationToken.id } });
