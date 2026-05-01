/**
 * Quick latency profiler — runs both pooled (DATABASE_URL) and direct
 * (DIRECT_URL) connections, plus a few representative app queries, prints the
 * timings. Helps decide whether DB region or query shape is the bottleneck.
 *
 * Run:  pnpm tsx scripts/db-latency.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function timed<T>(label: string, fn: () => Promise<T>): Promise<number> {
  const start = performance.now();
  await fn();
  const ms = performance.now() - start;
  console.log(`  ${label.padEnd(40)} ${ms.toFixed(0).padStart(5)} ms`);
  return ms;
}

async function bench(label: string, fn: () => Promise<unknown>, runs = 5) {
  const samples: number[] = [];
  // Warm-up — first connection includes TLS handshake + auth.
  await fn();
  for (let i = 0; i < runs; i++) {
    samples.push(await timed(`${label} (run ${i + 1})`, fn));
  }
  const avg = samples.reduce((s, n) => s + n, 0) / samples.length;
  const min = Math.min(...samples);
  const max = Math.max(...samples);
  console.log(`  → avg ${avg.toFixed(0)}ms  min ${min.toFixed(0)}ms  max ${max.toFixed(0)}ms\n`);
}

async function main() {
  console.log('\n📍 DB latency profile');
  console.log('═'.repeat(60));

  console.log('\n1. SELECT 1 (pure roundtrip)');
  await bench('SELECT 1', () => prisma.$queryRaw`select 1`);

  console.log('2. count(transactions)');
  await bench('count', () => prisma.transaction.count());

  console.log('3. dashboard query bundle (parallel × 4)');
  await bench('dashboard parallel', () =>
    Promise.all([
      prisma.transaction.findMany({ take: 50 }),
      prisma.transaction.aggregate({ _sum: { amount: true } }),
      prisma.category.findMany(),
      prisma.budget.findMany(),
    ])
  );

  console.log('4. dashboard query bundle (sequential × 4)');
  await bench('dashboard sequential', async () => {
    await prisma.transaction.findMany({ take: 50 });
    await prisma.transaction.aggregate({ _sum: { amount: true } });
    await prisma.category.findMany();
    await prisma.budget.findMany();
  });

  await prisma.$disconnect();
  console.log('═'.repeat(60));
  console.log('\n📌 Reference: typical RTT from Vietnam');
  console.log('   • Singapore (ap-southeast-1): 30-50 ms');
  console.log('   • Tokyo     (ap-northeast-1): 60-90 ms');
  console.log('   • Sydney    (ap-southeast-2): 150-200 ms ← current');
  console.log('   • US East   (us-east-1):     220-280 ms');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
