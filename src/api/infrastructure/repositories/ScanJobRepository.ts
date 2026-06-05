import type {
  IScanJobRepository,
  ScanJobEntity,
  ScanJobQueryFilters,
  UpdateScanJobData,
} from '../../domain/entities';
import { prisma } from '../database/prisma';

export class ScanJobRepository implements IScanJobRepository {
  async findAll(filters: ScanJobQueryFilters): Promise<{ items: ScanJobEntity[]; total: number }> {
    const where = {
      ...(filters.status && { status: filters.status }),
    };

    const [items, total] = await Promise.all([
      prisma.scanJob.findMany({
        where,
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit,
        orderBy: { startedAt: 'desc' },
      }),
      prisma.scanJob.count({ where }),
    ]);

    return {
      items: items.map((j) => this.toDomain(j as Record<string, unknown>)),
      total,
    };
  }

  async findById(id: string): Promise<ScanJobEntity | null> {
    const job = await prisma.scanJob.findUnique({ where: { id } });
    return job ? this.toDomain(job as Record<string, unknown>) : null;
  }

  async create(data: { source: string }): Promise<ScanJobEntity> {
    const job = await prisma.scanJob.create({
      data: { source: data.source },
    });
    return this.toDomain(job as Record<string, unknown>);
  }

  async update(id: string, data: Partial<UpdateScanJobData>): Promise<ScanJobEntity> {
    const job = await prisma.scanJob.update({
      where: { id },
      data,
    });
    return this.toDomain(job as Record<string, unknown>);
  }

  private toDomain(raw: Record<string, unknown>): ScanJobEntity {
    return {
      id: raw.id as string,
      source: raw.source as string,
      status: raw.status as ScanJobEntity['status'],
      startedAt: raw.startedAt as Date,
      completedAt: raw.completedAt as Date | null,
      itemsFound: raw.itemsFound as number,
      imagesProcessed: raw.imagesProcessed as number,
      errors: raw.errors as unknown[],
      createdAt: raw.createdAt as Date,
    };
  }
}
