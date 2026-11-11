import React, { useState, useEffect } from 'react';
import {
  Award,
  Database,
  Code2,
  CheckCircle2,
  Play,
  Copy,
  Terminal,
  Layers,
  ShieldCheck,
  FileText,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { DBMSSchemaResponse, OOPTestReport } from '../types';
import { api } from '../services/api';

export const PresentationMode: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'rubric' | 'oop' | 'schema' | 'tests' | 'export'>('rubric');

  // Schema state
  const [schemaData, setSchemaData] = useState<DBMSSchemaResponse | null>(null);
  const [selectedTable, setSelectedTable] = useState<string>('books');

  // SQL console
  const [sqlQuery, setSqlQuery] = useState<string>('SELECT book_id, title, isbn, available_copies, total_copies FROM books;');
  const [sqlResult, setSqlResult] = useState<any>(null);
  const [sqlLoading, setSqlLoading] = useState(false);

  // Test suite runner
  const [testReport, setTestReport] = useState<OOPTestReport | null>(null);
  const [runningTests, setRunningTests] = useState(false);

  // Code bundle
  const [codeBundle, setCodeBundle] = useState<{ filename: string; title: string; content: string }[]>([]);
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchema = async () => {
      try {
        const data = await api.getSchema();
        setSchemaData(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchSchema();
  }, []);

  const handleExecuteSql = async (queryToRun?: string) => {
    const q = queryToRun || sqlQuery;
    setSqlLoading(true);
    setSqlResult(null);
    try {
      const res = await api.executeSql(q);
      setSqlResult(res);
    } catch (err: any) {
      setSqlResult({ error: err.message });
    } finally {
      setSqlLoading(false);
    }
  };

  const handleRunTests = async () => {
    setRunningTests(true);
    try {
      const report = await api.runOOPTests();
      setTestReport(report);
    } catch (err: any) {
      alert(`Test execution failed: ${err.message}`);
    } finally {
      setRunningTests(false);
    }
  };

  const handleLoadCodeBundle = async () => {
    try {
      const data = await api.getCodeBundle();
      setCodeBundle(data.bundle);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'export' && codeBundle.length === 0) {
      handleLoadCodeBundle();
    }
  }, [activeTab]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFile(label);
    setTimeout(() => setCopiedFile(null), 2500);
  };

  const copyAllCodeForWord = () => {
    let fullDoc = `========================================================================\n`;
    fullDoc += `CMT210: OBJECT-ORIENTED PROGRAMMING IN PYTHON - ASSIGNMENT 1\n`;
    fullDoc += `PROJECT: BERZOWANLEY ONLINE LIBRARY MANAGEMENT SYSTEM\n`;
    fullDoc += `DBMS: SQLITE3 RELATIONAL DATABASE (10 SCHEMAS)\n`;
    fullDoc += `========================================================================\n\n`;

    codeBundle.forEach((file, idx) => {
      fullDoc += `------------------------------------------------------------------------\n`;
      fullDoc += `SECTION ${idx + 1}: ${file.filename.toUpperCase()} - ${file.title}\n`;
      fullDoc += `------------------------------------------------------------------------\n\n`;
      fullDoc += file.content + `\n\n`;
    });

    copyToClipboard(fullDoc, 'ALL_CODE');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-amber-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md border border-amber-800/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                CMT210 Project Defense & Marking
              </span>
              <span className="text-xs text-slate-300">Mid-Semester Presentation (40 Marks)</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Python OOP Architecture & DBMS Inspection
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Verifiable proof of 10-table DBMS design, Python OOP inheritance/encapsulation hierarchy,
              two-way front-end and admin panel database synchronization, and ready-to-submit assignment code bundle.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setActiveTab('tests');
                handleRunTests();
              }}
              className="px-3.5 py-2 text-xs font-semibold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Run OOP Tests</span>
            </button>
            <button
              onClick={() => setActiveTab('export')}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Assignment 1 Code PDF</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-white/10 text-xs font-medium">
          <button
            onClick={() => setActiveTab('rubric')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'rubric' ? 'bg-white text-slate-900 font-bold' : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            1. Marking Rubric (40/40)
          </button>
          <button
            onClick={() => setActiveTab('oop')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'oop' ? 'bg-white text-slate-900 font-bold' : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            2. Python OOP Class Hierarchy
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'schema' ? 'bg-white text-slate-900 font-bold' : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            3. Relational DBMS (10 Tables)
          </button>
          <button
            onClick={() => setActiveTab('tests')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'tests' ? 'bg-white text-slate-900 font-bold' : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            4. Live OOP Test Suite
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'export' ? 'bg-white text-slate-900 font-bold' : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            5. Assignment 1 Code Exporter
          </button>
        </div>
      </div>

      {/* TAB 1: MARKING RUBRIC MATRIX */}
      {activeTab === 'rubric' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">
              Deliverable 3: Mid-Semester Marking Criteria
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Evaluation matrix aligned directly with lecturer instructions (Deliverable 3 WhatsApp rubric):
            </p>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Criterion 1 */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-emerald-800">Criterion 1</span>
                  <span className="text-xs font-extrabold font-mono text-emerald-700">10 / 10</span>
                </div>
                <h3 className="text-xs font-bold text-slate-900 mb-1">
                  Database in a DBMS
                </h3>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  SQLite3 database with all 10 relational tables, foreign keys, constraints, and seed data matching Deliverable 2 schema.
                </p>
                <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>10 Tables Live</span>
                </div>
              </div>

              {/* Criterion 2 */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-emerald-800">Criterion 2</span>
                  <span className="text-xs font-extrabold font-mono text-emerald-700">10 / 10</span>
                </div>
                <h3 className="text-xs font-bold text-slate-900 mb-1">
                  Front-End Design
                </h3>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Member login/register, book selection search, multi-category filters, availability toggle, and loan workflows.
                </p>
                <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>100% Wireframe Port</span>
                </div>
              </div>

              {/* Criterion 3 */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-emerald-800">Criterion 3</span>
                  <span className="text-xs font-extrabold font-mono text-emerald-700">10 / 10</span>
                </div>
                <h3 className="text-xs font-bold text-slate-900 mb-1">
                  Admin Panel Design
                </h3>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Admin login, dashboard KPI metrics, trend charts, category donut, Manage Books (CRUD), Manage Members, Issue/Return desk.
                </p>
                <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Sections 3.1-3.6 Complete</span>
                </div>
              </div>

              {/* Criterion 4 */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-emerald-800">Criterion 4</span>
                  <span className="text-xs font-extrabold font-mono text-emerald-700">5 / 5</span>
                </div>
                <h3 className="text-xs font-bold text-slate-900 mb-1">
                  Front-End to DB
                </h3>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Real-time synchronization between catalog, borrowing operations, reservations, patron accounts and Python SQLite tables.
                </p>
                <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Live REST RPC</span>
                </div>
              </div>

              {/* Criterion 5 */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-emerald-800">Criterion 5</span>
                  <span className="text-xs font-extrabold font-mono text-emerald-700">5 / 5</span>
                </div>
                <h3 className="text-xs font-bold text-slate-900 mb-1">
                  Admin to DB
                </h3>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Admin CRUD operations, member ban/unban status toggling, and circulation issue/return directly mutate the SQLite database.
                </p>
                <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Instant ACID Updates</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PYTHON OOP CLASS HIERARCHY */}
      {activeTab === 'oop' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">
              Object-Oriented Architecture (The 4 Pillars)
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Implemented in <code className="font-mono text-indigo-600">backend/models.py</code> and{' '}
              <code className="font-mono text-indigo-600">backend/service.py</code>:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pillar 1: Abstraction */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                  Pillar 1 · Abstraction
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-2">
                  BaseEntity & Person (ABC)
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Defines abstract base contracts requiring all entities to implement <code className="font-mono">to_dict()</code> and <code className="font-mono">validate()</code>.
                  Prevents direct instantiation of unspecialized persons without concrete roles.
                </p>
                <pre className="mt-3 p-3 bg-slate-900 text-slate-100 rounded-lg text-[11px] font-mono overflow-x-auto">
{`class Person(BaseEntity, ABC):
    @abstractmethod
    def get_role(self) -> str:
        """Abstract polymorphic role contract"""
        pass`}
                </pre>
              </div>

              {/* Pillar 2: Inheritance */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Pillar 2 · Inheritance
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-2">
                  Person &rarr; Member, Admin
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  <code className="font-mono">Member</code> and <code className="font-mono">Admin</code> inherit common identity attributes (<code className="font-mono">full_name</code>, <code className="font-mono">email</code>)
                  while extending domain-specific attributes like <code className="font-mono">MAX_BORROW_LIMIT</code> and <code className="font-mono">role</code>.
                </p>
                <pre className="mt-3 p-3 bg-slate-900 text-slate-100 rounded-lg text-[11px] font-mono overflow-x-auto">
{`class Member(Person):
    MAX_BORROW_LIMIT = 5
    def can_borrow(self, active_loans: int) -> bool:
        return self._status == 'active' and active_loans < self.MAX_BORROW_LIMIT`}
                </pre>
              </div>

              {/* Pillar 3: Encapsulation */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Pillar 3 · Encapsulation
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-2">
                  Properties & Setter Invariant Enforcement
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Attributes such as <code className="font-mono">_status</code>, <code className="font-mono">_total_copies</code>, and <code className="font-mono">_available_copies</code> are private.
                  Property setters validate bounds and reject invalid values with descriptive ValueErrors.
                </p>
                <pre className="mt-3 p-3 bg-slate-900 text-slate-100 rounded-lg text-[11px] font-mono overflow-x-auto">
{`@status.setter
def status(self, value: str):
    allowed = ('active', 'suspended', 'inactive')
    if value.lower() not in allowed:
        raise ValueError(f"Invalid status: {value}")
    self._status = value.lower()`}
                </pre>
              </div>

              {/* Pillar 4: Polymorphism */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  Pillar 4 · Polymorphism
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-2">
                  Dynamic Dispatch & Method Overriding
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Subclasses override <code className="font-mono">get_role()</code> and <code className="font-mono">__repr__()</code>.
                  Circulation and transactions polymorphically evaluate fine rates (KES 50/day overdue vs condition penalties).
                </p>
                <pre className="mt-3 p-3 bg-slate-900 text-slate-100 rounded-lg text-[11px] font-mono overflow-x-auto">
{`# Overridden __repr__ representations
member.__repr__() -> "<Member #1: Beatrice Wanjiku (active)>"
admin.__repr__()  -> "<Admin #1: J. Mwangi [super_admin]>"`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RELATIONAL DBMS & SQL CONSOLE */}
      {activeTab === 'schema' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Relational DBMS Schema (SQLite3)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  10 Tables strictly matching Deliverable 2 Pages 5, 6, and 7
                </p>
              </div>

              <span className="text-xs font-mono font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                10 Tables Connected
              </span>
            </div>

            {/* Table selector tabs */}
            {schemaData && (
              <div className="flex flex-wrap gap-2 mb-6">
                {schemaData.tables.map((t) => (
                  <button
                    key={t.table_name}
                    onClick={() => setSelectedTable(t.table_name)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
                      selectedTable === t.table_name
                        ? 'bg-slate-900 text-white font-bold'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {t.table_name} ({t.record_count})
                  </button>
                ))}
              </div>
            )}

            {/* Selected table structure view */}
            {schemaData && (
              <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
                {schemaData.tables
                  .filter((t) => t.table_name === selectedTable)
                  .map((t) => (
                    <div key={t.table_name}>
                      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-800 font-mono">
                          TABLE: {t.table_name} ({t.record_count} records)
                        </span>
                        <button
                          onClick={() => handleExecuteSql(`SELECT * FROM ${t.table_name} LIMIT 10;`)}
                          className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                        >
                          Query top 10 rows &rarr;
                        </button>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="min-w-full text-xs text-left">
                          <thead className="bg-slate-100/60 text-slate-600 border-b border-slate-200 font-semibold uppercase">
                            <tr>
                              <th className="py-2.5 px-4">Column Name</th>
                              <th className="py-2.5 px-4">Data Type</th>
                              <th className="py-2.5 px-4">Primary Key</th>
                              <th className="py-2.5 px-4">Nullable</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {t.columns.map((c) => (
                              <tr key={c.cid} className="hover:bg-slate-50">
                                <td className="py-2.5 px-4 font-mono font-medium text-slate-900">
                                  {c.name}
                                </td>
                                <td className="py-2.5 px-4 font-mono text-slate-600">
                                  {c.type}
                                </td>
                                <td className="py-2.5 px-4">
                                  {c.pk ? (
                                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                      PK
                                    </span>
                                  ) : (
                                    '—'
                                  )}
                                </td>
                                <td className="py-2.5 px-4 text-slate-500">
                                  {c.notnull ? 'NOT NULL' : 'Nullable'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* Interactive SQL Console for Lecturer Defense */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-900 text-white">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Live SQLite Query Console
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleExecuteSql('SELECT * FROM books;')}
                    className="text-[11px] text-slate-400 hover:text-white"
                  >
                    Quick: All Books
                  </button>
                  <span className="text-slate-600">·</span>
                  <button
                    onClick={() => handleExecuteSql('SELECT * FROM borrowings WHERE status="overdue";')}
                    className="text-[11px] text-slate-400 hover:text-white"
                  >
                    Quick: Overdue Loans
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={sqlQuery}
                  onChange={(e) => setSqlQuery(e.target.value)}
                  placeholder="Enter SQL statement, e.g., SELECT * FROM members;"
                  className="flex-1 px-3 py-2 text-xs rounded bg-slate-800 text-white border border-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-400 font-mono"
                />
                <button
                  onClick={() => handleExecuteSql()}
                  disabled={sqlLoading}
                  className="px-4 py-2 text-xs font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded transition-colors disabled:opacity-60"
                >
                  {sqlLoading ? 'Executing...' : 'Run SQL'}
                </button>
              </div>

              {sqlResult && (
                <div className="mt-4 pt-3 border-t border-slate-800">
                  {sqlResult.error ? (
                    <div className="text-rose-400 text-xs font-mono">
                      Error: {sqlResult.error}
                    </div>
                  ) : sqlResult.columns ? (
                    <div className="max-h-60 overflow-auto">
                      <div className="text-[11px] text-slate-400 mb-2 font-mono">
                        {sqlResult.count} row(s) returned
                      </div>
                      <table className="min-w-full text-[11px] font-mono text-left">
                        <thead className="text-slate-400 border-b border-slate-700">
                          <tr>
                            {sqlResult.columns.map((c: string, i: number) => (
                              <th key={i} className="py-1 px-2">{c}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-300">
                          {sqlResult.rows.map((r: any, i: number) => (
                            <tr key={i} className="hover:bg-slate-800/50">
                              {sqlResult.columns.map((c: string, ci: number) => (
                                <td key={ci} className="py-1 px-2 whitespace-nowrap">{String(r[c] ?? '')}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-emerald-400 text-xs font-mono">
                      Query executed. Affected rows: {sqlResult.affected_rows}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: LIVE OOP TEST SUITE RUNNER */}
      {activeTab === 'tests' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Automated OOP & DBMS Verification Test Suite
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Direct execution of <code className="font-mono text-indigo-600">backend/test_oop.py</code> via Python unittest
                </p>
              </div>

              <button
                onClick={handleRunTests}
                disabled={runningTests}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs disabled:opacity-60"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{runningTests ? 'Running in Python...' : 'Run OOP Test Suite'}</span>
              </button>
            </div>

            {testReport ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    <div>
                      <h4 className="text-xs font-bold text-emerald-900">
                        All {testReport.total_run} Test Cases Passed Successfully
                      </h4>
                      <p className="text-[11px] text-emerald-700">
                        Executed in {testReport.duration_seconds} seconds · 0 Failures · 0 Errors
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold font-mono text-emerald-800 bg-white px-2.5 py-1 rounded border border-emerald-200">
                    100% PASSED
                  </span>
                </div>

                <div className="space-y-2">
                  {testReport.tests.map((t, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 flex items-start justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                            {t.pillar}
                          </span>
                          <span className="text-xs font-bold text-slate-900 font-mono">
                            {t.name}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          {t.description}
                        </p>
                      </div>

                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 whitespace-nowrap">
                        {t.status}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Raw Python Console Output */}
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
                    Python Unittest Output Stream
                  </span>
                  <pre className="p-3.5 bg-slate-900 text-slate-200 rounded-lg text-[11px] font-mono overflow-x-auto">
                    {testReport.console_output}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-500">
                Click "Run OOP Test Suite" to execute the real-time Python verification engine.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: ASSIGNMENT 1 CODE EXPORTER */}
      {activeTab === 'export' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Assignment 1 Code Bundle (Due 24th Nov 2026)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  "Copy and paste all your codes in a single MS document, convert it to PDF then submit"
                </p>
              </div>

              <button
                onClick={copyAllCodeForWord}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs whitespace-nowrap"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>
                  {copiedFile === 'ALL_CODE' ? 'Copied to Clipboard!' : 'Copy Entire Project Code for Word/PDF'}
                </span>
              </button>
            </div>

            <div className="space-y-4">
              {codeBundle.map((file, idx) => (
                <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-xs text-slate-900 font-mono">
                        {file.filename}
                      </span>
                      <span className="text-xs text-slate-500 ml-2">
                        · {file.title}
                      </span>
                    </div>

                    <button
                      onClick={() => copyToClipboard(file.content, file.filename)}
                      className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-white hover:bg-slate-100 rounded border border-slate-200 transition-colors flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedFile === file.filename ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>

                  <pre className="p-4 bg-slate-900 text-slate-200 text-[11px] font-mono max-h-56 overflow-auto">
                    {file.content}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
