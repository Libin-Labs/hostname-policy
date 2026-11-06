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
function canonical(input: unknown, trailing: boolean): string | null {
  if (typeof input !== 'string' || input.length > 254) return null;
  const text = trailing && input.endsWith('.') ? input.slice(0, -1) : input;
  if (
    !text.length ||
    text.length > 253 ||
    text
      .split('.')
      .some((l) => l.length > 63 || !/^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(l))
  )
    return null;
  return text.toLowerCase();
}
export function createHostnamePolicy(options: HostnamePolicyOptions = {}): HostnamePolicy {
  if (
    !options ||
    typeof options !== 'object' ||
    ![null, Object.prototype].includes(Object.getPrototypeOf(options))
  )
    throw new TypeError('Policy options must be a plain record.');
  for (const key of Reflect.ownKeys(options)) {
    const descriptor = Object.getOwnPropertyDescriptor(options, key)!;
    if (typeof key !== 'string' || !descriptor.enumerable || !('value' in descriptor))
      throw new TypeError('Options must be own data properties.');
  }
  if (
    !options ||
    typeof options !== 'object' ||
    Array.isArray(options) ||
    Object.keys(options).some(
      (k) =>
        ![
          'allowSuffixes',
          'denySuffixes',
          'minLabels',
          'maxLabels',
          'allowTrailingDot',
          'allowNumericLabels',
        ].includes(k),
    )
  )
    throw new TypeError('Unsupported policy options.');
  const min = options.minLabels ?? 1,
    max = options.maxLabels ?? 127;
  if (!Number.isInteger(min) || !Number.isInteger(max) || min < 1 || max > 127 || min > max)
    throw new RangeError('Label bounds must be ordered integers in 1..127.');
  for (const value of [options.allowTrailingDot, options.allowNumericLabels])
    if (value !== undefined && typeof value !== 'boolean') throw new TypeError('Expected boolean.');
  function suffixes(values: readonly string[] | undefined): readonly string[] | undefined {
    if (values === undefined) return undefined;
    if (!Array.isArray(values) || values.length > 1024)
      throw new RangeError('At most 1024 suffixes.');
    return Array.from(values).map((value) => {
      const result = canonical(value, false);
      if (!result) throw new TypeError('Suffix must be an ASCII hostname without a terminal dot.');
      return result;
    });
  }
  const allow = suffixes(options.allowSuffixes),
    deny = suffixes(options.denySuffixes) ?? [];
  const trailing = options.allowTrailingDot ?? false,
    numeric = options.allowNumericLabels ?? true;
  return Object.freeze({
    evaluate(input: string): HostnameDecision {
      if (typeof input !== 'string') throw new TypeError('Hostname must be a string.');
      const hostname = canonical(input, trailing);
      if (!hostname) return { allowed: false, hostname: null, reason: 'syntax' };
      const labels = hostname.split('.');
      const result = (reason: HostnameDecision['reason']): HostnameDecision => ({
        allowed: reason === 'allowed',
        hostname,
        reason,
      });
      if (
        labels.length < min ||
        labels.length > max ||
        (!numeric && labels.some((l) => /^\d+$/.test(l)))
      )
        return result('labels');
      const matches = (suffix: string) => hostname === suffix || hostname.endsWith(`.${suffix}`);
      if (deny.some(matches)) return result('denied');
      if (allow !== undefined && !allow.some(matches)) return result('not-allowed');
      return result('allowed');
    },
  });
}
