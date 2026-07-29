const ACCENT_REGEX = /[\u0300-\u036f]/g

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(ACCENT_REGEX, "")
    .trim()
    .replace(/\s+/g, " ")
}

export function normalizeCsvHeader(value: string) {
  return normalizeText(value).replace(/[^a-z0-9]+/g, "")
}

export function parseCsv(text: string) {
  const source = text.replace(/^\uFEFF/, "")
  const rows: string[][] = []
  let row: string[] = []
  let cell = ""
  let i = 0
  let inQuotes = false

  while (i < source.length) {
    const char = source[i]
    const next = source[i + 1]

    if (inQuotes) {
      if (char === '"') {
        if (next === '"') {
          cell += '"'
          i += 2
          continue
        }
        inQuotes = false
        i += 1
        continue
      }

      cell += char
      i += 1
      continue
    }

    if (char === '"') {
      inQuotes = true
      i += 1
      continue
    }

    if (char === ",") {
      row.push(cell)
      cell = ""
      i += 1
      continue
    }

    if (char === "\n" || char === "\r") {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ""
      if (char === "\r" && next === "\n") {
        i += 2
      } else {
        i += 1
      }
      continue
    }

    cell += char
    i += 1
  }

  row.push(cell)
  if (row.length > 1 || row[0] !== "" || rows.length === 0) {
    rows.push(row)
  }

  return rows.filter((current) => current.some((value) => value.trim() !== ""))
}

export function splitCsvList(value: string) {
  return value
    .split(/[\n;,|]+/g)
    .map((item) => item.trim())
    .filter(Boolean)
}

export function parseCsvNumber(value: string) {
  const cleaned = value.trim().replace(/\$/g, "").replace(/\s+/g, "")
  if (!cleaned) return null

  const normalized = cleaned.includes(",") && !cleaned.includes(".")
    ? cleaned.replace(/,/g, ".")
    : cleaned.replace(/,/g, "")

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

export function parseCsvInteger(value: string) {
  const parsed = parseCsvNumber(value)
  return parsed === null ? null : Math.trunc(parsed)
}

