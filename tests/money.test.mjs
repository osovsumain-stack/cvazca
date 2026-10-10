import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runMoneyInvariantTests } from '../server/generated/services/moneyInvariantTests.js';
for(const result of runMoneyInvariantTests())test(`pricing: ${result.name}`,()=>assert.ok(result.passed,result.detail));
