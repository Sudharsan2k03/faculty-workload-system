import { useState, useEffect, useMemo } from 'react';
import api from '../../api';
import { 
  Building2, Search, Plus, Edit2, Trash2, 
  ChevronLeft, ChevronRight, ArrowUpDown, X, 
  CheckCircle, AlertCircle, Loader2
} from 'lucide-react';

const DepartmentMgmt = () => {
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({ 
    departmentId: '', name: '', description: '' 
  });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  
  // Search State
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  // Sorting State
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  
  // Notification State
  const [notification, setNotification] = useState(null);
  
  // Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [targetDept, setTargetDept] = useState(null);

  // Form Error State
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get('/departments');
      setDepartments(data);
    } catch (err) {
      showNotification('Failed to load departments', 'error');
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
    if (!formData.departmentId.trim()) newErrors.departmentId = 'Department ID is required';
    if (!formData.name.trim()) newErrors.name = 'Department Name is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (editingId) {
        await api.put(`/departments/${editingId}`, formData);
        showNotification('Department updated successfully');
      } else {
        await api.post('/departments', formData);
        showNotification('New department added successfully');
      }
      resetForm();
      fetchDepartments();
    } catch (err) {
      const msg = err.response?.data?.message || 'Operation failed';
      showNotification(msg, 'error');
    }
  };

  const resetForm = () => {
    setFormData({ departmentId: '', name: '', description: '' });
    setEditingId(null);
    setShowForm(false);
    setErrors({});
  };

  const handleEdit = (dept) => {
    setEditingId(dept._id);
    setFormData({ 
      departmentId: dept.departmentId, 
      name: dept.name, 
      description: dept.description || ''
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmDelete = (dept) => {
    setTargetDept(dept);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!targetDept) return;
    try {
      await api.delete(`/departments/${targetDept._id}`);
      showNotification('Department removed');
      setIsDeleteModalOpen(false);
      setTargetDept(null);
      fetchDepartments();
    } catch (err) {
      showNotification('Failed to remove department', 'error');
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Searching & Sorting
  const processedDepartments = useMemo(() => {
    let result = departments;

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      result = result.filter(d => 
        d.name.toLowerCase().includes(lowerSearch) || 
        d.departmentId.toLowerCase().includes(lowerSearch)
      );
    }

    result.sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
      if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [departments, searchTerm, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(processedDepartments.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = processedDepartments.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="module-mgmt">
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
            <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--danger)', marginBottom: '1rem' }}>
              <AlertCircle size={48} strokeWidth={1.5} />
            </div>
            <h2>Remove Department?</h2>
            <p>Are you sure you want to delete <strong>{targetDept?.name}</strong>? This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete Department</button>
            </div>
          </div>
        </div>
      )}

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A' }}>Department Management</h1>
          <p className="page-subtitle">Manage institution departments.</p>
        </div>
        {!showForm && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={18} /> Add Department
          </button>
        )}
      </div>

      {showForm ? (
        <div className="glass-card animate-slide-in">
          <h2 className="section-title">{editingId ? 'Edit Department Details' : 'Register New Department'}</h2>
          <form onSubmit={handleSubmit} className="modern-form">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Department ID</label>
                <div className="input-with-icon">
                  <Building2 size={16} className="input-icon" />
                  <input 
                    className={`form-input ${errors.departmentId ? 'error' : ''}`}
                    type="text" 
                    placeholder="e.g. CS"
                    value={formData.departmentId} 
                    onChange={e => { setFormData({ ...formData, departmentId: e.target.value }); setErrors({...errors, departmentId: ''}); }} 
                  />
                </div>
                {errors.departmentId && <span className="error-text">{errors.departmentId}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Department Name</label>
                <input 
                  className={`form-input ${errors.name ? 'error' : ''}`}
                  type="text" 
                  placeholder="e.g. Computer Science"
                  value={formData.name} 
                  onChange={e => { setFormData({ ...formData, name: e.target.value }); setErrors({...errors, name: ''}); }} 
                />
                {errors.name && <span className="error-text">{errors.name}</span>}
              </div>

              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Description (Optional)</label>
                <textarea 
                  className="form-input"
                  placeholder="Department details..."
                  value={formData.description} 
                  onChange={e => setFormData({ ...formData, description: e.target.value })} 
                  rows="3"
                ></textarea>
              </div>
            </div>
            <div className="form-footer">
              <button className="btn btn-secondary" type="button" onClick={resetForm}>Cancel</button>
              <button className="btn btn-primary" type="submit">
                {editingId ? 'Update Department' : 'Save Department'}
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
                placeholder="Search departments..." 
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th onClick={() => handleSort('departmentId')} className="sortable">Dept ID <ArrowUpDown size={14} /></th>
                  <th onClick={() => handleSort('name')} className="sortable">Department Name <ArrowUpDown size={14} /></th>
                  <th onClick={() => handleSort('description')} className="sortable">Description <ArrowUpDown size={14} /></th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="skeleton-row">
                      <td colSpan="4"><div className="skeleton-bar"></div></td>
                    </tr>
                  ))
                ) : currentItems.map((dept) => (
                  <tr key={dept._id} className="row-hover">
                    <td><span className="id-badge">{dept.departmentId}</span></td>
                    <td style={{ fontWeight: 600 }}>{dept.name}</td>
                    <td style={{ color: '#64748b' }}>{dept.description || '-'}</td>
                    <td>
                      <div className="action-btns">
                        <button className="icon-btn edit" onClick={() => handleEdit(dept)}>
                          <Edit2 size={16} />
                        </button>
                        <button className="icon-btn delete" onClick={() => confirmDelete(dept)}>
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
                <Building2 size={40} />
                <p>No departments found.</p>
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
        .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; }
        .input-with-icon { position: relative; }
        .input-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94A3B8; }
        .input-with-icon .form-input { padding-left: 2.5rem; }
        .error-text { color: var(--danger); font-size: 0.75rem; margin-top: 0.5rem; display: block; font-weight: 600; }
        .form-input.error { border-color: var(--danger); box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1); }

        .filters-card { margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center; gap: 2rem; flex-wrap: wrap; }
        .search-box { position: relative; flex: 1; min-width: 300px; }
        .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94A3B8; }
        .search-box input { width: 100%; padding: 0.75rem 1rem 0.75rem 2.75rem; border-radius: 10px; border: 1px solid var(--border); outline: none; }
        .search-box input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); }
        
        .sortable { cursor: pointer; }
        .sortable:hover { background: #F1F5F9 !important; }
        .row-hover:hover td { background-color: #F8FAFC; }
        td { vertical-align: middle; padding: 1.25rem 1rem; }
        
        .id-badge { 
          background: #EEF2FF; color: #4338CA; padding: 4px 10px; border-radius: 6px; 
          font-size: 0.75rem; font-weight: 700; border: 1px solid #C7D2FE;
        }

        .action-btns { display: flex; gap: 0.5rem; }
        .icon-btn {
          width: 34px; height: 34px; border: 1px solid var(--border); border-radius: 8px;
          background: white; display: flex; align-items: center; justify-content: center; cursor: pointer;
          color: #64748B; transition: all 0.2s ease;
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
          border-left: 5px solid transparent; animation: slideInRight 0.3s forwards; font-weight: 600;
        }
        .notification-toast.success { border-left-color: var(--secondary); color: #065F46; }
        .notification-toast.error { border-left-color: var(--danger); color: #991B1B; }

        .modal-overlay {
          position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(4px);
          z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 1rem;
        }
        .modal-content { 
          background: white; padding: 2.5rem; border-radius: 20px; max-width: 440px; width: 100%; text-align: center; 
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); animation: modalPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .modal-content h2 { margin: 0 0 0.5rem; font-size: 1.5rem; color: #0F172A; }
        .modal-content p { color: #64748B; line-height: 1.5; margin-bottom: 2rem; }
        .modal-actions { display: flex; gap: 1rem; }
        .modal-actions button { flex: 1; padding: 0.75rem; font-weight: 700; height: 48px; border-radius: 10px; }
        .btn-danger { background: var(--danger); color: white; border: none; }
        .btn-danger:hover { background: #B91C1C; }

        .skeleton-row td { padding: 1.25rem 1rem; }
        .skeleton-bar { height: 20px; background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; border-radius: 4px; }
        
        .no-records { 
          text-align: center; padding: 4rem; color: #94A3B8; 
          display: flex; flex-direction: column; align-items: center; gap: 1rem; font-weight: 600;
        }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes modalPop { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
      `}</style>
    </div>
  );
};

export default DepartmentMgmt;
