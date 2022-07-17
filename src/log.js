import dayjs from "dayjs";

const LogType = {
  INFO: "info",
  WARN: "warn",
  ERROR: "error"
};

export const logs = [];
function log(msg, type = LogType.INFO) {
  const m = `[${dayjs().format("YYYY-MM-DD HH:mm:ss.SSS")}] [${type}] ${msg}`;
  console.log(m);
  logs.push(m);
}

export const info = (msg) => log(msg, LogType.INFO);
export const warn = (msg) => log(msg, LogType.WARN);
export const error = (msg) => log(msg, LogType.ERROR);