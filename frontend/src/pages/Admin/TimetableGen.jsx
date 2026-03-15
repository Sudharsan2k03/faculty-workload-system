import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api';
import {
  CalendarRange, Loader2, RefreshCw,
  Trash2, Edit3, X, Check, AlertTriangle, Coffee, MapPin,
  Settings as SettingsIcon, Save, ChevronDown
} from 'lucide-react';

const TimetableGen = () => {
  const [timetable, setTimetable] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null); // Track which custom dropdown is open

  const [settings, setSettings] = useState({ workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], saturdayMode: 'None' });
  const [showSettings, setShowSettings] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // Manual Edit State
  const [editSlot, setEditSlot] = useState(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [editConflict, setEditConflict] = useState(null); // inline conflict warning
  const [notification, setNotification] = useState(null);
  const [activeSlotsModal, setActiveSlotsModal] = useState(null);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeSlots = [
    '09:00-10:00', '10:00-11:00', '11:15-12:15', '12:15-13:15',
    '13:15-14:00', // LUNCH BREAK
    '14:00-15:00', '15:00-16:00', '16:00-17:00'
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [{ data: ttRes }, { data: fac }, { data: sub }, { data: cls }] = await Promise.all([
        api.get('/timetable'),
        api.get('/faculty'),
        api.get('/subjects'),
        api.get('/classrooms')
      ]);
      setTimetable(ttRes.timetable || (Array.isArray(ttRes) ? ttRes : []));
      if (ttRes.settings) setSettings(ttRes.settings);
      setFaculties(fac);
      setSubjects(sub);
      setClassrooms(cls);
    } catch (err) {
      showNotification('Failed to sync data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const generateTimetable = async () => {
    if (!window.confirm('OVERWRITE WARNING: Generating a new timetable will delete all current manual edits and schedules. Continue?')) return;
    setIsGenerating(true);
    try {
      await api.post('/timetable/generate');
      await fetchData();
      showNotification('Optimal timetable generated successfully!');
    } catch (err) {
      showNotification(err.response?.data?.message || 'Generation failed', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditSlot = (slotData) => {
    setEditConflict(null);
    setEditSlot({
      id: slotData._id,
      day: slotData.day,
      timeSlot: slotData.timeSlot,
      facultyId: slotData.faculty?._id,
      subjectId: slotData.subject?._id,
      roomId: slotData.classroom?._id
    });
  };

  const saveManualEdit = async () => {
    setEditConflict(null);
    setUpdateLoading(true);
    try {
      await api.put(`/timetable/${editSlot.id}`, {
        subject: editSlot.subjectId,
        faculty: editSlot.facultyId,
        classroom: editSlot.roomId,
        day: editSlot.day,
        timeSlot: editSlot.timeSlot
      });
      await fetchData();
      setEditSlot(null);
      showNotification('Schedule slot updated successfully');
    } catch (err) {
      const msg = err.response?.data?.message || 'Conflict detected';
      setEditConflict(msg);
    } finally {
      setUpdateLoading(false);
    }
  };

  const deleteSlot = async (id) => {
    if (!window.confirm('Remove this slot from the schedule?')) return;
    try {
      await api.delete(`/timetable/${id}`);
      await fetchData();
      showNotification('Slot cleared');
    } catch (err) {
      showNotification('Failed to clear slot', 'error');
    }
  };

  const saveSettings = async () => {
    setSaveLoading(true);
    try {
      await api.put('/settings', settings);
      showNotification('Institutional settings updated');
      setShowSettings(false);
      fetchData();
    } catch (err) {
      showNotification('Failed to save settings', 'error');
    } finally {
      setSaveLoading(false);
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

  // Dept color mapping
  const getDeptClass = (dept) => {
    if (!dept) return 'card-default';
    const mapping = {
      'Computer Science': 'card-cs',
      'Mathematics': 'card-math',
      'Physics': 'card-physics',
      'Chemistry': 'card-chemistry',
    };
    return mapping[dept] || 'card-default';
  };

  return (
    <div className="timetable-gen">
      {/* Notification */}
      {notification && (
        <div className={`notification-toast ${notification.type}`}>
          {notification.type === 'success' ? <Check size={20} /> : <AlertTriangle size={20} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Manual Slot Edit Modal */}
      {editSlot && (
        <div className="modal-overlay">
          <div className="modal-content edit-modal">
            <div className="modal-header-clean">
              <h2>Reschedule & Edit Slot</h2>
              <button className="close-btn" onClick={() => setEditSlot(null)}><X size={20} /></button>
            </div>
            <p className="modal-meta">Modify faculty, subject, classroom or reschedule to a new day and time.</p>

            {/* Inline conflict warning */}
            {editConflict && (
              <div className="conflict-banner">
                <AlertTriangle size={16} />
                <span>{editConflict}</span>
              </div>
            )}

            <div className="modal-form">
              <div className="edit-modal-grid">
                {/* Day */}
                <div className="form-group">
                  <label className="form-label">📅 Day</label>
                  <CustomDropdown
                    id="day"
                    value={editSlot.day}
                    options={currentSettingsDays.map(d => ({ label: d, value: d }))}
                    onChange={val => { setEditConflict(null); setEditSlot({ ...editSlot, day: val }); }}
                    activeDropdown={activeDropdown}
                    setActiveDropdown={setActiveDropdown}
                  />
                </div>

                {/* Time Slot */}
                <div className="form-group">
                  <label className="form-label">🕐 Time Slot</label>
                  <CustomDropdown
                    id="timeslot"
                    value={editSlot.timeSlot}
                    options={timeSlots.filter(s => s !== '13:15-14:00').map(s => ({ label: s, value: s }))}
                    onChange={val => { setEditConflict(null); setEditSlot({ ...editSlot, timeSlot: val }); }}
                    activeDropdown={activeDropdown}
                    setActiveDropdown={setActiveDropdown}
                  />
                </div>

                {/* Faculty */}
                <div className="form-group">
                  <label className="form-label">👨‍🏫 Faculty</label>
                  <CustomDropdown
                    id="faculty"
                    value={editSlot.facultyId}
                    placeholder="Select Faculty"
                    options={faculties.map(f => ({ label: f.name, value: f._id }))}
                    onChange={val => { setEditConflict(null); setEditSlot({ ...editSlot, facultyId: val }); }}
                    activeDropdown={activeDropdown}
                    setActiveDropdown={setActiveDropdown}
                  />
                </div>

                {/* Subject */}
                <div className="form-group">
                  <label className="form-label">📚 Subject</label>
                  <CustomDropdown
                    id="subject"
                    value={editSlot.subjectId}
                    placeholder="Select Subject"
                    options={subjects.map(s => ({ label: s.subjectName, value: s._id }))}
                    onChange={val => { setEditConflict(null); setEditSlot({ ...editSlot, subjectId: val }); }}
                    activeDropdown={activeDropdown}
                    setActiveDropdown={setActiveDropdown}
                  />
                </div>

                {/* Classroom */}
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">🏫 Classroom</label>
                  <CustomDropdown
                    id="classroom"
                    value={editSlot.roomId}
                    placeholder="Select Room"
                    options={classrooms.map(c => ({ label: `${c.roomName} (${c.roomType?.typeName || 'Unknown'})`, value: c._id }))}
                    onChange={val => { setEditConflict(null); setEditSlot({ ...editSlot, roomId: val }); }}
                    activeDropdown={activeDropdown}
                    setActiveDropdown={setActiveDropdown}
                  />
                </div>
              </div>

              {/* Reschedule preview badge */}
              <div className="reschedule-preview">
                <span className="preview-label">Rescheduling to:</span>
                <span className="preview-badge">{editSlot.day}</span>
                <span className="preview-sep">@</span>
                <span className="preview-badge">{editSlot.timeSlot}</span>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setEditSlot(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={saveManualEdit} disabled={updateLoading}>
                {updateLoading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                Save & Reschedule
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Institutional Timetable</h1>
          <p className="page-subtitle">Standardized weekly matrix for department-wise scheduling.</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => setShowSettings(true)}>
            <SettingsIcon size={18} /> <span>Settings</span>
          </button>

          <button className="btn btn-primary" onClick={generateTimetable} disabled={isGenerating}>
            {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
            <span>{isGenerating ? 'Computing...' : 'Auto-Generate'}</span>
          </button>
        </div>
      </div>

      <div className="timetable-container">
        <div className="timetable-main-grid" style={{ '--day-count': currentSettingsDays.length }}>
          {/* Header Row */}
          <div className="corner header-cell">Time / Day</div>
          {currentSettingsDays.map(day => (
            <div key={day} className="header-cell">{day}</div>
          ))}

          {/* Slots Rows */}
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

                  const slots = timetable.filter(t => t.day === day && t.timeSlot === slot);
                  const visibleSlots = slots.slice(0, 2);
                  const hasMore = slots.length > 2;

                  return (
                    <div key={`${day}-${slot}`} className="grid-cell">
                      {slots.length === 0 ? (
                        <div className="empty-slot">• Available Slot</div>
                      ) : (
                        <>
                          {visibleSlots.map(s => (
                            <div
                              key={s._id}
                              className={`schedule-card ${getDeptClass(s.subject?.department)}`}
                            >
                              <div className="card-top">
                                <span className="card-subject" title={s.subject?.subjectName}>{s.subject?.subjectName}</span>
                                <div className="card-hover-actions">
                                  <button onClick={(e) => { e.stopPropagation(); handleEditSlot(s); }}><Edit3 size={10} /></button>
                                  <button onClick={(e) => { e.stopPropagation(); deleteSlot(s._id); }}><Trash2 size={10} /></button>
                                </div>
                              </div>
                              <div className="card-faculty">{s.faculty?.name}</div>
                              <div className="card-room">
                                <MapPin size={8} />
                                {s.classroom?.roomName || s.classroom?.roomNumber}
                              </div>
                            </div>
                          ))}
                          {hasMore && (
                            <div
                              className="more-badge"
                              onClick={() => setActiveSlotsModal({ day, slot, slots })}
                            >
                              +{slots.length - 2} more classes
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

      {/* Extended Slots Modal */}
      {activeSlotsModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header-clean">
              <h2>Schedule Details</h2>
              <button className="close-btn" onClick={() => setActiveSlotsModal(null)}><X size={20} /></button>
            </div>
            <p className="modal-meta">{activeSlotsModal.day} | {activeSlotsModal.slot}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {activeSlotsModal.slots.map(s => (
                <div
                  key={s._id}
                  className={`schedule-card ${getDeptClass(s.subject?.department)}`}
                  style={{ height: 'auto', minHeight: '80px', padding: '1rem' }}
                >
                  <div className="card-top">
                    <span className="card-subject" style={{ fontSize: '1rem' }}>{s.subject?.subjectName}</span>
                    <div className="card-hover-actions" style={{ opacity: 1 }}>
                      <button onClick={() => { handleEditSlot(s); setActiveSlotsModal(null); }}><Edit3 size={14} /></button>
                      <button onClick={() => { deleteSlot(s._id); setActiveSlotsModal(null); }}><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <div className="card-faculty" style={{ fontSize: '0.85rem' }}>{s.faculty?.name}</div>
                  <div className="card-room" style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                    <MapPin size={14} />
                    {s.classroom?.roomName || s.classroom?.roomNumber}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Institutional Settings Modal */}
      {showSettings && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="modal-header-clean">
              <h2>Institutional Setup</h2>
              <button className="close-btn" onClick={() => setShowSettings(false)}><X size={20} /></button>
            </div>
            <p className="modal-meta">Configure working days and special schedules.</p>

            <div className="modal-form">
              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="form-label">Active Working Days</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(day => (
                    <label key={day} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: '#475569', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={settings.workingDays.includes(day)}
                        onChange={(e) => {
                          const newList = e.target.checked 
                            ? [...settings.workingDays, day]
                            : settings.workingDays.filter(d => d !== day);
                          setSettings({ ...settings, workingDays: newList });
                        }}
                      />
                      {day}
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Saturday Configuration</label>
                <select 
                  className="form-input" 
                  value={settings.saturdayMode}
                  onChange={(e) => setSettings({ ...settings, saturdayMode: e.target.value })}
                >
                  <option value="None">No Saturday Classes (Holiday)</option>
                  <option value="All">All Saturdays Working</option>
                  <option value="Alternate">Alternate Saturdays (1st, 3rd, 5th Working)</option>
                </select>
                <p style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.5rem' }}>
                  * Alternate mode calculates status based on the calendar month.
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowSettings(false)}>Dismiss</button>
              <button className="btn btn-primary" onClick={saveSettings} disabled={saveLoading}>
                {saveLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Lock Settings
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .timetable-gen { animation: fadeIn 0.4s ease-out; }
        .page-subtitle { color: #64748B; margin-top: 0.25rem; font-size: 0.95rem; }
        
        .notification-toast {
          position: fixed; top: 1.5rem; right: 1.5rem; padding: 1rem 1.5rem; border-radius: 12px;
          background: white; box-shadow: 0 10px 25px rgba(0,0,0,0.1); z-index: 1000; display: flex; align-items: center; gap: 0.75rem;
          border-left: 5px solid var(--primary); animation: slideInRight 0.3s forwards;
        }
        .notification-toast.error { border-left-color: var(--danger); }

        /* Modal Clean styles */
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6);
          z-index: 2000;
          display: flex; align-items: center; justify-content: center; padding: 2rem 1rem;
          color-scheme: light;
          overflow-y: auto;
        }
        .modal-content {
          background: white; padding: 2.5rem; border-radius: 20px;
          max-height: fit-content;
          width: 100%; text-align: left;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          animation: modalPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          color-scheme: light;
          position: relative;
          overflow: visible !important;
          margin: auto;
        }
        @keyframes modalPop { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
        
        .edit-modal { max-width: 680px !important; overflow: visible !important; }
        .edit-modal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; overflow: visible !important; }
        .modal-form { overflow: visible !important; }
        .modal-header-clean { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
        .modal-header-clean h2 { font-size: 1.5rem; color: #1E293B; }
        .close-btn { background: none; border: none; cursor: pointer; color: #94A3B8; }
        .modal-meta { font-size: 0.9rem; color: #64748B; font-weight: 600; margin-bottom: 1.25rem; border-bottom: 1px solid var(--border); padding-bottom: 1rem; }
        .modal-footer { display: flex; gap: 1rem; margin-top: 2rem; }
        .modal-footer button { flex: 1; height: 48px; font-weight: 700; }

        .conflict-banner {
          display: flex; align-items: center; gap: 0.6rem;
          background: #FEF2F2; border: 1px solid #FECACA; color: #991B1B;
          padding: 0.75rem 1rem; border-radius: 10px; font-weight: 600; font-size: 0.875rem;
          margin-bottom: 1.25rem; animation: fadeIn 0.2s ease;
        }

        .reschedule-preview {
          display: flex; align-items: center; gap: 0.5rem;
          margin-top: 1.25rem; padding: 0.75rem 1rem;
          background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 10px;
          font-size: 0.875rem;
        }
        .preview-label { color: #64748B; font-weight: 600; }
        .preview-badge { background: #2563EB; color: white; padding: 3px 10px; border-radius: 6px; font-weight: 700; font-size: 0.8rem; }
        .preview-sep { color: #94A3B8; font-weight: 700; }

        /* ── Fix: native select popup black-flash ─────────────────────────────
           Browsers can inherit dark color-scheme from a darkened overlay parent,
           making the native OS dropdown appear black for one frame.
           Setting color-scheme:light + explicit background on the select element
           forces the OS to always render the popup with a white background.     */
        .edit-modal select,
        .edit-modal select option {
          background-color: #ffffff !important;
          color: #1E293B !important;
          color-scheme: light !important;
        }

        /* Custom Dropdown UI (Replaces native select to fix black box flash) */
        .custom-dropdown-container { position: relative; width: 100%; }
        .dropdown-trigger {
          width: 100%; padding: 0.75rem 1rem; background: white; border: 1px solid var(--border);
          border-radius: var(--radius-md); display: flex; justify-content: space-between;
          align-items: center; cursor: pointer; transition: all 0.15s ease-in-out;
          font-size: 0.95rem; color: var(--text-main); font-weight: 500;
        }
        .dropdown-trigger:hover { border-color: #CBD5E1; background: #F8FAFC; }
        .dropdown-trigger.open { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15); }
        .dropdown-trigger span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .dropdown-chevron { color: #94A3B8; transition: transform 0.2s; }
        .dropdown-trigger.open .dropdown-chevron { transform: rotate(180deg); color: var(--primary); }

        .dropdown-menu {
          position: absolute; top: calc(100% + 6px); left: 0; right: 0;
          background: white; border: 1px solid #E2E8F0; border-radius: 12px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          z-index: 3000; max-height: 240px; overflow-y: auto;
          animation: dropdownIn 0.15s ease-out;
          scrollbar-width: thin;
          scrollbar-color: #CBD5E1 transparent;
        }

        .dropdown-menu::-webkit-scrollbar { width: 6px; }
        .dropdown-menu::-webkit-scrollbar-track { background: transparent; }
        .dropdown-menu::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
        .dropdown-menu::-webkit-scrollbar-thumb:hover { background: #94A3B8; }
        @keyframes dropdownIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

        .dropdown-option {
          padding: 0.7rem 1rem; cursor: pointer; font-size: 0.9rem; color: #475569;
          transition: all 0.15s; font-weight: 500;
        }
        .dropdown-option:hover { background: #F1F5F9; color: var(--primary); }
        .dropdown-option.selected { background: #EFF6FF; color: var(--primary); font-weight: 600; }
        .dropdown-placeholder { color: #94A3B8; }

        .card-top { display: flex; justify-content: space-between; align-items: flex-start; }
        .card-hover-actions { 
          display: flex; gap: 4px; opacity: 0; transition: opacity 0.2s; 
          background: rgba(255,255,255,0.8); padding: 2px; border-radius: 6px;
        }
        .schedule-card:hover .card-hover-actions { opacity: 1; }
        .card-hover-actions button {
          width: 24px; height: 24px; border-radius: 4px; border: 1px solid rgba(0,0,0,0.05);
          background: white; display: flex; align-items: center; justify-content: center;
          cursor: pointer; color: #64748B;
        }
        .card-hover-actions button:hover { background: #F8FAFC; color: var(--primary); }

        @media print {
          .page-header, .header-actions, .card-hover-actions, .corner { display: none !important; }
          .timetable-container { border: none; box-shadow: none; overflow: visible; }
          .schedule-card { border: 1px solid #CBD5E1 !important; box-shadow: none !important; break-inside: avoid; }
          .grid-cell { border: 0.5pt solid #E2E8F0; }
        }

        @media (max-width: 1024px) {
          .header-actions {
            display: grid;
            grid-template-columns: 1fr 1fr;
            width: 100%;
            gap: 0.75rem;
          }
          .header-actions .btn:last-child {
            grid-column: span 2;
          }
          .edit-modal-grid {
            grid-template-columns: 1fr;
          }
          .modal-footer {
            flex-direction: column;
          }
          .modal-footer .btn { width: 100%; }
          .timetable-main-grid {
            min-width: 800px;
          }
        }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `}</style>
    </div>
  );
};

// ── Custom Dropdown Component ───────────────────────────────────────────────
const CustomDropdown = ({ id, value, options, onChange, placeholder, activeDropdown, setActiveDropdown }) => {
  const isOpen = activeDropdown === id;
  const selectedOption = options.find(o => o.value === value);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleOutsideClick = (e) => {
      if (!e.target.closest(`#cd-${id}`)) setActiveDropdown(null);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen, id, setActiveDropdown]);

  return (
    <div className="custom-dropdown-container" id={`cd-${id}`}>
      <div 
        className={`dropdown-trigger ${isOpen ? 'open' : ''}`} 
        onClick={() => setActiveDropdown(isOpen ? null : id)}
      >
        <span>
          {selectedOption ? selectedOption.label : <span className="dropdown-placeholder">{placeholder}</span>}
        </span>
        <ChevronDown size={18} className="dropdown-chevron" />
      </div>

      {isOpen && (
        <div className="dropdown-menu">
          {options.map((opt) => (
            <div 
              key={opt.value} 
              className={`dropdown-option ${value === opt.value ? 'selected' : ''}`}
              onClick={() => {
                onChange(opt.value);
                setActiveDropdown(null);
              }}
            >
              {opt.label}
            </div>
          ))}
          {options.length === 0 && <div className="dropdown-option-empty">No options available</div>}
        </div>
      )}
    </div>
  );
};

export default TimetableGen;
