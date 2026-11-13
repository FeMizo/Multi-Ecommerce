export function plural(count: number, singular: string, pluralForm = `${singular}s`) {
  return `${count.toLocaleString("es-MX")} ${count === 1 ? singular : pluralForm}`
}
