import { useState, useEffect, useMemo } from 'react';
import api from '../../api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { 
  FileText, Download, Filter, 
  BookOpen, Users, Clock, Loader2, Calendar
} from 'lucide-react';

const Reports = () => {
  const [data, setData] = useState({ timetable: [], workloads: [] });
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [deptFilter, setDeptFilter] = useState('');
  const [facultyFilter, setFacultyFilter] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get('/timetable/reports');
      setData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const { workloads, timetable } = data;

  // Process Data for Charts
  const subjectPerDeptData = useMemo(() => {
    const counts = {};
    workloads.forEach(w => {
      const dept = w.facultyId?.department || 'Other';
      counts[dept] = (counts[dept] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [workloads]);

  const workloadSummaryData = useMemo(() => {
    const summary = {};
    workloads.forEach(w => {
      const name = w.facultyId?.name || 'Unknown';
      const dept = w.facultyId?.department || 'Other';
      if (!deptFilter || dept === deptFilter) {
        summary[name] = (summary[name] || 0) + w.assignedHours;
      }
    });
    return Object.entries(summary)
      .map(([name, hours]) => ({ name, hours }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 10); // Show top 10
  }, [workloads, deptFilter]);

  const stats = useMemo(() => ({
    totalHours: workloads.reduce((sum, w) => sum + w.assignedHours, 0),
    totalAssignments: workloads.length,
    distinctFaculty: new Set(workloads.map(w => w.facultyId?._id)).size,
    distinctSubjects: new Set(workloads.map(w => w.subjectId?._id)).size
  }), [workloads]);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const filteredDetailedWorkloads = useMemo(() => {
    return workloads.filter(w => {
      const matchesDept = !deptFilter || w.facultyId?.department === deptFilter;
      const matchesFaculty = !facultyFilter || w.facultyId?.name === facultyFilter;
      return matchesDept && matchesFaculty;
    });
  }, [workloads, deptFilter, facultyFilter]);

  const departments = [...new Set(workloads.map(w => w.facultyId?.department).filter(Boolean))];
  const faculties = [...new Set(workloads.map(w => w.facultyId?.name).filter(Boolean))];

  if (isLoading) {
    return (
      <div className="loading-state">
        <Loader2 className="animate-spin" size={48} />
        <p>Crunching institutional data...</p>
      </div>
    );
  }

  return (
    <div className="reports-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytical Reports</h1>
          <p className="page-subtitle">Visual overview of faculty distribution and workload efficiency.</p>
        </div>
        <button className="btn btn-secondary" onClick={() => window.print()}>
          <Download size={18} /> Export Performance Report
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><Clock size={24} /></div>
          <div className="stat-info">
            <span className="stat-label">Total Allocated Hours</span>
            <span className="stat-value">{stats.totalHours} hrs</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><BookOpen size={24} /></div>
          <div className="stat-info">
            <span className="stat-label">Subjects Covered</span>
            <span className="stat-value">{stats.distinctSubjects}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><Users size={24} /></div>
          <div className="stat-info">
            <span className="stat-label">Active Faculty</span>
            <span className="stat-value">{stats.distinctFaculty}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><Calendar size={24} /></div>
          <div className="stat-info">
            <span className="stat-label">Total Assignments</span>
            <span className="stat-value">{stats.totalAssignments}</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        <div className="report-section">
          <div className="glass-card chart-container">
            <h3 className="chart-title">Faculty Workload Distribution</h3>
            <div style={{ height: '300px', width: '100%' }}>
              <ResponsiveContainer>
                <BarChart data={workloadSummaryData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis />
                  <Tooltip cursor={{ fill: '#F1F5F9' }} />
                  <Bar dataKey="hours" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="report-section">
          <div className="glass-card chart-container">
            <h3 className="chart-title">Subjects per Department</h3>
            <div style={{ height: '300px', width: '100%' }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie 
                    data={subjectPerDeptData} 
                    innerRadius={60} 
                    outerRadius={80} 
                    paddingAngle={5} 
                    dataKey="value"
                  >
                    {subjectPerDeptData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="filters-card glass-panel" style={{ marginTop: '2rem' }}>
        <div className="filter-group">
          <Filter size={16} />
          <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
            <option value="">All Departments</option>
            {departments.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <Users size={16} />
          <select value={facultyFilter} onChange={e => setFacultyFilter(e.target.value)}>
            <option value="">All Faculty</option>
            {faculties.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
      </div>

      <div className="report-section">
        <div className="table-container" style={{ marginTop: '1.5rem' }}>
          <h3 style={{ padding: '1.5rem', margin: 0, fontSize: '1.1rem', color: '#1E293B' }}>Detailed Allocation Ledger</h3>
          <table>
            <thead>
              <tr>
                <th>Faculty Name</th>
                <th>Department</th>
                <th>Subject</th>
                <th>Assigned Hours</th>
              </tr>
            </thead>
            <tbody>
              {filteredDetailedWorkloads.map((w, idx) => (
                <tr key={idx} className="row-hover">
                  <td style={{ fontWeight: 700 }}>{w.facultyId?.name}</td>
                  <td><span className="dept-tag">{w.facultyId?.department}</span></td>
                  <td style={{ fontWeight: 600, color: '#475569' }}>{w.subjectId?.subjectName}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div className="mini-progress-track">
                        <div className="mini-progress-bar" style={{ width: `${(w.assignedHours / 20) * 100}%` }}></div>
                      </div>
                      <span style={{ fontWeight: 700 }}>{w.assignedHours}h</span>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredDetailedWorkloads.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8' }}>No records match your filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .reports-page { animation: fadeIn 0.3s ease-out; }
        .page-subtitle { color: var(--text-muted); margin-top: 0.25rem; font-size: 0.95rem; }
        
        .loading-state { height: 60vh; display: flex; flex-direction: column; align-items: center; justify-content: center; color: #64748B; gap: 1rem; }

        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1.5rem; margin-top: 2rem; }
        .stat-card { 
          background: white; padding: 1.5rem; border-radius: 16px; border: 1px solid var(--border);
          display: flex; align-items: center; gap: 1.25rem; transition: transform 0.2s;
        }
        .stat-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-sm); }
        .stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; }
        .stat-icon.blue { background: #EFF6FF; color: #3B82F6; }
        .stat-icon.green { background: #ECFDF5; color: #10B981; }
        .stat-icon.purple { background: #F5F3FF; color: #8B5CF6; }
        .stat-icon.orange { background: #FFF7ED; color: #F97316; }
        
        .stat-label { display: block; font-size: 0.8rem; color: #64748B; font-weight: 600; text-transform: uppercase; letter-spacing: 0.025em; }
        .stat-value { display: block; font-size: 1.5rem; font-weight: 800; color: #1E293B; margin-top: 0.25rem; }

        .charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 1.5rem; }
        .chart-container { padding: 1.5rem; }
        .chart-title { font-size: 1rem; color: #475569; margin-bottom: 1.5rem; font-weight: 700; text-align: center; }

        .filters-card { display: flex; gap: 1.5rem; padding: 1rem 1.5rem; background: #F8FAFC; }
        .filter-group { display: flex; align-items: center; gap: 0.75rem; border: 1px solid var(--border); padding: 0.4rem 0.8rem; border-radius: 8px; background: white; }
        .filter-group select { border: none; outline: none; background: transparent; font-weight: 700; color: #1E293B; font-size: 0.85rem; }

        td { vertical-align: middle; padding: 1.1rem 1rem; }
        .dept-tag { background: #EEF2FF; color: #4338CA; padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; }
        
        .mini-progress-track { width: 60px; height: 4px; background: #E2E8F0; border-radius: 2px; overflow: hidden; }
        .mini-progress-bar { height: 100%; background: #3B82F6; border-radius: 2px; }

        @media print {
          .btn, .filters-card, .page-header p { display: none !important; }
          .glass-card, .table-container { border: 1px solid #E2E8F0 !important; box-shadow: none !important; }
          .charts-grid { grid-template-columns: 1fr !important; gap: 0; }
          .report-section {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            margin-bottom: 30px;
            display: block;
            width: 100%;
          }
          .page-header { margin-bottom: 2rem !important; }
          .stats-grid { gap: 1rem !important; margin-bottom: 2rem; }
          .stat-card { border: 1px solid #E2E8F0 !important; }
        }

        @media (max-width: 1024px) {
          .charts-grid { grid-template-columns: 1fr; }
          .filters-card { flex-direction: column; align-items: stretch; gap: 0.75rem; }
          .filter-group { width: 100%; }
          .filter-group select { width: 100%; }
          .page-header .btn { width: 100%; height: 50px; justify-content: center; }
        }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
};

export default Reports;
