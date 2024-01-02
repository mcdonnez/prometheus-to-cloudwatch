import { startMetricExporter } from "./metric-exporter";

startMetricExporter()
  .then(() => {
    console.log("done");
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
