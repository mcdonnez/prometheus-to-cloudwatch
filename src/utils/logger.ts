import winston from 'winston';
const { combine, json, timestamp, prettyPrint, colorize } = winston.format;

let format = combine(json(), timestamp());
if (process.env.NODE_ENV !== 'prod' && process.env.NODE_ENV !== 'stage') {
  format = combine(
    timestamp(),
    prettyPrint({
      colorize: true,
    })
  );
}

export default winston.createLogger({
  level: 'info',
  format,
  transports: [new winston.transports.Console()],
});
