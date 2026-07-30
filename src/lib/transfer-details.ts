export const TRANSFER_REFERENCE_LIMIT = 10

function normalizePart(value?: string | null) {
  return value?.trim() ?? ""
}

export function buildTransferReference(prefix?: string | null, extra?: string | null) {
  return [normalizePart(prefix), normalizePart(extra)]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
}

export type TransferDetails = {
  transferAccountName?: string | null
  transferAccountNumber?: string | null
  transferBank?: string | null
  transferReferencePrefix?: string | null
  transferReferenceExtra?: string | null
}
