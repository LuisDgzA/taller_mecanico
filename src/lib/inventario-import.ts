import ExcelJS from "exceljs";

export const REFACCIONES_IMPORT_SHEET_NAME = "Refacciones";

export const REFACCIONES_IMPORT_COLUMNS = [
  { key: "nombre", header: "Nombre", width: 32 },
  { key: "marca", header: "Marca", width: 20 },
  { key: "uuid", header: "UUID", width: 38 },
  { key: "precio", header: "Precio", width: 14 },
  { key: "stock", header: "Stock inicial", width: 16 },
] as const;

export async function buildRefaccionesTemplateWorkbook() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(REFACCIONES_IMPORT_SHEET_NAME);

  sheet.columns = REFACCIONES_IMPORT_COLUMNS.map((column) => ({
    key: column.key,
    header: column.header,
    width: column.width,
  }));

  sheet.getRow(1).font = { bold: true };

  return workbook.xlsx.writeBuffer();
}

export type RefaccionImportRawRow = {
  rowNumber: number;
  nombre: string;
  marca: string;
  uuid: string;
  precio: string;
  stock: string;
};

function cellToText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "object" && "text" in value) {
    return String((value as { text: unknown }).text ?? "");
  }

  if (typeof value === "object" && "result" in value) {
    return String((value as { result: unknown }).result ?? "");
  }

  return String(value);
}

export async function parseRefaccionesWorkbook(buffer: ArrayBuffer | Buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as never);

  const sheet = workbook.worksheets[0];

  if (!sheet) {
    return [] as RefaccionImportRawRow[];
  }

  const rows: RefaccionImportRawRow[] = [];

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      return;
    }

    const nombre = cellToText(row.getCell(1).value).trim();
    const marca = cellToText(row.getCell(2).value).trim();
    const uuid = cellToText(row.getCell(3).value).trim();
    const precio = cellToText(row.getCell(4).value).trim();
    const stock = cellToText(row.getCell(5).value).trim();

    if (!nombre && !marca && !uuid && !precio && !stock) {
      return;
    }

    rows.push({ rowNumber, nombre, marca, uuid, precio, stock });
  });

  return rows;
}
