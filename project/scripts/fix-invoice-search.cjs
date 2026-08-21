const fs = require('fs');
let c = fs.readFileSync('src/pages/app/InvoicePage.tsx', 'utf8');

// 1. Add Search icon import
c = c.replace(
  'import { FileText, Plus, Trash2, Eye, CheckCircle2, CalendarClock, Wallet, Pencil, ScanLine, Copy, MessageCircle } from "lucide-react";',
  'import { FileText, Plus, Trash2, Eye, CheckCircle2, CalendarClock, Wallet, Pencil, ScanLine, Copy, MessageCircle, Search } from "lucide-react";'
);

// 2. Add Input import
c = c.replace(
  'import { Button } from "@/components/ui/button";',
  'import { Button } from "@/components/ui/button";\nimport { Input } from "@/components/ui/input";'
);

// 3. Add searchText state after filterPihak
c = c.replace(
  '  const [filterPihak, setFilterPihak] = useState<string>("");',
  '  const [filterPihak, setFilterPihak] = useState<string>("");\n  const [searchText, setSearchText] = useState<string>("");'
);

// 4. Update filtered useMemo
const oldFiltered = `  const filtered = useMemo(() => {
    if (!invoices) return invoices;
    return invoices.filter((i: any) => {
      if (filterTipe && i.tipe !== filterTipe) return false;
      if (filterPihak && i.namaPihak !== filterPihak) return false;
      return true;
    });
  }, [invoices, filterTipe, filterPihak]);`;

const newFiltered = `  const filtered = useMemo(() => {
    if (!invoices) return invoices;
    const q = searchText.trim().toLowerCase();
    return invoices.filter((i: any) => {
      if (filterTipe && i.tipe !== filterTipe) return false;
      if (filterPihak && i.namaPihak !== filterPihak) return false;
      if (q) {
        const haystack = [
          i.idInvoice,
          i.namaPihak,
          i.tipe,
          ...(i.items ?? []).map((it: any) => \`\${it.kodeBarang} \${it.namaBarang}\`),
        ].join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [invoices, filterTipe, filterPihak, searchText]);`;

c = c.replace(oldFiltered, newFiltered);

// 5. Add search input UI before filter div
c = c.replace(
  '      <div className="mb-4 grid gap-2 sm:grid-cols-2 sm:max-w-lg">',
  `      <div className="mb-4 flex flex-wrap items-end gap-2">
        <div className="w-full sm:max-w-xs">
          <Label className="text-xs font-medium">Cari Invoice</Label>
          <div className="relative mt-1.5">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari ID, pihak, barang..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>`
);

// 6. Close the div before DataTable
c = c.replace(
  '      <DataTable',
  `      </div>

      <DataTable`
);

fs.writeFileSync('src/pages/app/InvoicePage.tsx', c);
console.log('DONE - all search changes applied');
