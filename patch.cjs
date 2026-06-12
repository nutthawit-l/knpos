const fs = require('fs');

// Patch Products.tsx
let products = fs.readFileSync('src/pages/Products.tsx', 'utf8');

// 1. imports
products = products.replace(
  `import CurrencySwitchPopup, {\n  currencies,\n  type Currency,\n} from '../components/CurrencySwitchPopup';`,
  `import { currencies, type Currency } from '../components/CurrencySwitchPopup';\nimport CurrencySortControls from '../components/CurrencySortControls';`
);

// 1b. remove unused ArrowUpDown from lucide-react in Products.tsx
products = products.replace(
  `  FileDown,\n  ArrowUpDown,\n  Filter,`,
  `  FileDown,\n  Filter,`
);

// 2. state
products = products.replace(
  `  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(\n    currencies.find((c) => c.code === 'USD') || currencies[0],\n  );\n  const [isCurrencyPopupOpen, setIsCurrencyPopupOpen] = useState(false);`,
  `  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(\n    currencies.find((c) => c.code === 'USD') || currencies[0],\n  );`
);

// 3. usage
products = products.replace(
  `              <div className='flex items-center gap-3 text-gray-500 relative'>\n                <button>\n                  <ArrowUpDown className='w-4 h-4' />\n                </button>\n                <button\n                  className='flex items-center gap-1 border border-gray-200 rounded-lg px-2 py-1 text-[11px] font-semibold text-primary transition-colors hover:bg-surface'\n                  onClick={() => setIsCurrencyPopupOpen(true)}\n                >\n                  <span className='w-3 h-3 rounded-full border border-primary flex items-center justify-center text-[8px]'>\n                    {selectedCurrency.symbol}\n                  </span>\n                  {selectedCurrency.code}\n                </button>\n\n                {isCurrencyPopupOpen && (\n                  <CurrencySwitchPopup\n                    selectedCode={selectedCurrency.code}\n                    onSelect={setSelectedCurrency}\n                    onClose={() => setIsCurrencyPopupOpen(false)}\n                  />\n                )}\n              </div>`,
  `              <CurrencySortControls\n                selectedCurrency={selectedCurrency}\n                onSelectCurrency={setSelectedCurrency}\n              />`
);

fs.writeFileSync('src/pages/Products.tsx', products);

// Patch Order.tsx
let order = fs.readFileSync('src/pages/Order.tsx', 'utf8');

order = order.replace(
  `import ConfirmOrderModal from '../components/ConfirmOrderModal';`,
  `import ConfirmOrderModal from '../components/ConfirmOrderModal';\nimport { currencies, type Currency } from '../components/CurrencySwitchPopup';\nimport CurrencySortControls from '../components/CurrencySortControls';`
);

order = order.replace(
  `  const [quantities, setQuantities] = useState<Record<number, number>>({});`,
  `  const [quantities, setQuantities] = useState<Record<number, number>>({});\n  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(\n    currencies.find((c) => c.code === 'USD') || currencies[0],\n  );`
);

order = order.replace(
  `              <div className='flex items-center gap-3 text-gray-500'>\n                <button>\n                  <ArrowUpDown className='w-4 h-4' />\n                </button>\n                <button>\n                  <Filter className='w-4 h-4' />\n                </button>\n              </div>`,
  `              <CurrencySortControls\n                selectedCurrency={selectedCurrency}\n                onSelectCurrency={setSelectedCurrency}\n              />`
);

order = order.replace(
  `\${totalCost.toFixed(2)}`,
  `{selectedCurrency.symbol}{totalCost.toFixed(2)}`
);

order = order.replace(
  /\{product\.price\}/g,
  () => `{product.price.replace('$', selectedCurrency.symbol)}`
);

fs.writeFileSync('src/pages/Order.tsx', order);
