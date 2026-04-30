import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, UserRole, AccountStatus, CommissionKind } from "../src/generated/prisma/client";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // ---------------------------------------------------------------------------
  // 1. Admin user
  // ---------------------------------------------------------------------------
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
  const adminName = process.env.SEED_ADMIN_NAME ?? "Admin User";

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { name: adminName, role: UserRole.ADMIN, status: AccountStatus.ACTIVE },
    create: { email: adminEmail, name: adminName, role: UserRole.ADMIN, status: AccountStatus.ACTIVE },
  });
  console.log(`[seed] Admin user: ${adminUser.email} (${adminUser.id})`);

  // ---------------------------------------------------------------------------
  // 2. Tiers
  // ---------------------------------------------------------------------------
  const affiliateTier = await prisma.tier.upsert({
    where: { name: "Affiliate" },
    update: {
      description: "Standard affiliate partner. Earns commission on referred deals.",
      isDefault: true,
      isActive: true,
    },
    create: {
      name: "Affiliate",
      description: "Standard affiliate partner. Earns commission on referred deals.",
      isDefault: true,
      isActive: true,
    },
  });
  console.log(`[seed] Tier: ${affiliateTier.name} (${affiliateTier.id})`);

  const resellerTier = await prisma.tier.upsert({
    where: { name: "Authorized Reseller" },
    update: {
      description: "Authorized reseller with higher commission rates and volume requirements.",
      isDefault: false,
      isActive: true,
    },
    create: {
      name: "Authorized Reseller",
      description: "Authorized reseller with higher commission rates and volume requirements.",
      isDefault: false,
      isActive: true,
    },
  });
  console.log(`[seed] Tier: ${resellerTier.name} (${resellerTier.id})`);

  // ---------------------------------------------------------------------------
  // 3. Product: Aries AI
  // ---------------------------------------------------------------------------
  const ariesProduct = await prisma.product.upsert({
    where: { code: "ARIES_AI" },
    update: { name: "Aries AI", isActive: true },
    create: { code: "ARIES_AI", name: "Aries AI", isActive: true },
  });
  console.log(`[seed] Product: ${ariesProduct.name} (${ariesProduct.code})`);

  // ---------------------------------------------------------------------------
  // 4. Product packages for Aries AI
  // ---------------------------------------------------------------------------
  const packages: { code: string; name: string }[] = [
    { code: "STARTER", name: "Aries AI Starter" },
    { code: "PROFESSIONAL", name: "Aries AI Professional" },
    { code: "ENTERPRISE", name: "Aries AI Enterprise" },
  ];

  for (const pkg of packages) {
    const record = await prisma.productPackage.upsert({
      where: { productCode_code: { productCode: "ARIES_AI", code: pkg.code } },
      update: { name: pkg.name, isActive: true },
      create: { productCode: "ARIES_AI", code: pkg.code, name: pkg.name, isActive: true },
    });
    console.log(`[seed] Package: ${record.name} (${record.productCode}/${record.code})`);
  }

  // ---------------------------------------------------------------------------
  // 5. Commission rules
  // ---------------------------------------------------------------------------
  type RuleSpec = {
    tierId: string;
    tierName: string;
    productCode: string;
    packageCode: string;
    kind: CommissionKind;
    percentBps: number;
    trailingMonths?: number;
    payoutDelayDays: number;
    clawbackWindowDays: number;
  };

  const rules: RuleSpec[] = [
    // --- Affiliate tier ---
    {
      tierId: affiliateTier.id,
      tierName: affiliateTier.name,
      productCode: "ARIES_AI",
      packageCode: "STARTER",
      kind: CommissionKind.UPFRONT,
      percentBps: 1000,
      payoutDelayDays: 30,
      clawbackWindowDays: 90,
    },
    {
      tierId: affiliateTier.id,
      tierName: affiliateTier.name,
      productCode: "ARIES_AI",
      packageCode: "PROFESSIONAL",
      kind: CommissionKind.UPFRONT,
      percentBps: 1200,
      payoutDelayDays: 30,
      clawbackWindowDays: 90,
    },
    {
      tierId: affiliateTier.id,
      tierName: affiliateTier.name,
      productCode: "ARIES_AI",
      packageCode: "PROFESSIONAL",
      kind: CommissionKind.TRAILING,
      percentBps: 500,
      trailingMonths: 12,
      payoutDelayDays: 30,
      clawbackWindowDays: 90,
    },
    {
      tierId: affiliateTier.id,
      tierName: affiliateTier.name,
      productCode: "ARIES_AI",
      packageCode: "ENTERPRISE",
      kind: CommissionKind.UPFRONT,
      percentBps: 1500,
      payoutDelayDays: 30,
      clawbackWindowDays: 90,
    },
    {
      tierId: affiliateTier.id,
      tierName: affiliateTier.name,
      productCode: "ARIES_AI",
      packageCode: "ENTERPRISE",
      kind: CommissionKind.TRAILING,
      percentBps: 800,
      trailingMonths: 12,
      payoutDelayDays: 30,
      clawbackWindowDays: 90,
    },
    // --- Authorized Reseller tier ---
    {
      tierId: resellerTier.id,
      tierName: resellerTier.name,
      productCode: "ARIES_AI",
      packageCode: "STARTER",
      kind: CommissionKind.UPFRONT,
      percentBps: 1500,
      payoutDelayDays: 30,
      clawbackWindowDays: 90,
    },
    {
      tierId: resellerTier.id,
      tierName: resellerTier.name,
      productCode: "ARIES_AI",
      packageCode: "PROFESSIONAL",
      kind: CommissionKind.UPFRONT,
      percentBps: 1800,
      payoutDelayDays: 30,
      clawbackWindowDays: 90,
    },
    {
      tierId: resellerTier.id,
      tierName: resellerTier.name,
      productCode: "ARIES_AI",
      packageCode: "PROFESSIONAL",
      kind: CommissionKind.TRAILING,
      percentBps: 800,
      trailingMonths: 12,
      payoutDelayDays: 30,
      clawbackWindowDays: 90,
    },
    {
      tierId: resellerTier.id,
      tierName: resellerTier.name,
      productCode: "ARIES_AI",
      packageCode: "ENTERPRISE",
      kind: CommissionKind.UPFRONT,
      percentBps: 2000,
      payoutDelayDays: 30,
      clawbackWindowDays: 90,
    },
    {
      tierId: resellerTier.id,
      tierName: resellerTier.name,
      productCode: "ARIES_AI",
      packageCode: "ENTERPRISE",
      kind: CommissionKind.TRAILING,
      percentBps: 1000,
      trailingMonths: 12,
      payoutDelayDays: 30,
      clawbackWindowDays: 90,
    },
  ];

  for (const rule of rules) {
    const existing = await prisma.commissionRule.findFirst({
      where: {
        tierId: rule.tierId,
        productCode: rule.productCode,
        packageCode: rule.packageCode,
        kind: rule.kind,
      },
    });

    if (existing) {
      console.log(
        `[seed] CommissionRule already exists — skipping: ${rule.tierName} / ${rule.productCode} / ${rule.packageCode} / ${rule.kind}`
      );
    } else {
      await prisma.commissionRule.create({
        data: {
          tierId: rule.tierId,
          productCode: rule.productCode,
          packageCode: rule.packageCode,
          kind: rule.kind,
          percentBps: rule.percentBps,
          currency: "USD",
          trailingMonths: rule.trailingMonths ?? null,
          payoutDelayDays: rule.payoutDelayDays,
          clawbackWindowDays: rule.clawbackWindowDays,
          isActive: true,
        },
      });
      console.log(
        `[seed] CommissionRule created: ${rule.tierName} / ${rule.productCode} / ${rule.packageCode} / ${rule.kind} @ ${rule.percentBps} bps`
      );
    }
  }

  console.log("[seed] Done.");
}

main()
  .catch((err) => {
    console.error("[seed] Error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
