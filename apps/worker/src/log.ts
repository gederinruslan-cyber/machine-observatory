// Minimal leveled logger; alerting for now is grep-able WARN/ERROR lines
// (architecture spec: correctness monitors start as log-based alerts).

const ts = () => new Date().toISOString();

export const log = {
  info: (msg: string) => console.log(`${ts()} INFO  ${msg}`),
  warn: (msg: string) => console.warn(`${ts()} WARN  ${msg}`),
  error: (msg: string, err?: unknown) =>
    console.error(`${ts()} ERROR ${msg}`, err ?? ""),
};
