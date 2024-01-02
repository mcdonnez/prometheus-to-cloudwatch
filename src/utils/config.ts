export default {
    env: process.env.NODE_ENV ?? "dev",
    namespace: process.env.NAMESPACE ?? "MY_NAMESPACE",
    prefix: process.env.PREFIX ?? "unique_prefix_",
    host: process.env.HOST ?? "0.0.0.0",
    port: process.env.PORT ?? 8080,
    intervalPeriod: process.env.INTERVAL_PERIOD ? Number(process.env.INTERVAL_PERIOD) : 60000,
    path: process.env.PATH ?? "/metrics",
}