// call endpoint with prometheus metrics
// convert prometheus metrics to cloudwatch metrics
// send cloudwatch metrics to cloudwatch
import {
  PutMetricDataCommand,
  CloudWatchClient,
  MetricDatum,
  StandardUnit,
} from "@aws-sdk/client-cloudwatch";
import logger from "./utils/logger";
import config from "./utils/config";
import {
  PrometheusMetric,
  parsePrometheusTextFormat,
} from "./prometheus/parse-prometheus";
const previousMetricValues: { [key: string]: number } = {};
const previousHistogramCounts: { [key: string]: number[] } = {};

const namespace = config.namespace;

const metricToCloudwatchMetric = ({
  metrics,
  name,
  type: metricType,
}: PrometheusMetric): MetricDatum[] => {
  const metricName = name.replace(config.prefix, "");

  if (metricType === "GAUGE") {
    return metrics
      .map((metric) => ({
        MetricName: metricName,
        Dimensions: metric.labels
          ? Object.entries(metric.labels).map(([key, value]) => ({
              Name: key,
              Value: value,
            }))
          : [],
        Timestamp: new Date(),
        Unit: "None" as StandardUnit,
        Value: !isNaN(Number(metric.value)) ? Number(metric.value) : undefined,
      }))
      .filter((metric) => metric.Value !== undefined && metric.Value !== 0);
  }

  if (metricType === "COUNTER") {
    return metrics
      .map((metric) => {
        const metricKey = `${metricName}_${JSON.stringify(metric.labels)}`;
        const previousValue = previousMetricValues[metricKey];
        if (previousValue === undefined && !isNaN(Number(metric.value))) {
          previousMetricValues[metricKey] = Number(metric.value);
          return undefined;
        }

        previousMetricValues[metricKey] = Number(metric.value);

        return {
          MetricName: metricName,
          Dimensions: metric.labels
            ? Object.entries(metric.labels).map(([key, value]) => ({
                Name: key,
                Value: value,
              }))
            : [],
          Timestamp: new Date(),
          Unit: "Count" as StandardUnit,
          Value:
            previousValue && !isNaN(Number(metric.value))
              ? Number(metric.value) - previousValue
              : undefined,
        };
      })
      .filter(
        (metric) =>
          metric !== undefined &&
          metric.Value !== undefined &&
          metric.Value !== 0
      ) as MetricDatum[];
  }

  if (metricType === "UNTYPED") {
    return metrics
      .map((metric) => ({
        MetricName: metricName,
        Dimensions: metric.labels
          ? Object.entries(metric.labels).map(([key, value]) => ({
              Name: key,
              Value: value,
            }))
          : [],
        Timestamp: new Date(),
        Unit: "None" as StandardUnit,
        Value: !isNaN(Number(metric.value)) ? Number(metric.value) : undefined,
      }))
      .filter((metric) => metric.Value !== undefined);
  }

  if (metricType === "HISTOGRAM") {
    return metrics
      .map((metric) => {
        const metricKey = `${metricName}_${JSON.stringify(metric.labels)}`;
        // convert prometheus histogram buckets to cloudwatch statistic values
        const previousCounts: number[] = JSON.parse(
          JSON.stringify(previousHistogramCounts[metricKey] ?? [])
        );

        const values = metric.buckets
          ? Object.keys(metric.buckets)
              .map((key) => (key === "+Inf" ? 60000 : Number(key)))
              .filter((val) => !isNaN(val))
          : [];
        const rawCounts = metric.buckets
          ? Object.values(metric.buckets)
              .map((val) => Number(val))
              .filter((val) => !isNaN(val))
          : [];
        const currentCounts = rawCounts.map((val, idx, arr) => {
          if (previousCounts === undefined) return undefined;
          if (idx === 0) return val;
          const previousRawCount = arr[idx - 1];
          return val - previousRawCount;
        }) as number[];

        previousHistogramCounts[metricKey] = currentCounts;
        if (previousCounts.length === 0) {
          return undefined;
        }

        const countDiffs = currentCounts.map((val, idx) => {
          return val - previousCounts[idx];
        });

        return {
          MetricName: metricName,
          Dimensions: metric.labels
            ? Object.entries(metric.labels).map(([key, value]) => ({
                Name: key,
                Value: value,
              }))
            : [],
          Timestamp: new Date(),
          Unit: "Milliseconds" as StandardUnit,
          Values: values,
          Counts: countDiffs,
        };
      })
      .filter(
        (metric) =>
          metric !== undefined &&
          metric.Values !== undefined &&
          metric.Counts !== undefined &&
          metric.Counts.reduce((a, b) => a + b) > 0
      ) as MetricDatum[];
  }

  if (metricType === "SUMMARY") {
    return metrics
      .map((metric) => ({
        MetricName: metricName,
        Dimensions: metric.labels
          ? Object.entries(metric.labels).map(([key, value]) => ({
              Name: key,
              Value: value,
            }))
          : [],
        Timestamp: new Date(),
        Unit: "Count" as StandardUnit,
        Value:
          metric.count && metric.sum ? metric.count / metric.sum : undefined,
        StatisticValues: {
          Maximum: metric.quantiles?.["+Inf"],
          Minimum: metric.quantiles?.["50"],
          SampleCount: metric.count,
          Sum: metric.sum,
        },
      }))
      .filter((metric) => metric.Value !== undefined && metric.Value !== 0);
  }

  return metrics
    .map((metric) => ({
      MetricName: metricName,
      Dimensions: metric.labels
        ? Object.entries(metric.labels).map(([key, value]) => ({
            Name: key,
            Value: value,
          }))
        : [],
      Timestamp: new Date(),
      Unit: "None" as StandardUnit,
      Value: metric.value,
    }))
    .filter((metric) => metric.Value !== undefined && metric.Value !== 0);
};

const getMetrics = async (): Promise<PrometheusMetric[]> => {
  const timeout = 5000; // Set your desired timeout in milliseconds

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  const response = await Promise.race([
    fetch(`http://${config.host}:${config.port}${config.path}`, { signal: controller.signal }),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), timeout)
    ),
  ]);

  clearTimeout(id);
  const text = await (response as any).text();
  const metrics = parsePrometheusTextFormat(text);
  return metrics;
};

const client = new CloudWatchClient({ region: "us-east-1" });

export const startMetricExporter = async function startMetricExporter() {
//   if (config.env === "dev") {
//     logger.info("Skipping metric exporter in dev environment");
//     return;
//   }

  logger.info("Starting metric exporter");
  const interval = setInterval(async () => {
    let cloudwatchMetrics: MetricDatum[] = [];
    try {
      const metrics = await getMetrics();
      cloudwatchMetrics = metrics.map(metricToCloudwatchMetric).flat();

      if (cloudwatchMetrics.length === 0) {
        return;
      }

      const command = new PutMetricDataCommand({
        MetricData: cloudwatchMetrics,
        Namespace: namespace,
      });

      await client.send(command);
    } catch (err) {
      logger.error("Error sending metrics to cloudwatch", {
        error: err,
        errorMessage: (err as any)?.message,
        cloudwatchMetrics,
      });
    }
  }, config.intervalPeriod);

  return new Promise<void>((resolve) => {
    process.on("SIGTERM", async () => {
      logger.info("SIGTERM signal received.");
      clearInterval(interval);
      resolve();
    });
  });
};
