import { BadRequestException } from '@nestjs/common';

export function requireEntityId(raw: string | undefined): string {
  const id = raw?.trim();
  if (!id) {
    throw new BadRequestException('X-Entity-Id header is required');
  }
  return id;
}
