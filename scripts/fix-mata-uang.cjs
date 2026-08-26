const fs = require('fs');
const path = require('path');
const filePath = path.resolve(__dirname, '../src/components/app/InvoiceFormDialog.tsx');
let c = fs.readFileSync(filePath, 'utf8');

// Replace the ternary that only shows Mata Uang for Supplier
// Now show Mata Uang for ALL non-Pasar types (Supplier, Reseller, DPL)
const oldTernary = `{tipe === "Supplier" ? (
            <div>
              <Label className="text-xs font-medium">Mata Uang *</Label>
              <Select value={mataUang} onValueChange={(v) => setMataUang(v as MataUang)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Rp">Rupiah (Rp)</SelectItem>
                  <SelectItem value="$">Dolar ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ) : (
            (tipe === "Reseller" || tipe === "DPL") && (
              <div>
                <Label className="text-xs font-medium">
                  Tenggat Pembayaran <span className="text-muted-foreground">(opsional)</span>
                </Label>
                <Input
                  className="mt-1.5"
                  type="date"`;

const newTernary = `{tipe !== "Pasar" && (
            <div>
              <Label className="text-xs font-medium">Mata Uang *</Label>
              <Select value={mataUang} onValueChange={(v) => setMataUang(v as MataUang)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Rp">Rupiah (Rp)</SelectItem>
                  <SelectItem value="$">Dolar ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {(tipe === "Reseller" || tipe === "DPL") && (
            <div>
              <Label className="text-xs font-medium">
                Tenggat Pembayaran <span className="text-muted-foreground">(opsional)</span>
              </Label>
              <Input
                className="mt-1.5"
                type="date"`;

if (c.includes(oldTernary)) {
  c = c.replace(oldTernary, newTernary);
  fs.writeFileSync(filePath, c);
  console.log('DONE - Mata Uang now shows for Reseller/DPL too');
} else {
  // Check if it was already changed
  if (c.includes('tipe !== "Pasar"')) {
    console.log('ALREADY DONE - Mata Uang section already updated');
  } else {
    console.log('ERROR - Could not find old ternary pattern');
    // Debug: print around the area
    const idx = c.indexOf('Supplier" ?');
    if (idx > -1) {
      console.log('Found at index', idx);
      console.log('---');
      console.log(c.substring(idx - 30, idx + 200));
    }
  }
}
