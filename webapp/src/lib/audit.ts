import type { AuditAction } from "@prisma/client";
import { db } from "@/lib/db";

export async function writeAudit(input: {
  actorUserId: number;
  action: AuditAction;
  entity: string;
  entityId: string;
  detail: string;
}) {
  await db.auditLog.create({
    data: {
      actorUserId: input.actorUserId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      detail: input.detail,
    },
  });
}
