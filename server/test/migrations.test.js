import test from 'node:test';
import assert from 'node:assert/strict';
import {migrationPlan} from '../services/migrations.js';

test('migration plan is ordered and checksummed',async()=>{
  const plan=await migrationPlan();
  assert.deepEqual(plan.map(item=>item.id),['0000_baseline','0001_remove_placeholder_public_claims','0002_customer_privacy_controls']);
  for(const migration of plan){assert.match(migration.checksum,/^[a-f0-9]{64}$/);assert.ok(migration.sql.trim().length>0)}
});
