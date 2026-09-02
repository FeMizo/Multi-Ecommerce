type LogLevel = "info" | "warn" | "error"

type LogPayload = Record<string, unknown> & {
  event: string
}

function serializeValue(value: unknown) {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    }
  }

  return value
}

function writeLog(level: LogLevel, scope: string, payload: LogPayload) {
  const record = {
    ts: new Date().toISOString(),
    scope,
    ...payload,
  }
  console[level](JSON.stringify(record, (_key, value) => serializeValue(value)))
}

export function createLogger(scope: string) {
  return {
    info(event: string, payload: Omit<LogPayload, "event"> = {}) {
      writeLog("info", scope, { event, ...payload })
    },
    warn(event: string, payload: Omit<LogPayload, "event"> = {}) {
      writeLog("warn", scope, { event, ...payload })
    },
    error(event: string, payload: Omit<LogPayload, "event"> = {}) {
      writeLog("error", scope, { event, ...payload })
    },
  }
}

export function serializeError(error: unknown) {
  return serializeValue(error)
}
