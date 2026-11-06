# @lp-labs/hostname-policy

Boundary-safe caller-owned suffix authorization and hostname label constraints. Catalog identity 423; standalone package version 0.1.0.
No runtime, peer, or sibling dependencies. Node >=18, ESM and CommonJS with declarations.

## Install

```sh
npm install @lp-labs/hostname-policy
```

## Quickstart (runnable JavaScript)

```js
import assert from 'node:assert/strict';
import { createHostnamePolicy } from '@lp-labs/hostname-policy';
const policy = createHostnamePolicy({
  allowSuffixes: ['example.com'],
  denySuffixes: ['private.example.com'],
  minLabels: 2,
});
assert.equal(policy.evaluate('API.Example.com').allowed, true);
assert.equal(policy.evaluate('evil-example.com').allowed, false);
assert.equal(policy.evaluate('x.private.example.com').reason, 'denied');
```

## Customization and errors

Allow/deny lists are snapshotted. Each suffix matches itself or a descendant separated by a dot; deny wins. An omitted allow list allows every syntactically valid host; an empty list allows none. Set minLabels/maxLabels, allowNumericLabels and allowTrailingDot explicitly. Invalid hosts return reason syntax; wrong argument types/options throw TypeError, ordered integer limits outside 1..127 and lists over 1024 throw RangeError.

## Complete public declarations

Every runtime export and public type is shown below. This is the complete emitted declaration surface.

```ts
export interface HostnamePolicyOptions {
  allowSuffixes?: readonly string[];
  denySuffixes?: readonly string[];
  minLabels?: number;
  maxLabels?: number;
  allowTrailingDot?: boolean;
  allowNumericLabels?: boolean;
}
export interface HostnameDecision {
  readonly allowed: boolean;
  readonly hostname: string | null;
  readonly reason: 'allowed' | 'syntax' | 'labels' | 'denied' | 'not-allowed';
}
export interface HostnamePolicy {
  evaluate(hostname: string): HostnameDecision;
}
export declare function createHostnamePolicy(options?: HostnamePolicyOptions): HostnamePolicy;
```

## Performance, boundaries and limitations

O(n + s*n) worst-case matching for n<=254 input units and at most 1024 suffixes per list; O(s*n) policy storage. ASCII LDH labels only, no URLs, ports, IP address parsing, DNS queries, public-suffix list, registry policy, IDN conversion or wildcard expressions. Numeric dotted names are syntax-valid unless numeric labels are forbidden; this is not an SSRF/network access guard.

## Development

```sh
npm ci --offline
npm run build
npm run typecheck
npm test
npm run format:check
```

The offline install requires the locked development dependencies already in the npm cache.
Build emits separate ESM/CJS and declarations; type checks include bare-package .mts/.cts consumers with negative cases.
Runtime tests import only the single-quoted standalone dist entry and also run against installed offline tarballs.
No build artifacts or development dependencies are required at runtime.

## Support

If this library is useful to you, consider supporting its maintenance with a [donation via PayPal](https://www.paypal.me/LibinPrasanth).

## Author

Created by [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/). Connect on LinkedIn for updates and discussion.
