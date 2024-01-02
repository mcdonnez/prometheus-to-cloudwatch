import { describe, it, expect } from '@jest/globals';
import { parsePrometheusTextFormat } from '@/prometheus/parse-prometheus';
import { multipleHistogramMetrics } from './fixtures';

describe('parsePrometheusTextFormat', () => {
  it('should parse Prometheus text format with metrics', () => {
    const metrics = `
      # HELP metric_name This is a sample metric
      # TYPE metric_name counter
      metric_name{label1="value1",label2="value2"} 42 1612345678
      metric_name{label1="value3",label2="value4"} 24 1612345679
    `;
    const expectedResult = [
      {
        name: 'metric_name',
        help: 'This is a sample metric',
        type: 'COUNTER',
        metrics: [
          {
            labels: {
              label1: 'value1',
              label2: 'value2',
            },
            value: 42,
            timestamp_ms: '1612345678',
          },
          {
            labels: {
              label1: 'value3',
              label2: 'value4',
            },
            value: 24,
            timestamp_ms: '1612345679',
          },
        ],
      },
    ];
    const result = parsePrometheusTextFormat(metrics);
    expect(result).toEqual(expectedResult);
  });

  it('should parse a histogram metric', () => {
    const metrics = `
    # HELP temporal_request_latency temporal_request_latency
    # TYPE temporal_request_latency histogram
    temporal_request_latency_bucket{operation="GetSystemInfo",service_name="temporal-core-sdk",le="50"} 1
    temporal_request_latency_bucket{operation="GetSystemInfo",service_name="temporal-core-sdk",le="100"} 1
    temporal_request_latency_bucket{operation="GetSystemInfo",service_name="temporal-core-sdk",le="500"} 1
    temporal_request_latency_bucket{operation="GetSystemInfo",service_name="temporal-core-sdk",le="1000"} 1
    temporal_request_latency_bucket{operation="GetSystemInfo",service_name="temporal-core-sdk",le="2500"} 1
    temporal_request_latency_bucket{operation="GetSystemInfo",service_name="temporal-core-sdk",le="10000"} 1
    temporal_request_latency_bucket{operation="GetSystemInfo",service_name="temporal-core-sdk",le="+Inf"} 1
    temporal_request_latency_sum{operation="GetSystemInfo",service_name="temporal-core-sdk"} 3
    temporal_request_latency_count{operation="GetSystemInfo",service_name="temporal-core-sdk"} 1
    `;

    const expectedResult = [
      {
        name: 'temporal_request_latency',
        help: 'temporal_request_latency',
        type: 'HISTOGRAM',
        metrics: [
          {
            labels: {
              operation: 'GetSystemInfo',
              service_name: 'temporal-core-sdk',
            },
            buckets: {
              50: 1,
              100: 1,
              500: 1,
              1000: 1,
              2500: 1,
              10000: 1,
              '+Inf': 1,
            },
            count: 1,
            sum: 3,
          },
        ],
      },
    ];

    const result = parsePrometheusTextFormat(metrics);

    expect(result).toEqual(expectedResult);
  });

  it('should parse multiple histogram metrics', () => {
    const expectedResults = [
      {
        name: 'temporal_activity_execution_latency',
        help: 'temporal_activity_execution_latency',
        type: 'HISTOGRAM',
        metrics: [
          {
            labels: {
              activity_type: 'compareProjects',
              namespace: 'default',
              service_name: 'temporal-core-sdk',
              task_queue: 'dev_integrations_priority_queue',
              workflow_type: 'syncProjectById',
            },
            buckets: {
              50: 2,
              100: 2,
              500: 2,
              1000: 2,
              10000: 2,
              5000: 2,
              60000: 2,
              '+Inf': 2,
            },
            count: 2,
            sum: 28,
          },
          {
            labels: {
              activity_type: 'evaluateTriggers',
              namespace: 'default',
              service_name: 'temporal-core-sdk',
              task_queue: 'dev_integrations_priority_queue',
              workflow_type: 'syncProjectById',
            },
            buckets: {
              100: 2,
              500: 2,
              1000: 2,
              10000: 2,
              5000: 2,
              60000: 2,
              '+Inf': 2,
            },
            count: 2,
            sum: 113,
          },
        ],
      },
    ];

    const result = parsePrometheusTextFormat(multipleHistogramMetrics);

    expect(result).toEqual(expectedResults);
  });

  // Add more test cases as needed
});
