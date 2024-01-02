# prometheus-to-cloudwatch
Send Prometheus Metrics to Cloudwatch

This current supports Counters, Gauges, and Histograms. Other Metric types are not supported (yet...).

## Getting Started

Here are the following environment variables needed:

```bash
# Variables

## Required
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
# AWS credentials should have permissions to post metrics to cloudwatch

# Optional
NAMESPACE # Cloudwatch Namespace
PREFIX # prefix to remove from prometheus metrics
HOST # defaults to 0.0.0.0
PORT # defaults to 8080
intervalPeriod # defaults to 60000
path # defaults to /metrics
```

Here are the necessary commands to get started.

```bash
npm install
npm run build
npm start
```