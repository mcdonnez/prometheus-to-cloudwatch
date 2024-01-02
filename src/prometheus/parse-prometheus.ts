import { shallowEqualObjects } from 'shallow-equal';
import parseSampleLine from './parse-line';
import { InvalidLineError } from './types';

export type PrometheusMetricInstance = {
  labels?: {
    [key: string]: string;
  };
  value?: number;
  count?: number;
  sum?: number;
  buckets?: {
    [key: string]: number;
  };
  quantiles?: {
    [key: string]: number;
  };
};

export type PrometheusMetric = {
  name: string;
  help: string;
  type: 'COUNTER' | 'GAUGE' | 'HISTOGRAM' | 'SUMMARY' | 'UNTYPED';
  metrics: PrometheusMetricInstance[];
};

/*
Notes:
* Empty line handling is slightly looser than the original implementation.
* Everything else should be similarly strict.
*/
const SUMMARY_TYPE = 'SUMMARY';
const HISTOGRAM_TYPE = 'HISTOGRAM';

export function parsePrometheusTextFormat(metrics) {
  const lines = metrics.split('\n'); // Prometheus format defines LF endings
  const converted: PrometheusMetric[] = [];

  let metric;
  let help;
  let type;
  let samples: PrometheusMetricInstance[] = [];

  for (let i = 0; i < lines.length; ++i) {
    const line = lines[i].trim();
    let lineMetric: string | null = null;
    let lineHelp: string | null = null;
    let lineType: string | null = null;
    let lineSample: ReturnType<typeof parseSampleLine> | null = null;
    if (line.length === 0) {
      // ignore blank lines
    } else if (line.startsWith('# ')) {
      // process metadata lines
      let lineData = line.substring(2);
      let instr: number | null = null;
      if (lineData.startsWith('HELP ')) {
        instr = 1;
      } else if (lineData.startsWith('TYPE ')) {
        instr = 2;
      }
      if (instr) {
        lineData = lineData.substring(5);
        const spaceIndex = lineData.indexOf(' ');
        if (spaceIndex !== -1) {
          // expect another token
          lineMetric = lineData.substring(0, spaceIndex);
          const remain = lineData.substring(spaceIndex + 1);
          if (instr === 1) {
            // HELP
            lineHelp = unescapeHelp(remain); // remain could be empty
          } else {
            // TYPE
            if (remain.includes(' ')) {
              throw new InvalidLineError(line);
            }
            lineType = remain.toUpperCase();
          }
        } else {
          throw new InvalidLineError(line);
        }
      }
      // 100% pure comment line, ignore
    } else {
      // process sample lines
      lineSample = parseSampleLine(line);
      lineMetric = lineSample.name ?? null;
    }

    if (lineMetric === metric) {
      // metadata always has same name
      if (!help && lineHelp) {
        help = lineHelp;
      } else if (!type && lineType) {
        type = lineType;
      }
    }

    // different types allow different suffixes
    const suffixedCount = `${metric}_count`;
    const suffixedSum = `${metric}_sum`;
    const suffixedBucket = `${metric}_bucket`;
    const allowedNames = [metric];
    if (type === SUMMARY_TYPE || type === HISTOGRAM_TYPE) {
      allowedNames.push(suffixedCount);
      allowedNames.push(suffixedSum);
    }
    if (type === HISTOGRAM_TYPE) {
      allowedNames.push(suffixedBucket);
    }

    // encountered new metric family or end of input
    if (
      i + 1 === lines.length ||
      (lineMetric && !allowedNames.includes(lineMetric))
    ) {
      // write current
      if (metric) {
        if (type === SUMMARY_TYPE) {
          samples = flattenMetrics(samples, 'quantiles', 'quantile', 'value');
        } else if (type === HISTOGRAM_TYPE) {
          samples = flattenMetrics(samples, 'buckets', 'le', 'bucket');
        }
        converted.push({
          name: metric,
          help: help ? help : '',
          type: type ? type : 'UNTYPED',
          metrics: samples,
        });
      }
      // reset for new metric family
      metric = lineMetric;
      help = lineHelp ? lineHelp : null;
      type = lineType ? lineType : null;
      samples = [];
    }
    if (lineSample) {
      // key is not called value in official implementation if suffixed count, sum, or bucket
      if (lineSample.name !== metric) {
        if (type === SUMMARY_TYPE || type === HISTOGRAM_TYPE) {
          if (lineSample.name === suffixedCount) {
            lineSample.count = lineSample.value;
          } else if (lineSample.name === suffixedSum) {
            lineSample.sum = lineSample.value;
          }
        }
        if (type === HISTOGRAM_TYPE && lineSample.name === suffixedBucket) {
          lineSample.bucket = lineSample.value;
        }
        delete lineSample.value;
      }
      delete lineSample.name;
      // merge into existing sample if labels are deep equal
      const samplesLen = samples.length;
      const lastSample = samplesLen === 0 ? null : samples[samplesLen - 1];
      if (
        lastSample &&
        shallowEqualObjects(lineSample.labels, lastSample.labels)
      ) {
        delete lineSample.labels;
        for (const key in lineSample) {
          lastSample[key] = lineSample[key];
        }
      } else {
        samples.push(lineSample);
      }
    }
  }

  return converted;
}

export type GroupedMetric = {
  labels?: {
    [key: string]: string;
  };
  buckets?: {
    [key: string]: number;
  };
  quantiles?: {
    [key: string]: number;
  };
  count?: number;
  sum?: number;
};

function flattenMetrics(
  metrics: any,
  groupName: 'buckets' | 'quantiles',
  keyName: string,
  valueName: string,
) {
  let groupedMetrics: Map<string, GroupedMetric> = new Map();
  for (let i = 0; i < metrics.length; ++i) {
    const sample = metrics[i];
    // grab sample.labels without keyName
    const groupKey = JSON.stringify(
      Object.entries(sample.labels)
        .map(([key, value]) => ({ key, value }))
        .filter(({ key }) => key !== keyName),
    );
    let groupedMetric = groupedMetrics.get(groupKey);
    if (!groupedMetric) {
      groupedMetric = {
        buckets: {},
        quantiles: {},
      } as GroupedMetric;
    }
    if (sample.count !== undefined) {
      groupedMetric.count = sample.count;
    }
    if (sample.sum !== undefined) {
      groupedMetric.sum = sample.sum;
    }
    if (sample.labels && sample.labels[keyName] && sample[valueName]) {
      // @ts-expect-error
      groupedMetric[groupName][sample.labels[keyName]] = sample[valueName];
    }
    if (sample.labels) {
      groupedMetric.labels = sample.labels;
      if (groupedMetric.labels) {
        delete groupedMetric.labels[keyName];
      }
    }
    if (groupName === 'buckets' && groupedMetric.quantiles) {
      groupedMetric.quantiles = {};
      delete groupedMetric.quantiles;
    }
    if (groupName === 'quantiles' && groupedMetric.buckets) {
      groupedMetric.buckets = {};
      delete groupedMetric.buckets;
    }

    groupedMetrics.set(groupKey, groupedMetric);
  }

  return Array.from(groupedMetrics.values());
}

// adapted from https://github.com/prometheus/client_python/blob/0.0.19/prometheus_client/parser.py
function unescapeHelp(line) {
  let result = '';
  let slash = false;

  for (let c = 0; c < line.length; ++c) {
    const char = line.charAt(c);
    if (slash) {
      if (char === '\\') {
        result += '\\';
      } else if (char === 'n') {
        result += '\n';
      } else {
        result += `\\${char}`;
      }
      slash = false;
    } else {
      if (char === '\\') {
        slash = true;
      } else {
        result += char;
      }
    }
  }

  if (slash) {
    result += '\\';
  }

  return result;
}
