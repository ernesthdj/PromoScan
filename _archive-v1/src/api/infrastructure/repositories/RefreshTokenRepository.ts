import type { IRefreshTokenRepository, RefreshTokenEntity } from '../../domain/entities';
import { prisma } from '../database/prisma';

export class RefreshTokenRepository implements IRefreshTokenRepository {
  async create(data: { userId: string; tokenHash: string; expiresAt: Date }): Promise<void> {
    await prisma.refreshToken.create({
      data: {
        userId: data.userId,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
      },
    });
  }

  async findByHash(tokenHash: string): Promise<RefreshTokenEntity | null> {
    const token = await prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
    return token ? this.toDomain(token) : null;
  }

  async deleteByHash(tokenHash: string): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: { tokenHash },
    });
  }

  async deleteAllForUser(userId: string): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  private toDomain(raw: Record<string, unknown>): RefreshTokenEntity {
    return {
      id: raw.id as string,
      userId: raw.userId as string,
      tokenHash: raw.tokenHash as string,
      expiresAt: raw.expiresAt as Date,
      createdAt: raw.createdAt as Date,
    };
  }
}
