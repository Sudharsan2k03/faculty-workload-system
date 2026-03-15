import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api';
import {
  BookOpen, Clock, CalendarRange, Calendar, MapPin,
  User, UserCheck, Award, ShieldCheck, Mail, CaseUpper,
  CheckCircle, AlertCircle, AlertTriangle, X, Loader2, ChevronRight,
  Monitor, Book, Users, Lock, Edit3, Settings, Coffee
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSearchParams } from 'react-router-dom';

const FacultyDashboard = () => {
  const { user: authUser, setUser: setAuthUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();




  const [data, setData] = useState({
    faculty: null,
    workloads: [],
    timetables: []
  });
  const [settings, setSettings] = useState({ workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], saturdayMode: 'None' });
  const [loading, setLoading] = useState(true);

  // Sync tab with URL
  const activeTab = searchParams.get('tab') || 'overview';
  const setActiveTab = (tab) => setSearchParams({ tab });

  // Profile Forms State
  const [profileData, setProfileData] = useState({ name: '', email: '' });
  const [pwdData, setPwdData] = useState({ currentPassword: '', newPassword: '' });
  const [activeSlotsModal, setActiveSlotsModal] = useState(null); // { day, slot, slots }
  const [notification, setNotification] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchFacultyData();
  }, [activeTab]); // Fetch/Refresh when tab changes if needed, though usually just state is enough

  const fetchFacultyData = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/faculty/dashboard/me');
      setData(data);
      if (data.settings) setSettings(data.settings);
      setProfileData({ name: data.faculty.name, email: data.faculty.email });
    } catch (err) {
      console.error(err);
      showNotification('Failed to load dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setIsUpdating(true);
      const { data: updatedUser } = await api.put('/auth/profile', profileData);
      setAuthUser(updatedUser);
      localStorage.setItem('userInfo', JSON.stringify(updatedUser));
      showNotification('Profile updated successfully');
      fetchFacultyData();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Update failed', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    try {
      setIsUpdating(true);
      await api.put('/auth/password', pwdData);
      showNotification('Password updated successfully');
      setPwdData({ currentPassword: '', newPassword: '' });
    } catch (err) {
      showNotification(err.response?.data?.message || 'Password update failed', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const isSaturdayHoliday = () => {
    const mode = settings?.saturdayMode || 'None';
    if (mode === 'None') return true;
    if (mode === 'All') return false;
    if (mode === 'Alternate') {
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const dayOfWeek = firstDayOfMonth.getDay(); 
      const firstSaturdayDate = dayOfWeek <= 6 ? (6 - dayOfWeek + 1) : (6 - dayOfWeek + 8);
      const currentDay = today.getDate();
      const weekNum = Math.ceil((currentDay - firstSaturdayDate + 1) / 7) + 1;
      return weekNum % 2 === 0;
    }
    return false;
  };

  const currentSettingsDays = useMemo(() => {
    const list = [...(settings?.workingDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'])];
    const mode = settings?.saturdayMode || 'None';
    if (mode !== 'None' && !list.includes('Saturday')) {
      list.push('Saturday');
    }
    return list;
  }, [settings]);

  const timeSlots = [
    '09:00-10:00', '10:00-11:00', '11:15-12:15', '12:15-13:15',
    '13:15-14:00', // LUNCH BREAK
    '14:00-15:00', '15:00-16:00', '16:00-17:00'
  ];

  // Derived Data
  const totalAssignedHours = useMemo(() =>
    data.workloads.reduce((sum, w) => sum + (w.assignedHours || 0), 0)
    , [data.workloads]);

  const workloadPercent = useMemo(() =>
    Math.min((totalAssignedHours / (data.faculty?.maxWorkloadHours || 40)) * 100, 100)
    , [totalAssignedHours, data.faculty]);

  const todayName = useMemo(() =>
    ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()]
    , []);

  const todayClasses = useMemo(() =>
    data.timetables.filter(t => t.day === todayName)
      .sort((a, b) => (a.timeSlot || '').localeCompare(b.timeSlot || ''))
    , [data.timetables, todayName]);

  const nextClass = useMemo(() => {
    if (!data.timetables.length) return null;
    const now = new Date();
    const currentHours = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTime = `${currentHours.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`;

    // Sort classes for today by time
    const sortedToday = data.timetables
      .filter(t => t.day === todayName)
      .sort((a, b) => (a.timeSlot || '').localeCompare(b.timeSlot || ''));

    // Find the first class that hasn't started yet or is currently happening
    return sortedToday.find(t => {
      const startTime = (t.timeSlot || '').split('-')[0];
      return startTime >= currentTime;
    }) || sortedToday[0]; // fallback to first if none found
  }, [data.timetables, todayName]);

  const getDeptClass = (dept) => {
    const mapping = {
      'Computer Science': 'card-cs',
      'Mathematics': 'card-math',
      'Physics': 'card-physics',
      'Chemistry': 'card-chemistry',
    };
    return mapping[dept] || 'card-default';
  };

  if (loading) return (
    <div className="loading-state" style={{ height: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', color: '#64748B' }}>
      <Loader2 className="animate-spin" size={48} />
      <p style={{ fontWeight: 600 }}>Syncing your professional portal...</p>
    </div>
  );

  if (!data.faculty) return (
    <div className="error-state" style={{ padding: '4rem', textAlign: 'center' }}>
      <AlertCircle size={48} color="var(--danger)" />
      <h2>Access Error</h2>
      <p>We couldn't retrieve your faculty record. Please contact the administrator.</p>
    </div>
  );

  return (
    <div className="faculty-dashboard">
      {/* Notifications */}
      {notification && (
        <div className={`notification-toast ${notification.type}`}>
          {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header Space */}
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title">Digital Faculty Portal</h1>
          <p className="page-subtitle">Welcome back, <strong>{data.faculty.name}</strong>. Here is your institutional overview.</p>
        </div>
        <div className="header-tabs-container">
          <div className="header-tabs glass-panel" style={{ padding: '4px', display: 'flex', gap: '4px' }}>
            <button className={`btn-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
            <button className={`btn-tab ${activeTab === 'schedule' ? 'active' : ''}`} onClick={() => setActiveTab('schedule')}>Weekly Timetable</button>
            <button className={`btn-tab ${activeTab === 'subjects' ? 'active' : ''}`} onClick={() => setActiveTab('subjects')}>Assigned Subjects</button>
            <button className={`btn-tab ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>My Profile</button>
          </div>
        </div>
      </div>

      {(activeTab === 'overview' || activeTab === 'subjects') && (
        <div className="animate-fade-in">
          {/* Next Class Spotlight */}
          {activeTab === 'overview' && nextClass && (
            <div className="next-class-card">
              <div className="next-class-info">
                <h4>Upcoming Appointment</h4>
                <div className="next-class-subject">{nextClass.subject?.subjectName}</div>
                <div className="next-class-meta">
                  <span><Clock size={16} /> {nextClass.timeSlot}</span>
                  <span><MapPin size={16} /> Room {nextClass.classroom?.roomName || nextClass.classroom?.roomNumber}</span>
                </div>
              </div>
              <div className="next-class-status">
                <div className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}>Starts {nextClass.timeSlot?.split('-')[0]}</div>
              </div>
            </div>
          )}

          {/* KPI CARDS */}
          <div className="stats-grid">
            <div className="glass-card stat-card faculty-stat">
              <div className="stat-header">
                <div className="stat-icon-bg primary"><Clock size={20} /></div>
                <span className="stat-label">Workload Hours</span>
              </div>
              <h3 className="stat-value" style={{ margin: '0.5rem 0' }}>{totalAssignedHours} / {data.faculty.maxWorkloadHours}h</h3>
              <div className="progress-container">
                <div className="progress-bar" style={{
                  width: `${workloadPercent}%`,
                  background: workloadPercent > 90 ? 'var(--danger)' : 'var(--primary)'
                }}></div>
              </div>
              <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 600, color: workloadPercent > 90 ? 'var(--danger)' : 'var(--text-muted)' }}>
                {workloadPercent >= 100 ? 'Maximum Load Reached' : `${Math.round(workloadPercent)}% of weekly limit assigned`}
              </p>
            </div>

            <div className="glass-card stat-card faculty-stat">
              <div className="stat-header">
                <div className="stat-icon-bg success"><BookOpen size={20} /></div>
                <span className="stat-label">Subject Count</span>
              </div>
              <h3 className="stat-value" style={{ margin: '0.5rem 0' }}>{data.workloads.length} <span style={{ fontSize: '1rem', fontWeight: 500, color: '#64748B' }}>Subjects</span></h3>
              <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Distribution across {new Set(data.workloads.map(w => w.facultyId?.department)).size || 1} departments</p>
            </div>

            <div className="glass-card stat-card faculty-stat">
              <div className="stat-header">
                <div className="stat-icon-bg purple"><CalendarRange size={20} /></div>
                <span className="stat-label">Weekly Commitments</span>
              </div>
              <h3 className="stat-value" style={{ margin: '0.5rem 0' }}>{data.timetables.length} <span style={{ fontSize: '1rem', fontWeight: 500, color: '#64748B' }}>Classes</span></h3>
              <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Scheduled across institutional hours</p>
            </div>
          </div>

          <div className="dashboard-main-columns" style={{ display: 'grid', gridTemplateColumns: activeTab === 'subjects' ? '0.8fr 1.2fr' : '1.2fr 0.8fr', gap: '1.5rem', marginTop: '1.5rem' }}>
            {/* Today's Schedule Center */}
            {(activeTab === 'overview' || activeTab === 'subjects') && (
              <div className="dashboard-column" style={{ order: activeTab === 'subjects' ? 2 : 1 }}>
                <div className="glass-card" style={{ height: '100%', padding: '1.75rem' }}>
                  <div className="section-flex" style={{ marginBottom: '1.5rem' }}>
                    <h2 className="section-title" style={{ margin: 0 }}><Calendar size={20} color="var(--primary)" /> Today's Schedule</h2>
                    <span className="badge badge-primary">{todayName}, {new Date().toLocaleDateString()}</span>
                  </div>

                  <div className="today-classes-list">
                    {todayClasses.length > 0 ? todayClasses.map((cls, i) => (
                      <div key={i} className="today-class-item">
                        <div className="class-time-tag">{cls.timeSlot}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 800, color: '#1E293B', fontSize: '1.05rem' }}>{cls.subject?.subjectName}</div>
                          <div style={{ color: '#64748B', fontSize: '0.85rem', fontWeight: 600 }}>{cls.subject?.subjectId || 'N/A'}</div>
                        </div>
                        <div className="class-room-tag">
                          <MapPin size={12} style={{ marginRight: '4px' }} />
                          {cls.classroom?.roomName || cls.classroom?.roomNumber}
                        </div>
                      </div>
                    )) : (
                      <div style={{ textAlign: 'center', padding: '3rem', background: '#F8FAFC', borderRadius: '16px', border: '1px dashed #E2E8F0' }}>
                        <Monitor size={48} color="#CBD5E1" style={{ marginBottom: '1rem' }} />
                        <p style={{ fontWeight: 700, color: '#475569', margin: 0 }}>No classes scheduled for today.</p>
                        <span style={{ fontSize: '0.85rem', color: '#94A3B8' }}>Your agenda is clear. Use this time with institutional focus.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Assigned Subjects Column */}
            {(activeTab === 'overview' || activeTab === 'subjects') && (
              <div className="dashboard-column" style={{ order: activeTab === 'subjects' ? 1 : 2 }}>
                <div className="glass-card" style={{ height: '100%', padding: '1.75rem', border: activeTab === 'subjects' ? '2px solid var(--primary)' : '1px solid var(--border)' }}>
                  <h2 className="section-title" style={{ marginBottom: '1.5rem' }}><BookOpen size={20} color="var(--secondary)" /> Current Subjects</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {data.workloads.map(w => (
                      <div key={w._id} className="subject-mini-card">
                        <div className="subject-icon">
                          <Book size={20} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, color: '#1E293B', fontSize: '0.9rem' }}>{w.subjectId?.subjectName}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>{w.assignedHours}h • Weekly Credit</div>
                        </div>
                        <ChevronRight size={16} color="#CBD5E1" />
                      </div>
                    ))}
                    {data.workloads.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <p style={{ color: '#94A3B8', fontSize: '0.9rem' }}>Resource allocation pending...</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className="animate-fade-in">
          <div className="timetable-container">
            <div className="timetable-main-grid" style={{ '--day-count': currentSettingsDays.length }}>
              <div className="corner header-cell">Session Hour</div>
              {currentSettingsDays.map(day => (
                <div key={day} className="header-cell">{day}</div>
              ))}

              {timeSlots.map(slot => (
                <React.Fragment key={slot}>
                  {slot === '13:15-14:00' ? (
                    <>
                      <div className="time-col lunch-time-col">{slot}</div>
                      <div className="lunch-slot-col">
                        <div className="lunch-content">
                          <span>☕ LUNCH BREAK (13:15 – 14:00)</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid-cell time-col">{slot}</div>
                      {currentSettingsDays.map(day => {
                      if (day === 'Saturday' && isSaturdayHoliday()) {
                        return <div key={`${day}-${slot}`} className="grid-cell holiday-cell">Holiday</div>;
                      }

                      const slots = data.timetables.filter(t => t.day === day && t.timeSlot === slot);
                      const visibleSlots = slots.slice(0, 2);
                      const hasMore = slots.length > 2;

                      return (
                        <div key={`${day}-${slot}`} className="grid-cell">
                          {slots.length === 0 ? (
                            <div className="empty-slot">• Available Slot</div>
                          ) : (
                            <>
                              {visibleSlots.map(s => (
                                <div key={s._id} className={`schedule-card ${getDeptClass(s.subject?.department)}`}>
                                  <div className="card-subject" title={s.subject?.subjectName}>{s.subject?.subjectName}</div>
                                  <div className="card-faculty">{s.faculty?.name}</div>
                                  <div className="card-room">
                                    <MapPin size={8} />
                                    Room {s.classroom?.roomName || s.classroom?.roomNumber}
                                  </div>
                                </div>
                              ))}
                              {hasMore && (
                                <div 
                                  className="more-badge"
                                  onClick={() => setActiveSlotsModal({ day, slot, slots })}
                                >
                                  +{slots.length - 2} more
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })}
                    </>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="animate-fade-in profile-grid">
          {/* Identity Card */}
          <div className="glass-card" style={{ height: 'fit-content', padding: '2rem', textAlign: 'center' }}>
            <div style={{
              width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
              margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyCenter: 'center',
              boxShadow: '0 10px 25px rgba(59, 130, 246, 0.3)', color: 'white'
            }}>
              <User size={48} style={{ margin: '0 auto' }} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.25rem 0' }}>{data.faculty.name}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <Mail size={14} /> {data.faculty.email}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div className="glass-panel" style={{ padding: '1rem', background: '#F8FAFC' }}>
                <Award size={18} color="var(--primary)" style={{ marginBottom: '0.5rem' }} />
                <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Designation</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1E293B' }}>{data.faculty.designation}</div>
              </div>
              <div className="glass-panel" style={{ padding: '1rem', background: '#F8FAFC' }}>
                <Users size={18} color="var(--secondary)" style={{ marginBottom: '0.5rem' }} />
                <div style={{ fontSize: '0.7rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Department</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1E293B' }}>{data.faculty.department}</div>
              </div>
            </div>

            <div style={{ padding: '1rem', background: '#EEF2FF', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.75rem', textAlign: 'left' }}>
              <ShieldCheck size={20} color="#4338CA" />
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#312E81' }}>Account Verified</div>
                <div style={{ fontSize: '0.7rem', color: '#4338CA' }}>Institutional access active</div>
              </div>
            </div>
          </div>

          {/* Settings Section */}
          <div className="dashboard-column" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="glass-card" style={{ padding: '2rem' }}>
              <h3 className="section-title"><UserCheck size={18} /> Update Profile Information</h3>
              <form onSubmit={handleUpdateProfile} className="modern-form">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <div className="input-with-icon">
                      <CaseUpper size={16} className="input-icon" />
                      <input
                        className="form-input" value={profileData.name}
                        onChange={e => setProfileData({ ...profileData, name: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <div className="input-with-icon">
                      <Mail size={16} className="input-icon" />
                      <input
                        className="form-input" value={profileData.email}
                        onChange={e => setProfileData({ ...profileData, email: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <button type="submit" disabled={isUpdating} className="btn btn-primary" style={{ width: '100%' }}>
                  {isUpdating ? <Loader2 className="animate-spin" size={18} /> : 'Save Profile Changes'}
                </button>
              </form>
            </div>

            <div className="glass-card" style={{ padding: '2rem' }}>
              <h3 className="section-title"><Lock size={18} /> Credentials Management</h3>
              <form onSubmit={handleUpdatePassword} className="modern-form">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className="form-group">
                    <label className="form-label">Current Password</label>
                    <input
                      type="password" className="form-input" placeholder="Current security key"
                      value={pwdData.currentPassword}
                      onChange={e => setPwdData({ ...pwdData, currentPassword: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">New Password</label>
                    <input
                      type="password" className="form-input" placeholder="Min. 8 characters"
                      value={pwdData.newPassword}
                      onChange={e => setPwdData({ ...pwdData, newPassword: e.target.value })}
                    />
                  </div>
                </div>
                <button type="submit" disabled={isUpdating} className="btn btn-secondary" style={{ width: '100%' }}>
                  {isUpdating ? <Loader2 className="animate-spin" size={18} /> : 'Securely Update Password'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Extended Slots Modal */}
      {activeSlotsModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px', textAlign: 'left' }}>
            <div className="modal-header-clean" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <h2 style={{ margin: 0 }}>Schedule Details</h2>
              <button className="close-btn" style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setActiveSlotsModal(null)}><X size={20} /></button>
            </div>
            <p className="modal-meta" style={{ borderBottom: '1px solid #eee', paddingBottom: '1rem', marginBottom: '1rem' }}>{activeSlotsModal.day} | {activeSlotsModal.slot}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {activeSlotsModal.slots.map(s => (
                <div
                  key={s._id}
                  className={`schedule-card ${getDeptClass(s.subject?.department)}`}
                  style={{ height: 'auto', minHeight: '80px', padding: '1rem' }}
                >
                  <div className="card-subject" style={{ fontSize: '1rem', fontWeight: 800 }}>{s.subject?.subjectName}</div>
                  <div className="card-faculty" style={{ fontSize: '0.85rem', marginTop: '4px' }}>{s.faculty?.name}</div>
                  <div className="card-room" style={{ fontSize: '0.8rem', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={14} />
                    Room {s.classroom?.roomName || s.classroom?.roomNumber}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .faculty-dashboard { animation: fadeIn 0.4s ease-out; }
        .page-subtitle { color: #64748B; margin-top: 0.25rem; font-size: 0.95rem; }
        
        .stat-icon-bg { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: white; }
        .stat-icon-bg.primary { background: var(--primary); }
        .stat-icon-bg.success { background: var(--secondary); }
        .stat-icon-bg.purple { background: #8B5CF6; }
        .stat-icon-bg.orange { background: #F97316; }

        .stat-label { font-size: 0.8rem; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.025em; }
        .stat-value { font-size: 1.875rem; font-weight: 800; color: #0F172A; }

        .section-title { font-size: 1.15rem; font-weight: 800; display: flex; align-items: center; gap: 0.75rem; color: #1E293B; }
        
        .notification-toast {
          position: fixed; top: 1.5rem; right: 1.5rem; padding: 1rem 1.5rem; border-radius: 12px;
          background: white; box-shadow: 0 10px 25px rgba(0,0,0,0.1); z-index: 1000; display: flex; align-items: center; gap: 0.75rem;
          border-left: 5px solid transparent; animation: slideInRight 0.3s forwards; pointer-events: none;
        }
        .notification-toast.success { border-left-color: var(--secondary); color: #065F46; }
        .notification-toast.error { border-left-color: var(--danger); color: #991B1B; }

        /* Modal Clean styles */
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(4px); z-index: 2000;
          display: flex; align-items: center; justify-content: center; padding: 1rem;
        }
        .modal-content {
          background: white; padding: 2.5rem; border-radius: 20px;
          width: 100%; text-align: left;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          animation: modalPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes modalPop { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }

        .form-group { margin-bottom: 0; }
        .form-label { font-size: 0.8rem; font-weight: 700; color: #64748B; margin-bottom: 0.5rem; display: block; }
        .input-with-icon { position: relative; }
        .input-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94A3B8; }
        .input-with-icon .form-input { padding-left: 2.5rem; border-radius: 10px; }
        
        .badge { padding: 0.4rem 0.75rem; border-radius: 8px; font-size: 0.8rem; font-weight: 700; }
        .badge-primary { background: #EFF6FF; color: #2563EB; }

        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
        
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }

        @media (max-width: 1024px) {
          .dashboard-main-columns { 
            grid-template-columns: 1fr !important; 
          }
          .header-tabs-container {
            overflow-x: auto;
            margin: 0 -1rem 1rem -1rem;
            padding: 0 1rem 0.5rem 1rem;
            -webkit-overflow-scrolling: touch;
          }
          .header-tabs {
            min-width: max-content;
          }
          .next-class-card {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }
          .profile-grid {
            grid-template-columns: 1fr !important;
          }
          .modal-content {
            padding: 1.5rem;
            max-height: 90vh;
            overflow-y: auto;
          }
          .modal-content > div {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default FacultyDashboard;
