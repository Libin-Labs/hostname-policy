import test from 'node:test';
import assert from 'node:assert/strict';
import { createHostnamePolicy } from '../dist/esm/index.js';
test('suffix boundary not substring', () => {
  const p = createHostnamePolicy({ allowSuffixes: ['example.com'] });
  assert.equal(p.evaluate('A.Example.COM').hostname, 'a.example.com');
  assert.equal(p.evaluate('example.com').allowed, true);
  for (const s of ['badexample.com', 'example.com.evil', 'evil-example.com'])
    assert.equal(p.evaluate(s).allowed, false);
});
test('deny wins exact and descendants', () => {
  const p = createHostnamePolicy({
    allowSuffixes: ['example.com'],
    denySuffixes: ['private.example.com'],
  });
  assert.equal(p.evaluate('x.private.example.com').reason, 'denied');
  assert.equal(p.evaluate('private.example.com').reason, 'denied');
  assert.equal(p.evaluate('notprivate.example.com').allowed, true);
});
test('empty allow differs from unspecified and no registry', () => {
  assert.equal(createHostnamePolicy().evaluate('local').allowed, true);
  assert.equal(createHostnamePolicy({ allowSuffixes: [] }).evaluate('local').reason, 'not-allowed');
  assert.equal(createHostnamePolicy({ allowSuffixes: ['com'] }).evaluate('x.com').allowed, true);
});
test('label rules and terminal dot choice', () => {
  const p = createHostnamePolicy({
    minLabels: 2,
    maxLabels: 3,
    allowNumericLabels: false,
    allowTrailingDot: true,
  });
  assert.equal(p.evaluate('a.b.').allowed, true);
  assert.equal(p.evaluate('a.123').reason, 'labels');
  assert.equal(p.evaluate('a').reason, 'labels');
  assert.equal(p.evaluate('a.b.c.d').reason, 'labels');
  assert.equal(createHostnamePolicy().evaluate('a.b.').reason, 'syntax');
});
test('malformed bounds controls Unicode and IP punctuation', () => {
  for (const s of ['a..b', '-a.b', 'a_.b', 'a\n.b', 'é.com', '[::1]', 'a'.repeat(64) + '.b'])
    assert.equal(createHostnamePolicy().evaluate(s).reason, 'syntax');
  assert.throws(() => createHostnamePolicy({ minLabels: 3, maxLabels: 2 }), RangeError);
  assert.throws(() => createHostnamePolicy({ allowSuffixes: ['.com'] }), TypeError);
  assert.throws(() => createHostnamePolicy({ allowSuffixes: Array(1025).fill('a') }), RangeError);
  assert.throws(() => createHostnamePolicy().evaluate(7), TypeError);
});
test('policy snapshots caller arrays', () => {
  assert.throws(() => createHostnamePolicy({ allowSuffixes: Array(1) }), TypeError);
  const accessor = {};
  Object.defineProperty(accessor, 'allowSuffixes', {
    enumerable: true,
    get() {
      throw new Error('executed');
    },
  });
  assert.throws(() => createHostnamePolicy(accessor), TypeError);
  const allow = ['example.com'],
    options = { allowSuffixes: allow };
  const p = createHostnamePolicy(options);
  allow[0] = 'evil.com';
  options.minLabels = 5;
  assert.equal(p.evaluate('example.com').allowed, true);
  assert.equal(p.evaluate('evil.com').allowed, false);
});
