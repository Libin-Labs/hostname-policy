import { createHostnamePolicy, type HostnameDecision } from '@lp-labs/hostname-policy';
const p = createHostnamePolicy({ allowSuffixes: ['example.com'], allowTrailingDot: true });
const d: HostnameDecision = p.evaluate('api.example.com');
d.reason.toUpperCase();
// @ts-expect-error suffixes must be strings
createHostnamePolicy({ allowSuffixes: [42] });
// @ts-expect-error label bound must be numeric
createHostnamePolicy({ minLabels: '2' });
// @ts-expect-error input must be string
p.evaluate(null);
