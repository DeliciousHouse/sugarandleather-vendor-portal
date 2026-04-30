"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getRequiredAdmin } from "@/lib/auth";
import {
  promoteToPayable,
  createPayoutBatch,
  markBatchPaid,
  clawbackEvent,
  type PayoutDb,
  type ClawbackInput,
} from "@/domain/payouts/service";

export type PayoutActionState = { ok: true } | { ok: false; error: string };

// ---------------------------------------------------------------------------
// promoteToPayableAction
// ---------------------------------------------------------------------------

export async function promoteToPayableAction(): Promise<void> {
  const actor = await getRequiredAdmin();
  await promoteToPayable({}, {
    db: prisma as unknown as PayoutDb,
    actor,
  });
  redirect("/admin/payouts");
}

// ---------------------------------------------------------------------------
// createPayoutBatchAction
// ---------------------------------------------------------------------------

export async function createPayoutBatchAction(formData: FormData): Promise<void> {
  const actor = await getRequiredAdmin();
  const raw = formData.get("eventIds");
  const eventIds: string[] = raw ? (JSON.parse(raw as string) as string[]) : [];

  const batch = await createPayoutBatch(
    { eventIds },
    { db: prisma as unknown as PayoutDb, actor }
  );
  redirect(`/admin/payouts/${batch.id}`);
}

// ---------------------------------------------------------------------------
// markBatchPaidAction
// ---------------------------------------------------------------------------

export async function markBatchPaidAction(batchId: string): Promise<PayoutActionState> {
  const actor = await getRequiredAdmin();
  try {
    await markBatchPaid(batchId, {
      db: prisma as unknown as PayoutDb,
      actor,
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to mark batch as paid.",
    };
  }
}

// ---------------------------------------------------------------------------
// clawbackEventAction
// ---------------------------------------------------------------------------

export async function clawbackEventAction(
  input: ClawbackInput
): Promise<PayoutActionState> {
  const actor = await getRequiredAdmin();
  try {
    await clawbackEvent(input, {
      db: prisma as unknown as PayoutDb,
      actor,
    });
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to create clawback.",
    };
  }
}
