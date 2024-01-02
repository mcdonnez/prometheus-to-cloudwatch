# prometheus-to-cloudwatch
Send Prometheus Metrics to Cloudwatch

This is a proof of concept on how to send metrics from prometheus to cloudwatch. It works for certain metric types but does not work for all metrics.

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


```bash
npm install
npm run build
npm start
```