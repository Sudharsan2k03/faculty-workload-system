import { useState, useEffect, useMemo } from 'react';
import api from '../../api';
import { 
  BookOpen, Search, Filter, Plus, Edit2, Trash2, 
  ChevronLeft, ChevronRight, ArrowUpDown, X, 
  CheckCircle, AlertCircle, HelpCircle, Loader2
} from 'lucide-react';

const SubjectMgmt = () => {
  const [subjects, setSubjects] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({ 
    subjectId: '', subjectName: '', department: '', hoursPerWeek: '' 
  });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  
  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  // Sorting State
  const [sortConfig, setSortConfig] = useState({ key: 'subjectName', direction: 'asc' });
  
  // Notification State
  const [notification, setNotification] = useState(null);
  
  // Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [targetSubject, setTargetSubject] = useState(null);

  // Form Error State
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setIsLoading(true);
      const [subRes, deptRes] = await Promise.all([
        api.get('/subjects'),
        api.get('/departments')
      ]);
      setSubjects(subRes.data);
      setDepartmentsList(deptRes.data);
    } catch (err) {
      showNotification('Failed to load subjects', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.subjectId.trim()) newErrors.subjectId = 'Subject ID is required';
    if (!formData.subjectName.trim()) newErrors.subjectName = 'Subject Name is required';
    if (!formData.department.trim()) newErrors.department = 'Department is required';
    
    if (!formData.hoursPerWeek || formData.hoursPerWeek <= 0) {
      newErrors.hoursPerWeek = 'Hours must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (editingId) {
        await api.put(`/subjects/${editingId}`, formData);
        showNotification('Subject updated successfully');
      } else {
        await api.post('/subjects', formData);
        showNotification('New subject added successfully');
      }
      resetForm();
      fetchSubjects();
    } catch (err) {
      const msg = err.response?.data?.message || 'Operation failed';
      showNotification(msg, 'error');
    }
  };

  const resetForm = () => {
    setFormData({ subjectId: '', subjectName: '', department: '', hoursPerWeek: '' });
    setEditingId(null);
    setShowForm(false);
    setErrors({});
  };

  const handleEdit = (subject) => {
    setEditingId(subject._id);
    setFormData({
      subjectId: subject.subjectId,
      subjectName: subject.subjectName,
      department: subject.department,
      hoursPerWeek: subject.hoursPerWeek
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmDelete = (subject) => {
    setTargetSubject(subject);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!targetSubject) return;
    try {
      await api.delete(`/subjects/${targetSubject._id}`);
      showNotification('Subject removed successfully');
      setIsDeleteModalOpen(false);
      setTargetSubject(null);
      fetchSubjects();
    } catch (err) {
      showNotification('Failed to delete subject', 'error');
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Derived Data
  const filteredSubjects = useMemo(() => {
    return subjects.filter(s => {
      const matchesSearch = 
        s.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.subjectId.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDept = !deptFilter || s.department === deptFilter;
      
      return matchesSearch && matchesDept;
    }).sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [subjects, searchTerm, deptFilter, sortConfig]);

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSubjects.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSubjects.length / itemsPerPage);

  const departments = [...new Set(subjects.map(s => s.department))];

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
              <h2>Confirm Deletion</h2>
              <p>Are you sure you want to delete <strong>{targetSubject?.subjectName}</strong>? This will also remove any related workloads.</p>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete Subject</button>
            </div>
          </div>
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Subject Management</h1>
          <p className="page-subtitle">Configure your institution's curriculum and credit hours.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? <ChevronLeft size={18} /> : <Plus size={18} />}
          {showForm ? 'Back to List' : 'Add New Subject'}
        </button>
      </div>

      {showForm ? (
        <div className="glass-card animate-slide-in">
          <h2 className="section-title">{editingId ? 'Edit Subject' : 'Register New Subject'}</h2>
          <form onSubmit={handleSubmit} className="modern-form">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Subject ID</label>
                <input 
                  className={`form-input ${errors.subjectId ? 'error' : ''}`}
                  placeholder="e.g. CS101"
                  value={formData.subjectId} 
                  onChange={e => setFormData({ ...formData, subjectId: e.target.value })} 
                />
                {errors.subjectId && <span className="error-msg">{errors.subjectId}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Subject Name</label>
                <input 
                  className={`form-input ${errors.subjectName ? 'error' : ''}`}
                  placeholder="e.g. Data Structures"
                  value={formData.subjectName} 
                  onChange={e => setFormData({ ...formData, subjectName: e.target.value })} 
                />
                {errors.subjectName && <span className="error-msg">{errors.subjectName}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <select 
                  className={`form-input ${errors.department ? 'error' : ''}`}
                  value={formData.department} 
                  onChange={e => setFormData({ ...formData, department: e.target.value })}
                >
                  <option value="">Select Department</option>
                  {departmentsList.map(d => (
                    <option key={d._id} value={d.name}>{d.name}</option>
                  ))}
                </select>
                {errors.department && <span className="error-msg">{errors.department}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Hours per Week</label>
                <input 
                  className={`form-input ${errors.hoursPerWeek ? 'error' : ''}`}
                  type="number"
                  placeholder="e.g. 4"
                  value={formData.hoursPerWeek} 
                  onChange={e => setFormData({ ...formData, hoursPerWeek: e.target.value })} 
                />
                {errors.hoursPerWeek && <span className="error-msg">{errors.hoursPerWeek}</span>}
              </div>
            </div>
            
            <div className="form-footer">
              <button className="btn btn-secondary" type="button" onClick={resetForm}>Cancel</button>
              <button className="btn btn-primary" type="submit">
                {editingId ? 'Update Subject' : 'Add Subject'}
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
                placeholder="Search subject by ID or name..." 
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>
            
            <div className="dropdown-filters">
              <div className="filter-group">
                <Filter size={14} />
                <select value={deptFilter} onChange={e => { setDeptFilter(e.target.value); setCurrentPage(1); }}>
                  <option value="">All Departments</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th onClick={() => handleSort('subjectId')} className="sortable">ID <ArrowUpDown size={14} /></th>
                  <th onClick={() => handleSort('subjectName')} className="sortable">Subject Name <ArrowUpDown size={14} /></th>
                  <th onClick={() => handleSort('department')} className="sortable">Department <ArrowUpDown size={14} /></th>
                  <th>Hours/Week</th>
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
                ) : currentItems.map((s) => (
                  <tr key={s._id} className="row-hover">
                    <td className="font-semibold">{s.subjectId}</td>
                    <td style={{ fontWeight: '600' }}>{s.subjectName}</td>
                    <td>
                      <span className="dept-tag">{s.department}</span>
                    </td>
                    <td>
                      <span className="badge badge-primary">{s.hoursPerWeek} hrs</span>
                    </td>
                    <td>
                      <div className="action-btns">
                        <button className="icon-btn edit" onClick={() => handleEdit(s)}>
                          <Edit2 size={16} />
                        </button>
                        <button className="icon-btn delete" onClick={() => confirmDelete(s)}>
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
                <BookOpen size={40} />
                <p>No subjects found.</p>
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
        .modern-form { margin-top: 1.5rem; }
        .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
        .form-footer { display: flex; justify-content: flex-end; gap: 1rem; border-top: 1px solid var(--border); padding-top: 1.5rem; }
        .error-msg { color: var(--danger); font-size: 0.75rem; margin-top: 0.25rem; font-weight: 500; }
        .form-input.error { border-color: var(--danger); background-color: #FFF5F5; }
        
        .filters-card { margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; gap: 2rem; flex-wrap: wrap; }
        .search-box { position: relative; flex: 1; min-width: 300px; }
        .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94A3B8; }
        .search-box input { width: 100%; padding: 0.75rem 1rem 0.75rem 2.75rem; border-radius: 10px; border: 1px solid var(--border); outline: none; transition: all 0.2s; font-size: 0.9rem; }
        .search-box input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); }
        .dropdown-filters { display: flex; gap: 1rem; }
        .filter-group { display: flex; align-items: center; gap: 0.5rem; background: white; border: 1px solid var(--border); padding: 0.4rem 0.8rem; border-radius: 8px; }
        .filter-group select { border: none; outline: none; background: transparent; font-size: 0.85rem; font-weight: 600; color: #1E293B; }
        
        .sortable { cursor: pointer; }
        .sortable:hover { background: #F1F5F9 !important; }
        .sortable svg { vertical-align: middle; opacity: 0.5; margin-left: 4px; }
        .row-hover:hover td { background-color: #F8FAFC; }
        td { vertical-align: middle; padding: 1.25rem 1rem; }
        
        .dept-tag { 
          background: #EEF2FF; color: #4338CA; 
          padding: 4px 10px; border-radius: 6px; 
          font-size: 0.75rem; font-weight: 700; 
          display: inline-flex; align-items: center; justify-content: center;
          white-space: nowrap;
        }

        .action-btns { display: flex; gap: 0.5rem; }
        .icon-btn {
          width: 34px; height: 34px; border: 1px solid var(--border); border-radius: 8px;
          background: white; display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s;
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
          position: fixed; top: 1.5rem; right: 1.5rem;
          padding: 1rem 1.5rem; border-radius: 12px; background: white;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1); z-index: 1000; display: flex; align-items: center; gap: 0.75rem;
          border-left: 5px solid transparent; animation: slideInRight 0.3s forwards;
        }
        .notification-toast.success { border-left-color: var(--secondary); color: #065F46; }
        .notification-toast.error { border-left-color: var(--danger); color: #991B1B; }

        .modal-overlay {
          position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(4px);
          z-index: 2000; display: flex; align-items: center; justify-content: center;
        }
        .modal-content {
          background: white; padding: 2.5rem; border-radius: 20px; max-width: 440px; width: 100%; text-align: center;
        }
        .modal-actions { display: flex; gap: 1rem; margin-top: 2rem; }
        .modal-actions button { flex: 1; padding: 0.75rem; font-weight: 700; height: 48px; }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `}</style>
    </div>
  );
};

export default SubjectMgmt;
