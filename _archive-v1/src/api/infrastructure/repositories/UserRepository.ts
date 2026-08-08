import type {
  CreateUserData,
  IUserRepository,
  UpdateUserData,
  UserEntity,
} from '../../domain/entities';
import { prisma } from '../database/prisma';

export class UserRepository implements IUserRepository {
  async findById(id: string): Promise<UserEntity | null> {
    const user = await prisma.user.findUnique({ where: { id } });
    return user ? this.toDomain(user) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await prisma.user.findUnique({ where: { email } });
    return user ? this.toDomain(user) : null;
  }

  async create(data: CreateUserData): Promise<UserEntity> {
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        zoneCodePostal: data.zoneCodePostal ?? null,
        zoneCommune: data.zoneCommune ?? null,
        zoneLatitude: data.zoneLatitude ?? null,
        zoneLongitude: data.zoneLongitude ?? null,
        rgpdConsent: data.rgpdConsent,
        preferences: { w1: 0.5, w2: 0.3, w3: 0.2 },
      },
    });
    return this.toDomain(user);
  }

  async update(id: string, data: Partial<UpdateUserData>): Promise<UserEntity> {
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(data.email !== undefined && { email: data.email }),
        ...(data.passwordHash !== undefined && { passwordHash: data.passwordHash }),
        ...(data.zoneCodePostal !== undefined && { zoneCodePostal: data.zoneCodePostal }),
        ...(data.zoneCommune !== undefined && { zoneCommune: data.zoneCommune }),
        ...(data.zoneLatitude !== undefined && { zoneLatitude: data.zoneLatitude }),
        ...(data.zoneLongitude !== undefined && { zoneLongitude: data.zoneLongitude }),
        ...(data.preferences !== undefined && { preferences: data.preferences }),
      },
    });
    return this.toDomain(user);
  }

  async delete(id: string): Promise<void> {
    await prisma.user.delete({ where: { id } });
  }

  private toDomain(raw: Record<string, unknown>): UserEntity {
    return {
      id: raw.id as string,
      email: raw.email as string,
      passwordHash: raw.passwordHash as string,
      role: raw.role as UserEntity['role'],
      zoneCodePostal: raw.zoneCodePostal as string | null,
      zoneCommune: raw.zoneCommune as string | null,
      zoneLatitude: raw.zoneLatitude as number | null,
      zoneLongitude: raw.zoneLongitude as number | null,
      preferences: raw.preferences as UserEntity['preferences'],
      rgpdConsent: raw.rgpdConsent as boolean,
      createdAt: raw.createdAt as Date,
      updatedAt: raw.updatedAt as Date,
    };
  }
}
