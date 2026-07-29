import assert from "node:assert/strict"
import test from "node:test"
import { parseCsv, splitCsvList } from "./csv"

test("parsea filas CSV con comas y comillas", () => {
  const rows = parseCsv('titulo,precio,descripcion\n"Camiseta, azul",199.99,"Hola ""mundo"""')

  assert.deepEqual(rows, [
    ["titulo", "precio", "descripcion"],
    ["Camiseta, azul", "199.99", 'Hola "mundo"'],
  ])
})

test("divide listas separadas por punto y coma o barra vertical", () => {
  assert.deepEqual(splitCsvList("uno; dos | tres"), ["uno", "dos", "tres"])
})
