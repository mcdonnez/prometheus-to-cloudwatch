import { describe, it, expect } from '@jest/globals';
import parseSampleLine from '@/prometheus/parse-line';

describe('parseSampleLine', () => {
  it('should parse a line with labels', () => {
    const line =
      'temporal_request{operation="GetSystemInfo",service_name="temporal-core-sdk"} 1';
    const result = parseSampleLine(line);
    expect(result).toEqual({
      name: 'temporal_request',
      value: 1,
      labels: {
        operation: 'GetSystemInfo',
        service_name: 'temporal-core-sdk',
      },
    });
  });

  it('should parse a sample line without labels', () => {
    const line = 'temporal_request 1';
    const result = parseSampleLine(line);
    expect(result).toEqual({
      name: 'temporal_request',
      value: 1,
    });
  });

  it('should parse a line from a histogram', () => {
    const line =
      'temporal_request_latency_bucket{operation="GetSystemInfo",service_name="temporal-core-sdk",le="100"} 1';
    const result = parseSampleLine(line);
    expect(result).toEqual({
      name: 'temporal_request_latency_bucket',
      labels: {
        operation: 'GetSystemInfo',
        service_name: 'temporal-core-sdk',
        le: '100',
      },
      value: 1,
    });
  });
});
