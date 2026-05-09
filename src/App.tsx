import { useState, useEffect, useMemo } from "react";
import { 
  Package, 
  ClipboardList, 
  FileText, 
  Plus, 
  Search, 
  Eye, 
  EyeOff, 
  Save, 
  Trash2, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRightLeft,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  RotateCcw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// --- Types ---
interface Product {
  id: string;
  name: string;
  sku: string;
  systemStock: number;
  createdAt: number;
}

interface OpnameEntry {
  productId: string;
  physicalStock: number;
  systemStockAtTime: number;
  timestamp: number;
}

// --- Constants ---
const STORAGE_KEY_PRODUCTS = "stock_opname_products";
const STORAGE_KEY_REPORTS = "stock_opname_reports";

export default function App() {
  // --- State ---
  const [activeTab, setActiveTab] = useState<"master" | "opname" | "report">("master");
  const [products, setProducts] = useState<Product[]>([]);
  const [reports, setReports] = useState<OpnameEntry[]>([]);
  
  // Master Form State
  const [newProductName, setNewProductName] = useState("");
  const [newProductSku, setNewProductSku] = useState("");
  const [newProductStock, setNewProductStock] = useState<number | "">("");

  // Opname State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [showSystemStock, setShowSystemStock] = useState(false);
  const [physicalCount, setPhysicalCount] = useState<number | "">("");

  // --- Initialization ---
  useEffect(() => {
    const savedProducts = localStorage.getItem(STORAGE_KEY_PRODUCTS);
    const savedReports = localStorage.getItem(STORAGE_KEY_REPORTS);
    if (savedProducts) setProducts(JSON.parse(savedProducts));
    if (savedReports) setReports(JSON.parse(savedReports));
  }, []);

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_REPORTS, JSON.stringify(reports));
  }, [reports]);

  // --- Handlers ---
  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName || !newProductSku || newProductStock === "") {
      alert("Mohon lengkapi semua data barang.");
      return;
    }

    const newProduct: Product = {
      id: crypto.randomUUID(),
      name: newProductName,
      sku: newProductSku,
      systemStock: Number(newProductStock),
      createdAt: Date.now(),
    };

    setProducts([newProduct, ...products]);
    setNewProductName("");
    setNewProductSku("");
    setNewProductStock("");
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm("Hapus barang ini dari Master? Data laporan terkait juga mungkin terpengaruh.")) {
      setProducts(products.filter(p => p.id !== id));
      setReports(reports.filter(r => r.productId !== id));
    }
  };

  const handleSaveOpname = () => {
    if (!selectedProductId || physicalCount === "") {
      alert("Pilih barang dan masukkan stok fisik.");
      return;
    }

    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    const newEntry: OpnameEntry = {
      productId: selectedProductId,
      physicalStock: Number(physicalCount),
      systemStockAtTime: product.systemStock,
      timestamp: Date.now(),
    };

    // Remove old entry for same product if exists (update logic)
    const existing = reports.findIndex(r => r.productId === selectedProductId);
    if (existing !== -1) {
      const newReports = [...reports];
      newReports[existing] = newEntry;
      setReports(newReports);
    } else {
      setReports([newEntry, ...reports]);
    }

    // Reset workflow
    setSearchTerm("");
    setSelectedProductId(null);
    setPhysicalCount("");
    setShowSystemStock(false);
    alert("Berhasil menyimpan hasil opname.");
  };

  const handleClearAllData = () => {
    if (confirm("APAKAH ANDA YAKIN? Semua data master dan laporan akan DIBERSIHKAN secara permanen.")) {
      setProducts([]);
      setReports([]);
      localStorage.clear();
      alert("Data telah dibersihkan.");
    }
  };

  // --- Computed Data ---
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedProduct = products.find(p => p.id === selectedProductId);

  // --- UI Components ---
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto shadow-2xl relative overflow-hidden">
      {/* Header */}
      <header className="bg-brand-600 text-white p-6 pb-8 rounded-b-[2rem] shadow-lg sticky top-0 z-20">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
            <ClipboardList className="w-6 h-6" />
            Stock Opname
          </h1>
          {activeTab === "report" && products.length > 0 && (
            <button 
              onClick={handleClearAllData}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
              title="Reset Data"
            >
              <RotateCcw className="w-5 h-5 text-white/70" />
            </button>
          )}
        </div>
        <p className="text-white/70 text-xs font-medium">Manajemen Inventaris Pintar v1.0</p>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-5 -mt-4 z-10">
        <AnimatePresence mode="wait">
          {activeTab === "master" && (
            <motion.div
              key="master"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Add Form Card */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Tambah Barang Baru
                </h3>
                <form onSubmit={handleAddProduct} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 px-1">Nama Barang</label>
                    <input 
                      type="text" 
                      value={newProductName}
                      onChange={(e) => setNewProductName(e.target.value)}
                      placeholder="Contoh: Kopi Bubuk 200g"
                      className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-brand-600 outline-none text-sm transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 px-1">SKU / Kode</label>
                      <input 
                        type="text" 
                        value={newProductSku}
                        onChange={(e) => setNewProductSku(e.target.value)}
                        placeholder="KP-001"
                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-brand-600 outline-none text-sm transition-all"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 px-1">Stok Sistem</label>
                      <input 
                        type="number" 
                        value={newProductStock}
                        onChange={(e) => setNewProductStock(e.target.value === "" ? "" : Number(e.target.value))}
                        placeholder="0"
                        className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-brand-600 outline-none text-sm transition-all"
                      />
                    </div>
                  </div>
                  <button className="w-full bg-brand-600 text-white font-semibold py-3 rounded-xl shadow-md hover:bg-brand-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                    Simpan ke Master
                  </button>
                </form>
              </div>

              {/* Product List */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-500 px-2 uppercase tracking-widest">Daftar Barang ({products.length})</h3>
                {products.length === 0 ? (
                  <div className="bg-white/50 border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center">
                    <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm">Belum ada barang di sistem.</p>
                  </div>
                ) : (
                  products.map((p) => (
                    <motion.div 
                      layout
                      key={p.id} 
                      className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center group"
                    >
                      <div>
                        <h4 className="font-semibold text-slate-800 text-sm">{p.name}</h4>
                        <div className="flex gap-3 text-[10px] text-slate-400 font-mono mt-1">
                          <span>SKU: {p.sku}</span>
                          <span>STOK: {p.systemStock}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteProduct(p.id)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "opname" && (
            <motion.div
              key="opname"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Search Section */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Cari Nama atau SKU Barang..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    if (selectedProductId) setSelectedProductId(null);
                  }}
                  className="w-full pl-11 pr-4 py-4 bg-white shadow-sm border border-slate-200 rounded-2xl focus:ring-2 focus:ring-brand-600 outline-none text-sm"
                />
              </div>

              {/* Search Results Dropdown */}
              {searchTerm && !selectedProductId && (
                <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden max-h-60 overflow-y-auto">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map(p => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setSelectedProductId(p.id);
                          setSearchTerm(p.name);
                        }}
                        className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left border-b border-slate-50 last:border-0"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{p.name}</p>
                          <p className="text-xs text-slate-400 font-mono">SKU: {p.sku}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-slate-400 text-sm">Barang tidak ditemukan.</div>
                  )}
                </div>
              )}

              {/* Opname Action Card */}
              {selectedProduct && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white p-6 rounded-3xl shadow-lg border border-slate-100 space-y-6"
                >
                  <div className="text-center border-b border-slate-50 pb-4">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">Sedang Menghitung</p>
                    <h2 className="text-lg font-bold text-slate-800">{selectedProduct.name}</h2>
                    <p className="text-xs text-slate-400 font-mono">SKU: {selectedProduct.sku}</p>
                  </div>

                  {/* System Stock Revealer */}
                  <div className="p-4 bg-slate-50 rounded-2xl flex flex-col items-center gap-3">
                    <p className="text-xs text-slate-500 font-medium italic">Hitung fisik dulu baru lihat sistem!</p>
                    {showSystemStock ? (
                      <div className="text-center">
                        <span className="text-3xl font-black text-brand-600">{selectedProduct.systemStock}</span>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Stok di Sistem</p>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setShowSystemStock(true)}
                        className="px-4 py-2 bg-white text-slate-600 text-xs font-bold rounded-lg shadow-sm border border-slate-200 flex items-center gap-2 hover:bg-slate-100 active:scale-95 transition-all"
                      >
                        <Eye className="w-3 h-3" /> Lihat Stok Sistem
                      </button>
                    )}
                  </div>

                  {/* Physical Input */}
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block text-center">Jumlah Stok Fisik</label>
                    <input 
                      type="number"
                      autoFocus
                      placeholder="0"
                      value={physicalCount}
                      onChange={(e) => setPhysicalCount(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full text-center text-5xl font-black text-slate-800 py-4 bg-slate-50 rounded-3xl border-2 border-brand-600/10 focus:border-brand-600 focus:bg-white outline-none transition-all placeholder:text-slate-200"
                    />
                  </div>

                  <button 
                    onClick={handleSaveOpname}
                    className="w-full bg-brand-600 text-white font-bold py-4 rounded-2xl shadow-xl shadow-brand-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" /> Simpan Hasil Opname
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === "report" && (
            <motion.div
              key="report"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center px-1">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Ringkasan Hasil</h3>
                <span className="bg-brand-600/10 text-brand-600 text-[10px] font-bold px-2 py-1 rounded-md">{reports.length} Item</span>
              </div>

              {reports.length === 0 ? (
                <div className="bg-white border border-slate-100 rounded-3xl p-10 text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                    <FileText className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-slate-400 text-sm">Belum ada laporan opname.</p>
                  <button 
                    onClick={() => setActiveTab("opname")}
                    className="text-brand-600 text-xs font-bold hover:underline"
                  >
                    Mulai Opname Sekarang →
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {reports.map((report) => {
                    const product = products.find(p => p.id === report.productId);
                    if (!product) return null;
                    const diff = report.physicalStock - report.systemStockAtTime;
                    
                    let statusColor = "bg-blue-500";
                    let statusLabel = "Lebih";
                    let Icon = TrendingUp;

                    if (diff === 0) {
                      statusColor = "bg-green-500";
                      statusLabel = "Sesuai";
                      Icon = CheckCircle2;
                    } else if (diff < 0) {
                      statusColor = "bg-red-500";
                      statusLabel = "Kurang";
                      Icon = TrendingDown;
                    }

                    return (
                      <div key={report.productId} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-4 flex justify-between items-start border-b border-slate-50">
                          <div>
                            <h4 className="font-bold text-slate-800 text-sm">{product.name}</h4>
                            <p className="text-[10px] text-slate-400 font-mono">SKU: {product.sku}</p>
                          </div>
                          <span className={`${statusColor} text-white text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-tighter flex items-center gap-1`}>
                            <Icon className="w-3 h-3" /> {statusLabel}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-3 divide-x divide-slate-50">
                          <div className="p-3 text-center">
                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Sistem</p>
                            <p className="font-mono font-bold text-slate-600">{report.systemStockAtTime}</p>
                          </div>
                          <div className="p-3 text-center bg-slate-50/30">
                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Fisik</p>
                            <p className="font-mono font-bold text-brand-600">{report.physicalStock}</p>
                          </div>
                          <div className="p-3 text-center col-span-2 lg:col-span-1 border-t lg:border-t-0 border-slate-50">
                            <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Selisih</p>
                            <div className="flex items-center justify-center gap-1">
                              <span className={`text-lg font-black ${diff >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {diff > 0 ? `+${diff}` : diff}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navbar */}
      <nav className="bg-white border-t border-slate-100 p-3 pb-8 rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)] sticky bottom-0 z-20">
        <div className="flex justify-around items-center">
          <NavButton 
            active={activeTab === "master"} 
            onClick={() => setActiveTab("master")} 
            icon={<Package />} 
            label="Master" 
          />
          <NavButton 
            active={activeTab === "opname"} 
            onClick={() => setActiveTab("opname")} 
            icon={<ArrowRightLeft />} 
            label="Opname" 
            primary
          />
          <NavButton 
            active={activeTab === "report"} 
            onClick={() => setActiveTab("report")} 
            icon={<FileText />} 
            label="Laporan" 
          />
        </div>
      </nav>

      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-brand-600/5 rounded-full -mr-24 -mt-24 pointer-events-none" />
      <div className="absolute bottom-40 -left-10 w-24 h-24 bg-brand-600/5 rounded-full pointer-events-none" />
    </div>
  );
}

function NavButton({ active, onClick, icon, label, primary = false }: { 
  active: boolean; 
  onClick: () => void; 
  icon: React.ReactNode; 
  label: string;
  primary?: boolean;
}) {
  return (
    <button 
      onClick={onClick}
      className={`flex flex-col items-center gap-1 p-2 transition-all relative ${
        primary ? '-mt-10' : ''
      }`}
    >
      <div className={`
        flex items-center justify-center rounded-2xl transition-all duration-300
        ${primary 
          ? 'w-14 h-14 bg-brand-600 text-white shadow-xl shadow-brand-600/30 active:scale-90 scale-110 mb-1' 
          : `w-10 h-10 ${active ? 'bg-brand-600/10 text-brand-600' : 'text-slate-400'}`
        }
      `}>
        {icon}
      </div>
      <span className={`text-[10px] font-bold uppercase tracking-widest ${active ? 'text-brand-600' : 'text-slate-400'}`}>
        {label}
      </span>
      {active && !primary && (
        <motion.div 
          layoutId="nav-glow"
          className="absolute -top-1 w-1 h-1 bg-brand-600 rounded-full"
        />
      )}
    </button>
  );
}
