import { useState, useEffect } from 'react';
import api from '../../api';
import { 
  Users, BookOpen, Presentation, CalendarRange, 
  CalendarDays, AlertTriangle, School, ChevronRight, 
  Loader2, PlusCircle, CheckCircle, Clock, Trash2, Edit3,
  Building2, RefreshCw, Activity, Monitor
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, Legend, ResponsiveContainer, Tooltip 
} from 'recharts';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    faculty: [],
    subjects: [],
    classrooms: [],
    timetables: [],
    workloads: []
  });
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [facRes, subRes, classRes, timeRes, workRes, actRes] = await Promise.all([
          api.get('/faculty'),
          api.get('/subjects'),
          api.get('/classrooms'),
          api.get('/timetable'),
          api.get('/workloads'),
          api.get('/activity/recent')
        ]);
        
        setStats({
          faculty: facRes.data,
          subjects: subRes.data,
          classrooms: classRes.data,
          timetables: timeRes.data.timetable || timeRes.data || [],
          workloads: workRes.data
        });
        setActivities(actRes.data || []);
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleGenerateTimetable = async () => {
    if (!window.confirm("Are you sure you want to regenerate the timetable? Existing entries will be cleared.")) return;
    try {
      setIsLoading(true);
      await api.post('/timetable/generate');
      const timeRes = await api.get('/timetable');
      setStats(prev => ({ ...prev, timetables: timeRes.data.timetable || timeRes.data || [] }));
      alert("Timetable generated successfully!");
    } catch (err) {
      alert("Failed to generate timetable: " + (err.response?.data?.message || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return (
    <div className="loading-state" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <Loader2 style={{ animation: 'spin 1s linear infinite' }} className="spinner" size={40} />
      <span style={{ marginLeft: '1rem', fontSize: '1.2rem', color: 'var(--text-muted)' }}>Loading Dashboard...</span>
    </div>
  );

  // 1. Subjects per Department Data
  const deptSubjectCount = stats.subjects.reduce((acc, sub) => {
    acc[sub.department] = (acc[sub.department] || 0) + 1;
    return acc;
  }, {});
  const pieData = Object.keys(deptSubjectCount).map(dept => ({
    name: dept,
    value: deptSubjectCount[dept]
  }));

  const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#F97316'];

  // 2. Today's Classes
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = days[new Date().getDay()];
  const todayClasses = stats.timetables
    .filter(t => t.day === todayName)
    .sort((a, b) => (a.timeSlot || '').localeCompare(b.timeSlot || ''));

  // 3. Workload Alerts
  const workloadAlerts = stats.faculty.map(f => {
    const assignedHours = stats.workloads
      .filter(w => (w.facultyId?._id || w.facultyId) === f._id)
      .reduce((sum, w) => sum + w.assignedHours, 0);
    return {
      name: f.name,
      assigned: assignedHours,
      max: f.maxWorkloadHours,
      overflow: assignedHours > f.maxWorkloadHours
    };
  }).filter(f => f.overflow || (f.max > 0 && f.assigned >= f.max * 0.9));

  // 4. Relative time helper
  const timeAgo = (dateStr) => {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60)   return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
    return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) > 1 ? 's' : ''} ago`;
  };

  // 5. Module → icon + colour mapping
  const moduleIcon = (module) => {
    const map = {
      Faculty:    { icon: <Users size={15} />,        color: '#2563EB', bg: '#EFF6FF' },
      Subject:    { icon: <BookOpen size={15} />,     color: '#10B981', bg: '#ECFDF5' },
      Classroom:  { icon: <Presentation size={15} />,color: '#F59E0B', bg: '#FFFBEB' },
      Department: { icon: <Building2 size={15} />,   color: '#8B5CF6', bg: '#F5F3FF' },
      Timetable:  { icon: <CalendarRange size={15} />,color: '#EF4444', bg: '#FEF2F2' },
      Workload:   { icon: <Activity size={15} />,    color: '#06B6D4', bg: '#ECFEFF' },
    };
    return map[module] || { icon: <CheckCircle size={15} />, color: '#64748B', bg: '#F1F5F9' };
  };

  // --- SYSTEM INSIGHTS CALCULATIONS ---
  const roomUsage = stats.timetables.reduce((acc, t) => {
    const room = t.classroom?.roomName || t.classroom?.roomNumber || 'Unknown';
    acc[room] = (acc[room] || 0) + 1;
    return acc;
  }, {});
  const mostUsedRoom = Object.entries(roomUsage).sort((a, b) => b[1] - a[1])[0] || ['None', 0];

  const facultyWorkloadMap = stats.workloads.reduce((acc, w) => {
    const name = w.facultyId?.name || 'Unknown';
    acc[name] = (acc[name] || 0) + w.assignedHours;
    return acc;
  }, {});
  const topFaculty = Object.entries(facultyWorkloadMap).sort((a, b) => b[1] - a[1])[0] || ['None', 0];

  const deptSubCountMap = stats.subjects.reduce((acc, sub) => {
    acc[sub.department] = (acc[sub.department] || 0) + 1;
    return acc;
  }, {});
  const topDept = Object.entries(deptSubCountMap).sort((a, b) => b[1] - a[1])[0] || ['None', 0];

  const totalPossibleSlotsToday = stats.classrooms.length * 7; 
  const freeSlotsToday = Math.max(0, totalPossibleSlotsToday - todayClasses.length);

  return (
    <div className="admin-dashboard">
      <div className="page-header" style={{ marginBottom: '2.5rem' }}>
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.2rem' }}>Welcome back! Here's what's happening today.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={handleGenerateTimetable} className="btn-modern-action">
            <CalendarRange size={18} /> <span>Generate Timetable</span>
          </button>
        </div>
      </div>

      {/* --- STATS OVERVIEW --- */}
      <div className="stats-grid">
        <div className="glass-card stat-card interactive">
          <div className="stat-icon-bg primary"><Users size={24} /></div>
          <div className="stat-info">
            <p className="stat-label">Total Faculty</p>
            <h3 className="stat-value">{stats.faculty.length}</h3>
          </div>
        </div>
        <div className="glass-card stat-card interactive">
          <div className="stat-icon-bg success"><BookOpen size={24} /></div>
          <div className="stat-info">
            <p className="stat-label">Total Subjects</p>
            <h3 className="stat-value">{stats.subjects.length}</h3>
          </div>
        </div>
        <div className="glass-card stat-card interactive">
          <div className="stat-icon-bg warning"><Presentation size={24} /></div>
          <div className="stat-info">
            <p className="stat-label">Classrooms</p>
            <h3 className="stat-value">{stats.classrooms.length}</h3>
          </div>
        </div>
        <div className="glass-card stat-card interactive">
          <div className="stat-icon-bg danger"><CalendarRange size={24} /></div>
          <div className="stat-info">
            <p className="stat-label">Classes Total</p>
            <h3 className="stat-value">{stats.timetables.length}</h3>
          </div>
        </div>
      </div>

      {/* --- SYSTEM INSIGHTS --- */}
      <div className="glass-card section-card" style={{ marginBottom: '1.5rem' }}>
        <h2 className="section-title"><Activity size={18} /> System Insights</h2>
        <div className="insights-grid">
          <div className="insight-card">
            <div className="insight-icon info"><Monitor size={20} /></div>
            <div className="insight-data">
              <p className="insight-label">Most Used Classroom</p>
              <h4 className="insight-value">{mostUsedRoom[0]}</h4>
              <p className="insight-subtext">Used {mostUsedRoom[1]} Times</p>
            </div>
          </div>
          <div className="insight-card">
            <div className="insight-icon primary"><Users size={20} /></div>
            <div className="insight-data">
              <p className="insight-label">Top Faculty Workload</p>
              <h4 className="insight-value">{topFaculty[0]}</h4>
              <p className="insight-subtext">{topFaculty[1]} Hours Assigned</p>
            </div>
          </div>
          <div className="insight-card">
            <div className="insight-icon success"><BookOpen size={20} /></div>
            <div className="insight-data">
              <p className="insight-label">Dept With Most Subjects</p>
              <h4 className="insight-value">{topDept[0]}</h4>
              <p className="insight-subtext">{topDept[1]} Subjects</p>
            </div>
          </div>
          <div className="insight-card">
            <div className="insight-icon warning"><Clock size={20} /></div>
            <div className="insight-data">
              <p className="insight-label">Free Slots Today</p>
              <h4 className="insight-value">{freeSlotsToday} Slots</h4>
              <p className="insight-subtext">Available Today</p>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-main-columns">
        {/* LEFT COLUMN: Chart */}
        <div className="dashboard-column">

          {/* Subjects Pie Chart */}
          <div className="glass-card section-card">
            <h2 className="section-title"><School size={18} /> Subjects per Department</h2>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={85}
                    paddingAngle={5} dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: '20px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Today's Schedule & Recent Activities */}
        <div className="dashboard-column">
          {/* Recent Activities Panel */}
          <div className="glass-card section-card">
            <h2 className="section-title"><Clock size={18} /> Recent Activities</h2>
            <div className="activities-list">
              {activities.length === 0 ? (
                <div className="no-activity-state">
                  <Activity size={32} color="#94A3B8" />
                  <p>No activities yet.</p>
                  <span>Actions you perform will appear here.</span>
                </div>
              ) : (
                activities.map((act) => {
                  const { icon, color, bg } = moduleIcon(act.module);
                  return (
                    <div key={act._id} className="activity-item">
                      <div className="activity-icon-circle" style={{ background: bg, color }}>
                        {icon}
                      </div>
                      <div className="activity-content">
                        <p className="activity-action">{act.action}</p>
                        <p className="activity-desc">
                          {act.description.replace(/\s*\([a-f\d]{24}\)/g, '')}
                        </p>
                        <span className="activity-time">{timeAgo(act.createdAt)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Workload Alerts Mini */}
          {workloadAlerts.length > 0 && (
            <div className="glass-card section-card warning-card">
              <h2 className="section-title"><AlertTriangle size={18} color="#D97706" /> Workload Alerts</h2>
              <div className="alerts-container">
                {workloadAlerts.slice(0, 3).map((a, i) => (
                  <div key={i} className="mini-alert-item">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span className="alert-name">{a.name}</span>
                      <span className={`alert-badge ${a.overflow ? 'over' : 'near'}`}>
                        {a.assigned}/{a.max}h
                      </span>
                    </div>
                    <div className="progress-bg">
                      <div className={`progress-fill ${a.overflow ? 'over' : 'near'}`} 
                        style={{ width: `${Math.min((a.assigned / a.max) * 100, 100)}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* FULL WIDTH: Today's Schedule Table */}
      <div className="glass-card schedule-section">
        <div className="section-header-flex">
          <h2 className="section-title"><CalendarDays size={20} /> Today's Schedule ({todayName})</h2>
          <Link to="/admin/timetable" className="view-all-link">
            View Full Timetable <ChevronRight size={16} />
          </Link>
        </div>
        
        {todayClasses.length > 0 ? (
          <div className="table-container">
            <table className="modern-dashboard-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Subject</th>
                  <th>Faculty</th>
                  <th>Classroom</th>
                </tr>
              </thead>
              <tbody>
                {todayClasses.map((cls, i) => (
                  <tr key={i}>
                    <td className="time-col">
                      <span className="time-tag">{cls.timeSlot}</span>
                    </td>
                    <td className="subject-col">{cls.subject?.subjectName || '---'}</td>
                    <td className="faculty-col">{cls.faculty?.name || '---'}</td>
                    <td className="room-col">
                      <span className="room-tag">{cls.classroom?.roomName || '---'}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-schedule-state">
            <CalendarRange size={48} color="#94A3B8" />
            <p>No classes scheduled for today.</p>
            <span>Everything looks quiet! Enjoy the free time.</span>
          </div>
        )}
      </div>

      <style>{`
        .admin-dashboard {
          max-width: 1400px;
          margin: 0 auto;
          animation: fadeIn 0.4s ease-out;
        }

        .dashboard-main-columns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }

        @media (max-width: 1200px) {
          .dashboard-main-columns { grid-template-columns: 1fr; }
        }

        .section-card {
          margin-bottom: 1.5rem;
          height: fit-content;
        }

        .section-title {
          font-size: 1.15rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          margin-bottom: 1.5rem;
          color: #1E293B;
        }

        /* Stats Cards */
        .stat-icon-bg {
          width: 50px; height: 50px;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          color: white;
        }
        .stat-icon-bg.primary { background: linear-gradient(135deg, #3B82F6, #2563EB); }
        .stat-icon-bg.success { background: linear-gradient(135deg, #10B981, #059669); }
        .stat-icon-bg.warning { background: linear-gradient(135deg, #F59E0B, #D97706); }
        .stat-icon-bg.danger { background: linear-gradient(135deg, #EF4444, #DC2626); }

        .stat-label { margin: 0; font-size: 0.875rem; color: #64748B; font-weight: 500; }
        .stat-value { margin: 0; font-size: 1.75rem; font-weight: 800; color: #0F172A; }

        /* System Insights Grid */
        .insights-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1.25rem;
        }
        @media (max-width: 1200px) {
          .insights-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .insights-grid { grid-template-columns: 1fr; }
        }
        .insight-card {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.25rem;
          background: #F8FAFC;
          border-radius: 12px;
          border: 1px solid #E2E8F0;
          transition: all 0.2s ease;
        }
        .insight-card:hover { transform: translateY(-3px); background: #FFFFFF; border-color: #3B82F6; box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.1); }
        .insight-icon {
          width: 44px; height: 44px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .insight-icon.info { background: #E0F2FE; color: #0EA5E9; }
        .insight-icon.primary { background: #EFF6FF; color: #3B82F6; }
        .insight-icon.success { background: #ECFDF5; color: #10B981; }
        .insight-icon.warning { background: #FFFBEB; color: #F59E0B; }
        
        .insight-label { margin: 0; font-size: 0.725rem; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.025em; }
        .insight-value { margin: 2px 0; font-size: 1.1rem; font-weight: 800; color: #1E293B; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .insight-subtext { margin: 0; font-size: 0.8rem; color: #94A3B8; font-weight: 500; }
        .btn-reset { width: 100%; border: 1px solid #E2E8F0; cursor: pointer; font-family: inherit; }

        /* Activities Panel */
        .activities-list { display: flex; flex-direction: column; gap: 1rem; max-height: 380px; overflow-y: auto; }
        .activity-item { display: flex; gap: 0.875rem; align-items: flex-start; padding: 0.75rem; border-radius: 10px; transition: background 0.15s; }
        .activity-item:hover { background: #F8FAFC; }
        .activity-icon-circle {
          flex-shrink: 0;
          width: 34px; height: 34px;
          border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
        }
        .activity-action { margin: 0 0 2px; font-size: 0.8rem; font-weight: 700; color: #1E293B; }
        .activity-desc { margin: 0 0 3px; font-size: 0.84rem; color: #475569; font-weight: 500; }
        .activity-time { font-size: 0.72rem; color: #94A3B8; font-weight: 600; }
        .no-activity-state {
          display: flex; flex-direction: column; align-items: center; padding: 2.5rem 1rem;
          color: #94A3B8; gap: 0.5rem; text-align: center;
        }
        .no-activity-state p { margin: 0; font-weight: 600; color: #64748B; }
        .no-activity-state span { font-size: 0.85rem; }

        /* Table Redesign */
        .section-header-flex {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 2rem;
        }
        .view-all-link {
          font-size: 0.875rem; font-weight: 700; color: #3B82F6;
          text-decoration: none; display: flex; align-items: center; gap: 0.25rem;
        }
        .modern-dashboard-table { width: 100%; border-collapse: separate; border-spacing: 0 0.75rem; }
        .modern-dashboard-table th { background: none; font-size: 0.8rem; border: none; padding-bottom: 0.5rem; }
        .modern-dashboard-table td { 
          padding: 1.25rem 1rem; 
          background: #F8FAFC;
          border-top: 1px solid #F1F5F9;
          border-bottom: 1px solid #F1F5F9;
        }
        .modern-dashboard-table td:first-child { border-left: 1px solid #F1F5F9; border-top-left-radius: 12px; border-bottom-left-radius: 12px; }
        .modern-dashboard-table td:last-child { border-right: 1px solid #F1F5F9; border-top-right-radius: 12px; border-bottom-right-radius: 12px; }

        .time-tag { background: #E0F2FE; color: #0369A1; padding: 4px 10px; border-radius: 6px; font-weight: 700; font-size: 0.85rem; }
        .room-tag { background: #F1F5F9; color: #475569; padding: 4px 10px; border-radius: 6px; font-weight: 600; font-size: 0.85rem; }

        /* Empty States */
        .empty-schedule-state {
          text-align: center; padding: 4rem 2rem;
          display: flex; flex-direction: column; align-items: center;
        }
        .empty-schedule-state p { margin: 1rem 0 0.25rem; font-size: 1.1rem; font-weight: 600; color: #475569; }
        .empty-schedule-state span { font-size: 0.9rem; color: #94A3B8; }

        /* Workload Mini Alerts */
        .alerts-container { display: flex; flex-direction: column; gap: 1rem; }
        .mini-alert-item { padding-bottom: 0.5rem; }
        .alert-name { font-size: 0.875rem; font-weight: 600; color: #334155; }
        .alert-badge { font-size: 0.75rem; font-weight: 800; padding: 2px 6px; border-radius: 4px; }
        .alert-badge.over { background: #FEE2E2; color: #EF4444; }
        .alert-badge.near { background: #FEF3C7; color: #D97706; }
        .progress-bg { height: 6px; background: #F1F5F9; border-radius: 3px; overflow: hidden; }
        .progress-fill { height: 100%; border-radius: 3px; }
        .progress-fill.over { background: #EF4444; }
        .progress-fill.near { background: #F59E0B; }

        .btn-modern-action {
          display: flex; align-items: center; gap: 0.5rem;
          padding: 0.75rem 1.25rem; background: #0F172A; color: white;
          border: none; border-radius: 10px; cursor: pointer; font-weight: 600;
          transition: all 0.2s;
        }
        .btn-modern-action:hover { background: #1E293B; transform: translateY(-2px); }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
