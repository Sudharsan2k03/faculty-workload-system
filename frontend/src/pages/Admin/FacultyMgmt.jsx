import { useState, useEffect, useMemo } from 'react';
import api from '../../api';
import { 
  Users, Search, Filter, Plus, Edit2, Trash2, 
  ChevronLeft, ChevronRight, ArrowUpDown, X, 
  CheckCircle, AlertCircle, HelpCircle
} from 'lucide-react';

const FacultyMgmt = () => {
  const [faculties, setFaculties] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({ 
    facultyId: '', name: '', department: '', designation: '', email: '', maxWorkloadHours: '' 
  });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  
  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [desigFilter, setDesigFilter] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  // Sorting State
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  
  // Notification State
  const [notification, setNotification] = useState(null);
  
  // Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [facultyToDelete, setFacultyToDelete] = useState(null);

  // Form Error State
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchFaculties();
  }, []);

  const fetchFaculties = async () => {
    try {
      setIsLoading(true);
      const [facultyRes, deptRes] = await Promise.all([
        api.get('/faculty'),
        api.get('/departments')
      ]);
      setFaculties(facultyRes.data);
      setDepartmentsList(deptRes.data);
    } catch (err) {
      showNotification('Failed to load faculty data', 'error');
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
    if (!formData.facultyId.trim()) newErrors.facultyId = 'Faculty ID is required';
    if (!formData.name.trim()) newErrors.name = 'Full Name is required';
    if (!formData.department.trim()) newErrors.department = 'Department is required';
    if (!formData.designation.trim()) newErrors.designation = 'Designation is required';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!formData.maxWorkloadHours || formData.maxWorkloadHours <= 0) {
      newErrors.maxWorkloadHours = 'Must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (editingId) {
        await api.put(`/faculty/${editingId}`, formData);
        showNotification('Faculty details updated successfully');
      } else {
        await api.post('/faculty', formData);
        showNotification('New faculty added successfully');
      }
      resetForm();
      fetchFaculties();
    } catch (err) {
      const msg = err.response?.data?.message || 'Operation failed';
      showNotification(msg, 'error');
    }
  };

  const resetForm = () => {
    setFormData({ facultyId: '', name: '', department: '', designation: '', email: '', maxWorkloadHours: '' });
    setEditingId(null);
    setShowForm(false);
    setErrors({});
  };

  const handleEdit = (faculty) => {
    setEditingId(faculty._id);
    setFormData({
      facultyId: faculty.facultyId,
      name: faculty.name,
      department: faculty.department,
      designation: faculty.designation,
      email: faculty.email,
      maxWorkloadHours: faculty.maxWorkloadHours
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmDelete = (faculty) => {
    setFacultyToDelete(faculty);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!facultyToDelete) return;
    try {
      await api.delete(`/faculty/${facultyToDelete._id}`);
      showNotification('Faculty member removed');
      setIsDeleteModalOpen(false);
      setFacultyToDelete(null);
      fetchFaculties();
    } catch (err) {
      showNotification('Failed to delete faculty', 'error');
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Derived Data: Filtering & Sorting
  const filteredFaculties = useMemo(() => {
    return faculties.filter(f => {
      const matchesSearch = 
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.facultyId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.department.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDept = !deptFilter || f.department === deptFilter;
      const matchesDesig = !desigFilter || f.designation === desigFilter;
      
      return matchesSearch && matchesDept && matchesDesig;
    }).sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [faculties, searchTerm, deptFilter, desigFilter, sortConfig]);

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredFaculties.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredFaculties.length / itemsPerPage);

  const departments = [...new Set(faculties.map(f => f.department))];
  const designations = [...new Set(faculties.map(f => f.designation))];

  return (
    <div className="faculty-mgmt">
      {/* Notification Toast */}
      {notification && (
        <div className={`notification-toast ${notification.type}`}>
          {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <HelpCircle size={48} color="var(--danger)" />
              <h2>Confirm Deletion</h2>
              <p>Are you sure you want to delete <strong>{facultyToDelete?.name}</strong>? This action cannot be undone.</p>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete Permanently</button>
            </div>
          </div>
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Faculty Management</h1>
          <p className="page-subtitle">Add, edit, and monitor faculty workloads and details.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? <ChevronLeft size={18} /> : <Plus size={18} />}
          {showForm ? 'Back to List' : 'Add New Faculty'}
        </button>
      </div>

      {showForm ? (
        <div className="glass-card animate-slide-in">
          <h2 className="section-title">{editingId ? 'Edit Faculty Details' : 'Register New Faculty'}</h2>
          <form onSubmit={handleSubmit} className="modern-form">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Faculty ID</label>
                <input 
                  className={`form-input ${errors.facultyId ? 'error' : ''}`}
                  placeholder="e.g. FAC101"
                  value={formData.facultyId} 
                  onChange={e => setFormData({ ...formData, facultyId: e.target.value })} 
                />
                {errors.facultyId && <span className="error-msg">{errors.facultyId}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input 
                  className={`form-input ${errors.name ? 'error' : ''}`}
                  placeholder="e.g. Dr. John Doe"
                  value={formData.name} 
                  onChange={e => setFormData({ ...formData, name: e.target.value })} 
                />
                {errors.name && <span className="error-msg">{errors.name}</span>}
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
                <label className="form-label">Designation</label>
                <input 
                  className={`form-input ${errors.designation ? 'error' : ''}`}
                  placeholder="e.g. Assistant Professor"
                  value={formData.designation} 
                  onChange={e => setFormData({ ...formData, designation: e.target.value })} 
                />
                {errors.designation && <span className="error-msg">{errors.designation}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input 
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  type="email"
                  placeholder="john.doe@university.edu"
                  value={formData.email} 
                  onChange={e => setFormData({ ...formData, email: e.target.value })} 
                />
                {errors.email && <span className="error-msg">{errors.email}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Weekly Max Workload (Hrs)</label>
                <input 
                  className={`form-input ${errors.maxWorkloadHours ? 'error' : ''}`}
                  type="number"
                  placeholder="e.g. 40"
                  value={formData.maxWorkloadHours} 
                  onChange={e => setFormData({ ...formData, maxWorkloadHours: e.target.value })} 
                />
                {errors.maxWorkloadHours && <span className="error-msg">{errors.maxWorkloadHours}</span>}
              </div>
            </div>
            
            <div className="form-footer">
              <button className="btn btn-secondary" type="button" onClick={resetForm}>Cancel</button>
              <button className="btn btn-primary" type="submit">
                {editingId ? 'Save Changes' : 'Register Faculty'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="faculty-list-view">
          {/* Filters Bar */}
          <div className="filters-card glass-panel">
            <div className="search-box">
              <Search size={18} className="search-icon" />
              <input 
                type="text" 
                placeholder="Search name, ID, or department..." 
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
              
              <div className="filter-group">
                <Filter size={14} />
                <select value={desigFilter} onChange={e => { setDesigFilter(e.target.value); setCurrentPage(1); }}>
                  <option value="">All Designations</option>
                  {designations.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th onClick={() => handleSort('facultyId')} className="sortable">
                    ID <ArrowUpDown size={14} />
                  </th>
                  <th onClick={() => handleSort('name')} className="sortable">
                    Name <ArrowUpDown size={14} />
                  </th>
                  <th onClick={() => handleSort('department')} className="sortable">
                    Department <ArrowUpDown size={14} />
                  </th>
                  <th>Designation</th>
                  <th>Email</th>
                  <th>Workload Progress</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="skeleton-row">
                      <td colSpan="7"><div className="skeleton-bar"></div></td>
                    </tr>
                  ))
                ) : currentItems.map((f) => {
                  const workloadPercent = Math.min((f.currentWorkload / f.maxWorkloadHours) * 100, 100);
                  const isOverloaded = f.currentWorkload > f.maxWorkloadHours;
                  
                  return (
                    <tr key={f._id} className="row-hover">
                      <td className="font-semibold">{f.facultyId}</td>
                      <td>
                        <div className="user-profile">
                          <div className="avatar">{f.name.charAt(0)}</div>
                          <span>{f.name}</span>
                        </div>
                      </td>
                      <td><span className="dept-tag">{f.department}</span></td>
                      <td>{f.designation}</td>
                      <td className="text-muted text-sm">{f.email}</td>
                      <td>
                        <div className="workload-visual">
                          <div className="workload-info">
                            <span>{f.currentWorkload || 0} / {f.maxWorkloadHours}</span>
                            <span className={`status-badge ${isOverloaded ? 'over' : 'ok'}`}>
                              {isOverloaded ? 'Over Limit' : 'On Track'}
                            </span>
                          </div>
                          <div className="progress-track">
                            <div 
                              className={`progress-bar ${isOverloaded ? 'danger' : workloadPercent > 80 ? 'warning' : 'success'}`} 
                              style={{ width: `${workloadPercent}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="action-btns">
                          <button className="icon-btn edit" title="Edit Faculty" onClick={() => handleEdit(f)}>
                            <Edit2 size={16} />
                          </button>
                          <button className="icon-btn delete" title="Delete Faculty" onClick={() => confirmDelete(f)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {!isLoading && currentItems.length === 0 && (
              <div className="no-records">
                <Users size={40} />
                <p>No faculty members found matching your criteria.</p>
              </div>
            )}
          </div>

          {/* Pagination Controls */}
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
        .faculty-mgmt {
          animation: fadeIn 0.3s ease-out;
        }

        .page-subtitle { color: var(--text-muted); margin-top: 0.25rem; font-size: 0.95rem; }

        /* Form Styles */
        .modern-form { margin-top: 1.5rem; }
        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }
        .form-footer {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          border-top: 1px solid var(--border);
          padding-top: 1.5rem;
        }

        .error-msg { color: var(--danger); font-size: 0.75rem; margin-top: 0.25rem; font-weight: 500; }
        .form-input.error { border-color: var(--danger); background-color: #FFF5F5; }

        /* Filters */
        .filters-card {
          margin-bottom: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 2rem;
          flex-wrap: wrap;
        }
        .search-box {
          position: relative;
          flex: 1;
          min-width: 300px;
        }
        .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94A3B8; }
        .search-box input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 2.75rem;
          border-radius: 10px;
          border: 1px solid var(--border);
          outline: none;
          transition: all 0.2s;
          font-size: 0.9rem;
        }
        .search-box input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); }

        .dropdown-filters { display: flex; gap: 1rem; }
        .filter-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: white;
          border: 1px solid var(--border);
          padding: 0.4rem 0.8rem;
          border-radius: 8px;
          color: #64748B;
        }
        .filter-group select { border: none; outline: none; background: transparent; font-size: 0.85rem; font-weight: 600; color: #1E293B; }

        /* Table Components */
        .sortable { cursor: pointer; transition: background 0.2s; }
        .sortable:hover { background: #F1F5F9 !important; }
        .sortable svg { display: inline; margin-left: 4px; vertical-align: middle; opacity: 0.5; }

        .row-hover:hover td { background-color: #F8FAFC; }
        td { vertical-align: middle; padding: 1rem 1.25rem; }
        .user-profile { display: flex; align-items: center; gap: 0.75rem; }
        .avatar {
          width: 32px; height: 32px;
          background: var(--primary);
          color: white;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 0.85rem;
        }
        .dept-tag { 
          background: #EEF2FF; color: #4338CA; 
          padding: 4px 10px; border-radius: 6px; 
          font-size: 0.75rem; font-weight: 700; 
          display: inline-flex;
          align-items: center;
          justify-content: center;
          white-space: nowrap;
          text-align: center;
        }
        
        /* Workload Visual */
        .workload-visual { width: 140px; }
        .workload-info { 
          display: flex; 
          justify-content: space-between; 
          font-size: 0.75rem; 
          font-weight: 700; 
          margin-bottom: 4px; 
        }
        .status-badge { font-size: 0.65rem; padding: 1px 4px; border-radius: 4px; }
        .status-badge.ok { background: #DCFCE7; color: #166534; }
        .status-badge.over { background: #FEE2E2; color: #991B1B; }

        .progress-track { height: 6px; background: #E2E8F0; border-radius: 3px; overflow: hidden; }
        .progress-bar { height: 100%; border-radius: 3px; }
        .progress-bar.success { background: var(--secondary); }
        .progress-bar.warning { background: var(--warning); }
        .progress-bar.danger { background: var(--danger); }

        /* Action Buttons */
        .action-btns { display: flex; gap: 0.5rem; }
        .icon-btn {
          width: 34px; height: 34px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: white;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s;
        }
        .icon-btn.edit:hover { color: var(--primary); border-color: var(--primary); background: #EFF6FF; }
        .icon-btn.delete:hover { color: var(--danger); border-color: var(--danger); background: #FEF2F2; }

        /* Pagination */
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

        /* Notification Toast */
        .notification-toast {
          position: fixed; top: 1.5rem; right: 1.5rem;
          padding: 1rem 1.5rem; border-radius: 12px;
          background: white; color: #1E293B;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          z-index: 1000; display: flex; align-items: center; gap: 0.75rem;
          font-weight: 600; border-left: 5px solid transparent;
          animation: slideInRight 0.3s forwards;
        }
        .notification-toast.success { border-left-color: var(--secondary); color: #065F46; }
        .notification-toast.error { border-left-color: var(--danger); color: #991B1B; }

        /* Modal */
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(4px); z-index: 2000;
          display: flex; align-items: center; justify-content: center; padding: 1rem;
        }
        .modal-content {
          background: white; padding: 2.5rem; border-radius: 20px;
          max-width: 440px; width: 100%; text-align: center;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          animation: modalPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .modal-header h2 { margin: 1.5rem 0 0.5rem; font-size: 1.5rem; }
        .modal-header p { color: #64748B; line-height: 1.5; margin-bottom: 2rem; }
        .modal-actions { display: flex; gap: 1rem; }
        .modal-actions button { flex: 1; padding: 0.75rem; font-weight: 700; height: 48px; }

        .no-records { 
          text-align: center; padding: 4rem; color: #94A3B8; 
          display: flex; flex-direction: column; align-items: center; gap: 1rem;
        }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes modalPop { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      `}</style>
    </div>
  );
};

export default FacultyMgmt;
