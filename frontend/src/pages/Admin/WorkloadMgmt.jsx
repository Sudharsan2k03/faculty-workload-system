import { useState, useEffect, useMemo } from 'react';
import api from '../../api';
import { 
  ClipboardList, Search, Filter, Plus, Edit2, Trash2, 
  ChevronLeft, ChevronRight, ArrowUpDown, X, 
  CheckCircle, AlertCircle, HelpCircle, Loader2,
  User, Book, Clock, ChevronDown
} from 'lucide-react';

const WorkloadMgmt = () => {
  const [workloads, setWorkloads] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({ facultyId: '', subjectId: '', assignedHours: '' });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  
  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  // Sorting State
  const [sortConfig, setSortConfig] = useState({ key: 'facultyName', direction: 'asc' });
  
  // Notification State
  const [notification, setNotification] = useState(null);
  
  // Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [targetWorkload, setTargetWorkload] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [wRes, fRes, sRes] = await Promise.all([
        api.get('/workloads'),
        api.get('/faculty'),
        api.get('/subjects')
      ]);
      setWorkloads(wRes.data);
      setFaculties(fRes.data);
      setSubjects(sRes.data);
    } catch (err) {
      showNotification('Failed to load workload data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/workloads/${editingId}`, formData);
        showNotification('Workload allocation updated');
      } else {
        await api.post('/workloads', formData);
        showNotification('Workload assigned successfully');
      }
      resetForm();
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Operation failed';
      showNotification(msg, 'error');
    }
  };

  const resetForm = () => {
    setFormData({ facultyId: '', subjectId: '', assignedHours: '' });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (workload) => {
    setEditingId(workload._id);
    setFormData({
      facultyId: workload.facultyId?._id || '',
      subjectId: workload.subjectId?._id || '',
      assignedHours: workload.assignedHours
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmDelete = (workload) => {
    setTargetWorkload(workload);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!targetWorkload) return;
    try {
      await api.delete(`/workloads/${targetWorkload._id}`);
      showNotification('Workload assignment removed');
      setIsDeleteModalOpen(false);
      setTargetWorkload(null);
      fetchData();
    } catch (err) {
      showNotification('Failed to remove assignment', 'error');
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Derived Data: Flatten for easier search/sort
  const flattenedWorkloads = useMemo(() => {
    return workloads.map(w => ({
      ...w,
      facultyName: w.facultyId?.name || 'Unknown',
      subjectName: w.subjectId?.subjectName || 'Unknown',
      dept: w.facultyId?.department || 'Unknown'
    }));
  }, [workloads]);

  const filteredWorkloads = useMemo(() => {
    return flattenedWorkloads.filter(w => {
      const matchesSearch = 
        w.facultyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.subjectName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDept = !deptFilter || w.dept === deptFilter;
      
      return matchesSearch && matchesDept;
    }).sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [flattenedWorkloads, searchTerm, deptFilter, sortConfig]);

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredWorkloads.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredWorkloads.length / itemsPerPage);

  const departments = [...new Set(faculties.map(f => f.department))];

  // Helper: Find selected faculty info for warning
  const selectedFaculty = faculties.find(f => f._id === formData.facultyId);
  const selectedSubject = subjects.find(s => s._id === formData.subjectId);

  return (
    <div className="module-mgmt">
      {/* Notification Toast */}
      {notification && (
        <div className={`notification-toast ${notification.type}`}>
          {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <HelpCircle size={48} color="var(--danger)" />
              <h2>Confirm Removal</h2>
              <p>Are you sure you want to remove the assignment of <strong>{targetWorkload?.subjectName}</strong> from <strong>{targetWorkload?.facultyName}</strong>?</p>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Remove Assignment</button>
            </div>
          </div>
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Workload Allocation</h1>
          <p className="page-subtitle">Distribute subjects and hours across faculty members.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? <ChevronLeft size={18} /> : <Plus size={18} />}
          {showForm ? 'Back to List' : 'Assign New Workload'}
        </button>
      </div>

      {showForm ? (
        <div className="glass-card animate-slide-in">
          <h2 className="section-title">{editingId ? 'Modify Assignment' : 'New Workload Assignment'}</h2>
          
          {selectedFaculty && (
            <div className="info-banner">
              <User size={18} />
              <span>
                <strong>{selectedFaculty.name}</strong> current workload: 
                <strong> {selectedFaculty.currentWorkload || 0} / {selectedFaculty.maxWorkloadHours}</strong> hours.
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="modern-form">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Faculty Member</label>
                <select 
                  className="form-input"
                  required 
                  value={formData.facultyId} 
                  onChange={e => setFormData({ ...formData, facultyId: e.target.value })}
                  disabled={!!editingId} // Prevent faculty change on edit to preserve uniqueness logic simply
                >
                  <option value="">Select Faculty...</option>
                  {faculties.map(f => (
                    <option key={f._id} value={f._id}>{f.name} ({f.department})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Subject</label>
                <select 
                  className="form-input"
                  required 
                  value={formData.subjectId} 
                  onChange={e => {
                    const sbj = subjects.find(s => s._id === e.target.value);
                    setFormData({ ...formData, subjectId: e.target.value, assignedHours: sbj ? sbj.hoursPerWeek : '' });
                  }}
                  disabled={!!editingId}
                >
                  <option value="">Select Subject...</option>
                  {subjects.map(s => (
                    <option key={s._id} value={s._id}>{s.subjectName} ({s.hoursPerWeek} hrs)</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Assigned Hours per Week</label>
                <div className="input-with-icon">
                  <Clock size={16} className="input-icon" />
                  <input 
                    className="form-input"
                    type="number" 
                    required 
                    placeholder="e.g. 4"
                    value={formData.assignedHours} 
                    onChange={e => setFormData({ ...formData, assignedHours: e.target.value })} 
                  />
                </div>
              </div>
            </div>

            {selectedFaculty && selectedSubject && formData.assignedHours && (
              <div className={`workload-preview ${(selectedFaculty.currentWorkload || 0) + Number(formData.assignedHours) > selectedFaculty.maxWorkloadHours ? 'danger' : 'success'}`}>
                { (selectedFaculty.currentWorkload || 0) + Number(formData.assignedHours) > selectedFaculty.maxWorkloadHours ? 
                  <AlertCircle size={16} /> : <CheckCircle size={16} />
                }
                <span>
                  Resulting Workload: <strong>{(selectedFaculty.currentWorkload || 0) + Number(formData.assignedHours)} / {selectedFaculty.maxWorkloadHours}</strong> hours.
                </span>
              </div>
            )}
            
            <div className="form-footer">
              <button className="btn btn-secondary" type="button" onClick={resetForm}>Cancel</button>
              <button className="btn btn-primary" type="submit">
                {editingId ? 'Update Allocation' : 'Complete Assignment'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="list-view">
          <div className="filters-card glass-panel">
            <div className="search-box">
              <Search size={18} className="search-icon" />
              <input 
                type="text" 
                placeholder="Search faculty or subject..." 
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>
            
            <div className="dropdown-filters">
              <div className="filter-group">
                <Filter size={18} className="filter-icon" />
                <select className="filter-select" value={deptFilter} onChange={e => { setDeptFilter(e.target.value); setCurrentPage(1); }}>
                  <option value="">All Departments</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <ChevronDown size={16} className="dropdown-chevron" />
              </div>
            </div>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th onClick={() => handleSort('facultyName')} className="sortable">Faculty <ArrowUpDown size={14} /></th>
                  <th onClick={() => handleSort('dept')} className="sortable">Dept <ArrowUpDown size={14} /></th>
                  <th onClick={() => handleSort('subjectName')} className="sortable">Subject <ArrowUpDown size={14} /></th>
                  <th onClick={() => handleSort('assignedHours')} className="sortable">Hrs <ArrowUpDown size={14} /></th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="skeleton-row">
                      <td colSpan="5"><div className="skeleton-bar"></div></td>
                    </tr>
                  ))
                ) : currentItems.map((w) => (
                  <tr key={w._id} className="row-hover">
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="avatar-mini">{w.facultyName.charAt(0)}</div>
                        <span style={{ fontWeight: 600 }}>{w.facultyName}</span>
                      </div>
                    </td>
                    <td><span className="dept-tag">{w.dept}</span></td>
                    <td>
                      <div className="subject-box">
                        <Book size={14} />
                        <span>{w.subjectName}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-primary">{w.assignedHours} hrs</span>
                    </td>
                    <td>
                      <div className="action-btns">
                        <button className="icon-btn edit" onClick={() => handleEdit(w)}>
                          <Edit2 size={16} />
                        </button>
                        <button className="icon-btn delete" onClick={() => confirmDelete(w)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {!isLoading && currentItems.length === 0 && (
              <div className="no-records">
                <ClipboardList size={40} />
                <p>No workload assignments found.</p>
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="pagination-container">
              <div className="pagination-buttons">
                <button 
                  disabled={currentPage === 1} 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
                  className="page-btn nav"
                >
                  <ChevronLeft size={16} />
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => (
                  <button 
                    key={i + 1} 
                    className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`} 
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                
                <button 
                  disabled={currentPage === totalPages} 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} 
                  className="page-btn nav"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        .module-mgmt { animation: fadeIn 0.3s ease-out; }
        .page-subtitle { color: var(--text-muted); margin-top: 0.25rem; font-size: 0.95rem; }
        
        .info-banner {
          background: #EFF6FF; border: 1px solid #BFDBFE; color: #1E40AF;
          padding: 0.75rem 1.25rem; border-radius: 10px; display: flex; align-items: center; gap: 0.75rem;
          margin-bottom: 1.5rem; font-size: 0.9rem;
        }

        .workload-preview {
          padding: 0.75rem 1.25rem; border-radius: 10px; display: flex; align-items: center; gap: 0.75rem;
          margin: 1rem 0; font-size: 0.9rem; font-weight: 600;
        }
        .workload-preview.success { background: #ECFDF5; color: #065F46; border: 1px solid #A7F3D0; }
        .workload-preview.danger { background: #FEF2F2; color: #991B1B; border: 1px solid #FECACA; }

        .modern-form { margin-top: 1rem; }
        .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; }
        .input-with-icon { position: relative; }
        .input-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94A3B8; }
        .input-with-icon .form-input { padding-left: 2.5rem; }

        .filters-card { margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; gap: 2rem; flex-wrap: wrap; }
        .search-box { position: relative; flex: 1; min-width: 300px; }
        .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94A3B8; }
        .search-box input { width: 100%; padding: 0.75rem 1rem 0.75rem 2.75rem; border-radius: 10px; border: 1px solid var(--border); outline: none; background: white; }
        
        .dropdown-filters { display: flex; align-items: center; }
        .filter-group { position: relative; display: flex; align-items: center; width: 100%; }
        .filter-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: #64748B; pointer-events: none; z-index: 1; }
        .dropdown-chevron { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); color: #64748B; pointer-events: none; z-index: 1; }
        .filter-select {
          appearance: none; -webkit-appearance: none;
          width: 100%; min-width: 220px;
          padding: 0.75rem 2.5rem 0.75rem 2.5rem;
          border-radius: 10px; border: 1px solid var(--border);
          outline: none; background: white;
          font-weight: 600; color: #1E293B; cursor: pointer;
          font-family: inherit; font-size: 0.95rem; display: block;
        }
        .filter-select:focus, .search-box input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); }
        .filter-select:hover, .search-box input:hover { border-color: #cbd5e1; }
        
        .sortable { cursor: pointer; }
        .sortable:hover { background: #F1F5F9 !important; }
        .row-hover:hover td { background-color: #F8FAFC; }
        td { vertical-align: middle; padding: 1.25rem 1rem; }
        
        .avatar-mini { 
          width: 28px; height: 28px; background: var(--primary); color: white; border-radius: 50%;
          display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 700;
        }

        .subject-box { display: flex; align-items: center; gap: 0.5rem; color: #475569; font-weight: 600; }
        .dept-tag { 
          background: #EEF2FF; color: #4338CA; padding: 4px 10px; border-radius: 6px; 
          font-size: 0.75rem; font-weight: 700;
        }

        .action-btns { display: flex; gap: 0.5rem; }
        .icon-btn {
          width: 34px; height: 34px; border: 1px solid var(--border); border-radius: 8px;
          background: white; display: flex; align-items: center; justify-content: center; cursor: pointer;
        }
        .icon-btn.edit:hover { color: var(--primary); border-color: var(--primary); background: #EFF6FF; }
        .icon-btn.delete:hover { color: var(--danger); border-color: var(--danger); background: #FEF2F2; }

        .pagination-container { display: flex; justify-content: center; align-items: center; margin-top: 2rem; }
        .pagination-buttons { display: flex; align-items: center; gap: 0.5rem; }
        .page-btn {
          min-width: 36px; height: 36px; padding: 0 0.75rem; display: flex; align-items: center; justify-content: center;
          border-radius: 8px; border: 1px solid #E2E8F0; background: white; cursor: pointer;
          font-size: 0.875rem; font-weight: 600; color: #475569; transition: all 0.2s;
        }
        .page-btn:hover:not(:disabled):not(.active) { background: #F8FAFC; border-color: #CBD5E1; color: var(--primary); }
        .page-btn.active { background: #2563EB; color: white; border-color: #2563EB; box-shadow: 0 4px 10px rgba(37, 99, 235, 0.2); }
        .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .page-btn.nav { padding: 0; width: 36px; }

        .notification-toast {
          position: fixed; top: 1.5rem; right: 1.5rem; padding: 1rem 1.5rem; border-radius: 12px;
          background: white; box-shadow: 0 10px 25px rgba(0,0,0,0.1); z-index: 1000; display: flex; align-items: center; gap: 0.75rem;
          border-left: 5px solid transparent; animation: slideInRight 0.3s forwards;
        }
        .notification-toast.success { border-left-color: var(--secondary); color: #065F46; }
        .notification-toast.error { border-left-color: var(--danger); color: #991B1B; }

        .modal-overlay {
          position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(4px);
          z-index: 2000; display: flex; align-items: center; justify-content: center;
        }
        .modal-content { background: white; padding: 2.5rem; border-radius: 20px; max-width: 440px; width: 100%; text-align: center; }
        .modal-actions { display: flex; gap: 1rem; margin-top: 2rem; }
        .modal-actions button { flex: 1; padding: 0.75rem; font-weight: 700; height: 48px; }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `}</style>
    </div>
  );
};

export default WorkloadMgmt;
