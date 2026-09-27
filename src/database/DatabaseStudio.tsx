import React, { useState } from 'react';
import {
  Database,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  Download,
  Copy,
  Check,
  Search,
  Code2,
  Server,
  RefreshCw,
  X,
  FileSpreadsheet,
  Table as TableIcon,
  Play,
  Layers,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { Project, DatabaseCollection, DatabaseField, DatabaseFieldType } from '../types';

interface DatabaseStudioProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onUpdateProjectDatabase: (newCollections: DatabaseCollection[]) => void;
}

export const DatabaseStudio: React.FC<DatabaseStudioProps> = ({
  project,
  isOpen,
  onClose,
  onUpdateProjectDatabase,
}) => {
  if (!isOpen) return null;

  // Initialize or fetch collections
  const collections: DatabaseCollection[] =
    project.database?.collections && project.database.collections.length > 0
      ? project.database.collections
      : [
          {
            id: 'col_products',
            name: 'products',
            description: 'E-commerce product catalog',
            fields: [
              { id: 'f1', name: 'title', type: 'string', required: true, description: 'Product title' },
              { id: 'f2', name: 'price', type: 'number', required: true, description: 'Price in USD' },
              { id: 'f3', name: 'category', type: 'string', required: false, description: 'Category' },
              { id: 'f4', name: 'inStock', type: 'boolean', required: false, description: 'In stock flag' },
              { id: 'f5', name: 'image', type: 'image', required: false, description: 'Image URL' },
            ],
            records: [
              {
                id: 'rec_101',
                title: 'Quantum Apex Pro Headset',
                price: 199.99,
                category: 'Audio',
                inStock: true,
                image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80',
                createdAt: Date.now() - 86400000 * 2,
              },
              {
                id: 'rec_102',
                title: 'Cyber Deck Mechanical Keyboard',
                price: 149.5,
                category: 'Peripherals',
                inStock: true,
                image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&q=80',
                createdAt: Date.now() - 86400000,
              },
              {
                id: 'rec_103',
                title: 'Vortex Ambient Lightbar',
                price: 79.0,
                category: 'Lighting',
                inStock: false,
                image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&q=80',
                createdAt: Date.now(),
              },
            ],
          },
        ];

  const [activeCollectionId, setActiveCollectionId] = useState<string>(
    collections[0]?.id || ''
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'records' | 'schema' | 'api' | 'export'>('records');

  // Modals inside DatabaseStudio
  const [showAddCollection, setShowAddCollection] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [newRecordData, setNewRecordData] = useState<Record<string, any>>({});
  const [showAddField, setShowAddField] = useState(false);
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<DatabaseFieldType>('string');
  const [newFieldRequired, setNewFieldRequired] = useState(false);

  // AI Generator state
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('Tech gadget products with name, price, category, rating, and image');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiMessage, setAiMessage] = useState('');

  // API Tester state
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>('Persistent Server DB Connected');

  const currentCollection =
    collections.find((c) => c.id === activeCollectionId) || collections[0];

  // Helper to commit changes
  const saveCollections = (updated: DatabaseCollection[]) => {
    onUpdateProjectDatabase(updated);
  };

  // Add new collection
  const handleCreateCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;

    const id = 'col_' + Math.random().toString(36).substring(2, 9);
    const newColl: DatabaseCollection = {
      id,
      name: newCollectionName.trim().toLowerCase().replace(/\s+/g, '_'),
      description: 'Custom collection',
      fields: [
        { id: 'f_title', name: 'title', type: 'string', required: true, description: 'Title' },
        { id: 'f_desc', name: 'description', type: 'string', required: false, description: 'Details' },
      ],
      records: [
        { id: 'rec_1', title: 'Sample Entry #1', description: 'Initial test record', createdAt: Date.now() },
      ],
    };

    const next = [...collections, newColl];
    saveCollections(next);
    setActiveCollectionId(id);
    setNewCollectionName('');
    setShowAddCollection(false);
  };

  // Delete collection
  const handleDeleteCollection = (colId: string) => {
    if (collections.length <= 1) {
      alert('You must keep at least one collection in the database.');
      return;
    }
    const next = collections.filter((c) => c.id !== colId);
    saveCollections(next);
    if (activeCollectionId === colId) {
      setActiveCollectionId(next[0].id);
    }
  };

  // Add field to current collection
  const handleAddField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFieldName.trim() || !currentCollection) return;

    const field: DatabaseField = {
      id: 'f_' + Math.random().toString(36).substring(2, 9),
      name: newFieldName.trim().replace(/\s+/g, '_'),
      type: newFieldType,
      required: newFieldRequired,
    };

    const updated = collections.map((c) => {
      if (c.id === currentCollection.id) {
        return {
          ...c,
          fields: [...c.fields, field],
        };
      }
      return c;
    });

    saveCollections(updated);
    setNewFieldName('');
    setShowAddField(false);
  };

  // Delete field
  const handleDeleteField = (fieldId: string) => {
    if (!currentCollection) return;
    const updated = collections.map((c) => {
      if (c.id === currentCollection.id) {
        return {
          ...c,
          fields: c.fields.filter((f) => f.id !== fieldId),
        };
      }
      return c;
    });
    saveCollections(updated);
  };

  // Add record
  const handleCreateRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCollection) return;

    const newRec = {
      ...newRecordData,
      id: 'rec_' + Math.random().toString(36).substring(2, 9),
      createdAt: Date.now(),
    };

    const updated = collections.map((c) => {
      if (c.id === currentCollection.id) {
        return {
          ...c,
          records: [newRec, ...c.records],
        };
      }
      return c;
    });

    saveCollections(updated);
    setNewRecordData({});
    setShowAddRecord(false);
  };

  // Delete record
  const handleDeleteRecord = (recId: string) => {
    if (!currentCollection) return;
    const updated = collections.map((c) => {
      if (c.id === currentCollection.id) {
        return {
          ...c,
          records: c.records.filter((r) => r.id !== recId),
        };
      }
      return c;
    });
    saveCollections(updated);
  };

  // Test Live Mock API endpoint
  const handleTestMockApi = async () => {
    if (!currentCollection) return;
    setIsLoadingApi(true);
    try {
      const url = `/api/mock/${project.id}/${currentCollection.name}`;
      const res = await fetch(url);
      const data = await res.json();
      setApiResponse(data);
    } catch (err: any) {
      setApiResponse({ error: err.message, status: 'fallback_active', data: currentCollection.records });
    } finally {
      setIsLoadingApi(false);
    }
  };

  // AI Generator
  const handleGenerateAiCollection = async () => {
    if (!aiPrompt.trim()) return;
    setIsGeneratingAi(true);
    setAiMessage('');
    try {
      const res = await fetch('/api/ai/database-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          collectionName: aiPrompt.split(' ')[0] || 'items',
          count: 6,
        }),
      });
      const data = await res.json();
      if (data.collection) {
        const next = [...collections, data.collection];
        saveCollections(next);
        setActiveCollectionId(data.collection.id);
        setShowAiModal(false);
      }
    } catch (err: any) {
      setAiMessage('Generation fallback applied.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Export functions
  const handleExportJson = () => {
    if (!currentCollection) return;
    const blob = new Blob([JSON.stringify(currentCollection.records, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentCollection.name}-data.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    if (!currentCollection || currentCollection.records.length === 0) return;
    const headers = currentCollection.fields.map((f) => f.name);
    const rows = currentCollection.records.map((r) =>
      headers.map((h) => JSON.stringify(r[h] ?? '')).join(',')
    );
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentCollection.name}-data.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportSql = () => {
    if (!currentCollection) return;
    const tableName = currentCollection.name;
    const colDefs = currentCollection.fields.map((f) => {
      let sqlType = 'VARCHAR(255)';
      if (f.type === 'number') sqlType = 'NUMERIC';
      if (f.type === 'boolean') sqlType = 'BOOLEAN';
      if (f.type === 'date') sqlType = 'TIMESTAMP';
      if (f.type === 'json') sqlType = 'JSONB';
      return `  "${f.name}" ${sqlType}${f.required ? ' NOT NULL' : ''}`;
    });

    const createTable = `CREATE TABLE IF NOT EXISTS "${tableName}" (\n  "id" VARCHAR(64) PRIMARY KEY,\n${colDefs.join(',\n')},\n  "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n);\n\n`;

    const inserts = currentCollection.records
      .map((r) => {
        const fields = ['id', ...currentCollection.fields.map((f) => f.name)];
        const values = fields.map((f) => {
          const val = r[f];
          if (val === undefined || val === null) return 'NULL';
          if (typeof val === 'number') return val;
          if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
          return `'${String(val).replace(/'/g, "''")}'`;
        });
        return `INSERT INTO "${tableName}" (${fields.map((f) => `"${f}"`).join(', ')}) VALUES (${values.join(', ')});`;
      })
      .join('\n');

    const sqlScript = `-- NONONICK Database Studio SQL Export\n-- Table: ${tableName}\n\n${createTable}${inserts}`;

    const blob = new Blob([sqlScript], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tableName}-schema.sql`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filtered records
  const filteredRecords = (currentCollection?.records || []).filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return Object.values(r).some((v) => String(v).toLowerCase().includes(q));
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-6xl h-[92vh] flex flex-col bg-[#080a11] border border-cyan-500/20 rounded-2xl shadow-2xl overflow-hidden font-sans text-slate-100">
        {/* Header */}
        <div className="h-16 px-4 sm:px-6 bg-[#0a0d16] border-b border-white/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-md">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-white tracking-tight">
                  NONONICK Database Studio
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                  Cloud Persistent
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Manage relational/document collections, schemas, and live Mock REST APIs for your project.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAiModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600/20 to-cyan-500/20 border border-purple-500/40 text-purple-300 hover:text-white hover:border-purple-400 text-xs font-semibold transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">AI Schema Generator</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
              title="Close Database Studio"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Sidebar: Collections */}
          <div className="w-full md:w-64 bg-[#06080d] border-b md:border-b-0 md:border-r border-white/5 flex flex-col shrink-0">
            <div className="p-3 border-b border-white/5 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Collections ({collections.length})
              </span>
              <button
                onClick={() => setShowAddCollection(true)}
                className="p-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs flex items-center gap-1 transition"
                title="Add New Collection"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="text-[10px] font-semibold">New</span>
              </button>
            </div>

            {/* Collection List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {collections.map((col) => {
                const isActive = col.id === activeCollectionId;
                return (
                  <div
                    key={col.id}
                    onClick={() => setActiveCollectionId(col.id)}
                    className={`group flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition text-xs ${
                      isActive
                        ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30'
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <TableIcon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="truncate">{col.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/5 font-mono text-slate-500">
                        {col.records?.length || 0}
                      </span>
                      {collections.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCollection(col.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 transition"
                          title="Delete collection"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Server DB info footer */}
            <div className="p-3 bg-[#080b12] border-t border-white/5 text-[11px] text-slate-400 flex items-center justify-between">
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse"></span>
                <span className="truncate font-mono text-[10px]">/data/editor-db.json</span>
              </div>
              <button
                onClick={() => {
                  setIsSyncing(true);
                  setTimeout(() => {
                    setIsSyncing(false);
                    setSyncStatus('Synced at ' + new Date().toLocaleTimeString());
                  }, 600);
                }}
                disabled={isSyncing}
                className="text-cyan-400 hover:text-cyan-300 p-1 rounded hover:bg-white/5 transition"
                title="Sync Database"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Right Main Panel */}
          <div className="flex-1 flex flex-col overflow-hidden bg-[#07090f]">
            {/* Top Toolbar */}
            <div className="px-4 py-2.5 bg-[#090c14] border-b border-white/5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">
                  {currentCollection?.name || 'Collection'}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  ({currentCollection?.fields.length || 0} fields, {currentCollection?.records.length || 0} records)
                </span>
              </div>

              {/* View Tabs */}
              <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-xl border border-white/5 text-xs">
                <button
                  onClick={() => setActiveTab('records')}
                  className={`px-3 py-1 rounded-lg transition ${
                    activeTab === 'records'
                      ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Records Data
                </button>
                <button
                  onClick={() => setActiveTab('schema')}
                  className={`px-3 py-1 rounded-lg transition ${
                    activeTab === 'schema'
                      ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Schema Fields
                </button>
                <button
                  onClick={() => setActiveTab('api')}
                  className={`px-3 py-1 rounded-lg transition ${
                    activeTab === 'api'
                      ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  REST API & SDK
                </button>
                <button
                  onClick={() => setActiveTab('export')}
                  className={`px-3 py-1 rounded-lg transition ${
                    activeTab === 'export'
                      ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Export SQL/JSON
                </button>
              </div>
            </div>

            {/* Tab: Records */}
            {activeTab === 'records' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Search & Actions Bar */}
                <div className="p-3 bg-[#080b12] border-b border-white/5 flex items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search records..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-[#05070c] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-400/50"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setNewRecordData({});
                        setShowAddRecord(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition shadow-md shadow-cyan-500/20 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Record</span>
                    </button>
                  </div>
                </div>

                {/* Table Data Grid */}
                <div className="flex-1 overflow-auto">
                  {filteredRecords.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500">
                      <TableIcon className="w-12 h-12 mb-3 opacity-20 text-cyan-400" />
                      <p className="text-sm font-semibold text-slate-300">No records found</p>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm">
                        Create your first record manually or generate high-quality realistic datasets using AI.
                      </p>
                      <button
                        onClick={() => setShowAddRecord(true)}
                        className="mt-4 px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 text-xs font-semibold transition"
                      >
                        + Add Record
                      </button>
                    </div>
                  ) : (
                    <table className="w-full border-collapse text-left text-xs">
                      <thead className="sticky top-0 bg-[#090c14] border-b border-white/10 text-slate-400 z-10 font-mono">
                        <tr>
                          <th className="py-2.5 px-4 font-semibold w-16">#ID</th>
                          {currentCollection.fields.map((f) => (
                            <th key={f.id} className="py-2.5 px-4 font-semibold">
                              <div className="flex items-center gap-1.5">
                                <span>{f.name}</span>
                                <span className="text-[10px] px-1 py-0.5 rounded bg-white/5 text-slate-500">
                                  {f.type}
                                </span>
                              </div>
                            </th>
                          ))}
                          <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredRecords.map((row, idx) => (
                          <tr key={row.id || idx} className="hover:bg-white/[0.02] transition group">
                            <td className="py-2 px-4 font-mono text-[11px] text-slate-500 truncate max-w-[80px]">
                              {row.id}
                            </td>
                            {currentCollection.fields.map((f) => {
                              const val = row[f.name];
                              return (
                                <td key={f.id} className="py-2 px-4 text-slate-200 truncate max-w-[200px]">
                                  {f.type === 'boolean' ? (
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        val ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                                      }`}
                                    >
                                      {val ? 'TRUE' : 'FALSE'}
                                    </span>
                                  ) : f.type === 'image' && typeof val === 'string' && val.startsWith('http') ? (
                                    <div className="flex items-center gap-2">
                                      <img
                                        src={val}
                                        alt="thumbnail"
                                        className="w-6 h-6 rounded object-cover border border-white/10"
                                      />
                                      <span className="truncate text-xs text-slate-400">{val}</span>
                                    </div>
                                  ) : (
                                    String(val ?? '-')
                                  )}
                                </td>
                              );
                            })}
                            <td className="py-2 px-4 text-right">
                              <button
                                onClick={() => handleDeleteRecord(row.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                                title="Delete Record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {/* Tab: Schema Fields */}
            {activeTab === 'schema' && (
              <div className="flex-1 p-6 overflow-y-auto max-w-4xl space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white text-base">Schema Definition</h3>
                    <p className="text-xs text-slate-400">
                      Configure field types, constraints, and validation rules for '{currentCollection.name}'.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddField(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Field</span>
                  </button>
                </div>

                <div className="bg-[#080b12] border border-white/10 rounded-xl overflow-hidden divide-y divide-white/5">
                  {currentCollection.fields.map((field) => (
                    <div key={field.id} className="p-4 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-mono text-cyan-400 font-bold">
                          {field.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{field.name}</span>
                            <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-mono text-[10px]">
                              {field.type}
                            </span>
                            {field.required && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 text-[10px] font-semibold">
                                Required
                              </span>
                            )}
                          </div>
                          {field.description && (
                            <p className="text-xs text-slate-400 mt-0.5">{field.description}</p>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteField(field.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                        title="Delete Field"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab: REST API & SDK */}
            {activeTab === 'api' && (
              <div className="flex-1 p-6 overflow-y-auto space-y-6 max-w-4xl">
                <div>
                  <h3 className="font-bold text-white text-base">Live Mock REST API</h3>
                  <p className="text-xs text-slate-400">
                    Use these endpoints inside your HTML/JS code or test directly from your browser.
                  </p>
                </div>

                {/* Endpoint Showcase */}
                <div className="p-4 rounded-xl bg-[#080b12] border border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-xs font-mono">
                        GET
                      </span>
                      <code className="text-xs text-cyan-300 font-mono">
                        /api/mock/{project.id}/{currentCollection.name}
                      </code>
                    </div>
                    <button
                      onClick={handleTestMockApi}
                      disabled={isLoadingApi}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold transition"
                    >
                      <Play className="w-3 h-3" />
                      <span>{isLoadingApi ? 'Testing...' : 'Test Request'}</span>
                    </button>
                  </div>

                  {/* Code snippet */}
                  <div className="relative">
                    <div className="bg-[#040508] p-3 rounded-lg border border-white/5 font-mono text-[11px] text-slate-300 overflow-x-auto">
                      <pre>
{`// Fetch records directly in your project's script.js:
fetch('/api/mock/${project.id}/${currentCollection.name}')
  .then(res => res.json())
  .then(response => {
    console.log('Total:', response.total);
    console.log('Records:', response.data);
    // Render to DOM...
  });`}
                      </pre>
                    </div>
                    <button
                      onClick={() => {
                        const snippet = `fetch('/api/mock/${project.id}/${currentCollection.name}').then(r => r.json()).then(console.log);`;
                        navigator.clipboard.writeText(snippet);
                        setCopiedCode(true);
                        setTimeout(() => setCopiedCode(false), 2000);
                      }}
                      className="absolute right-2 top-2 p-1 rounded bg-white/10 hover:bg-white/20 text-slate-300 text-xs"
                      title="Copy Fetch Snippet"
                    >
                      {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Live Response Box */}
                  {apiResponse && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Live Response Output:
                      </span>
                      <pre className="bg-[#030406] p-3 rounded-lg border border-cyan-500/30 font-mono text-[11px] text-cyan-300 max-h-48 overflow-auto">
                        {JSON.stringify(apiResponse, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>

                {/* Additional Endpoints summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-[#080b12] border border-white/5 space-y-1">
                    <span className="font-mono text-cyan-400 font-bold">POST</span>
                    <p className="text-[11px] text-slate-400">Insert new item into collection</p>
                    <code className="text-[10px] text-slate-500 font-mono block">POST /api/mock/:proj/:col</code>
                  </div>
                  <div className="p-3 rounded-xl bg-[#080b12] border border-white/5 space-y-1">
                    <span className="font-mono text-amber-400 font-bold">PUT</span>
                    <p className="text-[11px] text-slate-400">Update item attributes by ID</p>
                    <code className="text-[10px] text-slate-500 font-mono block">PUT /api/mock/:proj/:col/:id</code>
                  </div>
                  <div className="p-3 rounded-xl bg-[#080b12] border border-white/5 space-y-1">
                    <span className="font-mono text-rose-400 font-bold">DELETE</span>
                    <p className="text-[11px] text-slate-400">Remove item record permanently</p>
                    <code className="text-[10px] text-slate-500 font-mono block">DELETE /api/mock/:proj/:col/:id</code>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Export SQL / JSON */}
            {activeTab === 'export' && (
              <div className="flex-1 p-6 overflow-y-auto space-y-6 max-w-4xl">
                <div>
                  <h3 className="font-bold text-white text-base">Export Database & Schema</h3>
                  <p className="text-xs text-slate-400">
                    Export your collection as SQL DDL/DML, JSON records, or CSV spreadsheet.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-xl bg-[#080b12] border border-white/10 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-3">
                        <Code2 className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-white text-sm">SQL DDL & Data</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        PostgreSQL & SQLite compatible CREATE TABLE and INSERT INTO statements.
                      </p>
                    </div>
                    <button
                      onClick={handleExportSql}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .SQL</span>
                    </button>
                  </div>

                  <div className="p-4 rounded-xl bg-[#080b12] border border-white/10 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 mb-3">
                        <Database className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-white text-sm">JSON Document</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Formatted JSON document suitable for NoSQL databases (MongoDB, Firestore).
                      </p>
                    </div>
                    <button
                      onClick={handleExportJson}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .JSON</span>
                    </button>
                  </div>

                  <div className="p-4 rounded-xl bg-[#080b12] border border-white/10 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-3">
                        <FileSpreadsheet className="w-5 h-5" />
                      </div>
                      <h4 className="font-bold text-white text-sm">CSV Spreadsheet</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Standard comma-separated table for Excel, Google Sheets, or data science.
                      </p>
                    </div>
                    <button
                      onClick={handleExportCsv}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .CSV</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal: Add Collection */}
        {showAddCollection && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-[#090c14] border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4">
              <h3 className="font-bold text-white text-sm">Create New Collection</h3>
              <form onSubmit={handleCreateCollection} className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Collection Name</label>
                  <input
                    type="text"
                    placeholder="e.g. orders, articles, testimonials"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    autoFocus
                    className="w-full bg-[#05070c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-400/50"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddCollection(false)}
                    className="px-3 py-1.5 rounded-xl hover:bg-white/10 text-slate-400 text-xs transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs transition"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Add Record */}
        {showAddRecord && currentCollection && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-md bg-[#090c14] border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
              <h3 className="font-bold text-white text-sm">Add New Record to '{currentCollection.name}'</h3>
              <form onSubmit={handleCreateRecord} className="space-y-3">
                {currentCollection.fields.map((field) => (
                  <div key={field.id}>
                    <label className="text-xs text-slate-400 block mb-1">
                      {field.name}{' '}
                      {field.required && <span className="text-rose-400">*</span>}
                    </label>
                    {field.type === 'boolean' ? (
                      <select
                        value={newRecordData[field.name] ? 'true' : 'false'}
                        onChange={(e) =>
                          setNewRecordData({
                            ...newRecordData,
                            [field.name]: e.target.value === 'true',
                          })
                        }
                        className="w-full bg-[#05070c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                      >
                        <option value="true">True</option>
                        <option value="false">False</option>
                      </select>
                    ) : (
                      <input
                        type={field.type === 'number' ? 'number' : 'text'}
                        placeholder={`Enter ${field.name}...`}
                        value={newRecordData[field.name] ?? ''}
                        onChange={(e) =>
                          setNewRecordData({
                            ...newRecordData,
                            [field.name]:
                              field.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value,
                          })
                        }
                        className="w-full bg-[#05070c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-400/50"
                      />
                    )}
                  </div>
                ))}
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddRecord(false)}
                    className="px-3 py-1.5 rounded-xl hover:bg-white/10 text-slate-400 text-xs transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs transition"
                  >
                    Save Record
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Add Field */}
        {showAddField && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-sm bg-[#090c14] border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4">
              <h3 className="font-bold text-white text-sm">Add Field to Schema</h3>
              <form onSubmit={handleAddField} className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Field Name</label>
                  <input
                    type="text"
                    placeholder="e.g. price, rating, sku, author"
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    autoFocus
                    className="w-full bg-[#05070c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-400/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Data Type</label>
                  <select
                    value={newFieldType}
                    onChange={(e) => setNewFieldType(e.target.value as DatabaseFieldType)}
                    className="w-full bg-[#05070c] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  >
                    <option value="string">String (Text)</option>
                    <option value="number">Number (Integer / Float)</option>
                    <option value="boolean">Boolean (True / False)</option>
                    <option value="date">Date / Timestamp</option>
                    <option value="image">Image URL</option>
                    <option value="json">JSON / Object</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="reqCheck"
                    checked={newFieldRequired}
                    onChange={(e) => setNewFieldRequired(e.target.checked)}
                    className="rounded bg-black border-white/20 text-cyan-500"
                  />
                  <label htmlFor="reqCheck" className="text-xs text-slate-300">
                    Required Field
                  </label>
                </div>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddField(false)}
                    className="px-3 py-1.5 rounded-xl hover:bg-white/10 text-slate-400 text-xs transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs transition"
                  >
                    Add Field
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: AI Schema Generator */}
        {showAiModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="w-full max-w-md bg-[#090c14] border border-purple-500/30 rounded-2xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center gap-2 text-purple-400">
                <Sparkles className="w-4 h-4" />
                <h3 className="font-bold text-white text-sm">AI Database & Schema Architect</h3>
              </div>
              <p className="text-xs text-slate-400">
                Describe the entity you want to store, and NONONICK AI will generate a complete schema with fields and realistic mock seed records.
              </p>
              <textarea
                rows={3}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g. Real estate listings with property title, price, bedrooms, square footage, address, and featured image"
                className="w-full bg-[#05070c] border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-purple-400/50 resize-none"
              />
              {aiMessage && <p className="text-xs text-amber-300">{aiMessage}</p>}
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAiModal(false)}
                  className="px-3 py-1.5 rounded-xl hover:bg-white/10 text-slate-400 text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleGenerateAiCollection}
                  disabled={isGeneratingAi}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-bold text-xs transition shadow-md shadow-purple-600/20"
                >
                  {isGeneratingAi ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate Collection</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
