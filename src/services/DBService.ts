import { PrismaClient } from "@prisma/client";
import { User } from "@prisma/client";
import { SignupDto } from "../dto/Signup.dto";
import { hashPassword, random } from "../helpers";

const prisma = new PrismaClient();

// export default
class DBService {
  async createUser(newUser: SignupDto): Promise<User> {
    const salt = random();
    return await prisma.user.create({ data: { username: newUser.username, email: newUser.email, password: hashPassword(salt, newUser.password), salt } });
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return await prisma.user.findFirst({ where: { email } });
  }

  async findUserById(id: number | undefined): Promise<User | null> {
    return await prisma.user.findFirst({ where: { id } });
  }

  async verifyEmail(email: string) {
    return await prisma.user.update({ where: { email }, data: { verified: true } });
  }

  async changePasswd(id: number, password: string) {
    const salt = random();
    return await prisma.user.update({ where: { id }, data: { password: hashPassword(salt, password), salt } });
  }

  async createSession(user_id: number, sessionToken: string) {
    return await prisma.session.create({ data: { user_id, sessionToken } });
  }

  async findSession(user_id: number, sessionToken: string) {
    return await prisma.session.findFirst({ where: { user_id, sessionToken } });
  }

  async findSessionByToken(sessionToken: string) {
    return await prisma.session.findFirst({ where: { sessionToken } });
  }

  async deleteSessionByToken(sessionToken: string) {
    return await prisma.session.delete({ where: { sessionToken } });
  }

  async deleteAllSessions(user_id: number) {
    return await prisma.session.deleteMany({ where: { user_id } });
  }

  async getNanniesPage(page: number, limit: number) {
    return await prisma.nanny.findMany({ skip: (page - 1) * limit, take: limit });
  }

  async getNanniesCount() {
    return await prisma.nanny.count();
  }

  async getFavorites(user_id: number) {
    return await prisma.favorite.findMany({ where: { user_id } });
  }

  async addToFavorites(user_id: number, nanny_id: number) {
    return await prisma.favorite.create({ data: { user_id, nanny_id } });
  }

  async deleteFromFavorites(user_id: number, nanny_id: number) {
    return await prisma.favorite.delete({ where: { favoriteId: { user_id, nanny_id } } });
  }
}

// const session = await prisma.session.findFirst({ where: { sessionToken } });
// await prisma.session.delete({ where: { id: verificationToken.id } });

export default new DBService();
