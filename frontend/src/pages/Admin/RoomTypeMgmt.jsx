import { useState, useEffect, useMemo } from 'react';
import api from '../../api';
import { 
  DraftingCompass, Search, Filter, Plus, Edit2, Trash2, 
  ChevronLeft, ChevronRight, X, 
  CheckCircle, AlertCircle, HelpCircle, Loader2,
  FileText, AlignLeft
} from 'lucide-react';

const RoomTypeMgmt = () => {
  const [roomTypes, setRoomTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({ 
    typeName: '', description: '' 
  });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  
  // Search State
  const [searchTerm, setSearchTerm] = useState('');
  
  // Notification State
  const [notification, setNotification] = useState(null);
  
  // Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [targetType, setTargetType] = useState(null);

  // Form Error State
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchRoomTypes();
  }, []);

  const fetchRoomTypes = async () => {
    try {
      setIsLoading(true);
      const { data } = await api.get('/room-types');
      setRoomTypes(data);
    } catch (err) {
      showNotification('Failed to load room types', 'error');
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
    if (!formData.typeName.trim()) newErrors.typeName = 'Type Name is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (editingId) {
        await api.put(`/room-types/${editingId}`, formData);
        showNotification('Room type updated successfully');
      } else {
        await api.post('/room-types', formData);
        showNotification('New room type added successfully');
      }
      resetForm();
      fetchRoomTypes();
    } catch (err) {
      const msg = err.response?.data?.message || 'Operation failed';
      showNotification(msg, 'error');
    }
  };

  const resetForm = () => {
    setFormData({ typeName: '', description: '' });
    setEditingId(null);
    setShowForm(false);
    setErrors({});
  };

  const handleEdit = (type) => {
    setEditingId(type._id);
    setFormData({
      typeName: type.typeName,
      description: type.description || ''
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmDelete = (type) => {
    setTargetType(type);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!targetType) return;
    try {
      await api.delete(`/room-types/${targetType._id}`);
      showNotification('Room type removed successfully');
      setIsDeleteModalOpen(false);
      setTargetType(null);
      fetchRoomTypes();
    } catch (err) {
      showNotification('Failed to delete room type', 'error');
    }
  };

  // Derived Data
  const filteredTypes = useMemo(() => {
    return roomTypes.filter(t => 
      t.typeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [roomTypes, searchTerm]);

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
              <p>Are you sure you want to delete <strong>{targetType?.typeName}</strong>? This may affect existing classrooms using this type.</p>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete Type</button>
            </div>
          </div>
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Room Type Management</h1>
          <p className="page-subtitle">Configure dynamic room categories for your institution.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? <ChevronLeft size={18} /> : <Plus size={18} />}
          {showForm ? 'Back to List' : 'Add New Room Type'}
        </button>
      </div>

      {showForm ? (
        <div className="glass-card animate-slide-in">
          <h2 className="section-title">{editingId ? 'Edit Room Type' : 'Create New Room Type'}</h2>
          <form onSubmit={handleSubmit} className="modern-form">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Type Name</label>
                <div className="input-with-icon">
                  <DraftingCompass size={18} className="input-icon" />
                  <input 
                    className={`form-input ${errors.typeName ? 'error' : ''}`}
                    placeholder="e.g. Smart Classroom, Research Lab"
                    value={formData.typeName} 
                    onChange={e => setFormData({ ...formData, typeName: e.target.value })} 
                  />
                </div>
                {errors.typeName && <span className="error-msg">{errors.typeName}</span>}
              </div>
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">Description</label>
                <div className="input-with-icon">
                  <AlignLeft size={18} className="input-icon" style={{ top: '1.2rem' }} />
                  <textarea 
                    className="form-input"
                    style={{ minHeight: '100px', paddingLeft: '2.5rem' }}
                    placeholder="Briefly describe what this room type is used for..."
                    value={formData.description} 
                    onChange={e => setFormData({ ...formData, description: e.target.value })} 
                  />
                </div>
              </div>
            </div>
            
            <div className="form-footer">
              <button className="btn btn-secondary" type="button" onClick={resetForm}>Cancel</button>
              <button className="btn btn-primary" type="submit">
                {editingId ? 'Save Changes' : 'Create Room Type'}
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
                placeholder="Search room types..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Type Name</th>
                  <th>Description</th>
                  <th>Created At</th>
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
                ) : filteredTypes.map((t) => (
                  <tr key={t._id} className="row-hover">
                    <td className="font-semibold">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="type-icon-box"><DraftingCompass size={16} /></div>
                        <span>{t.typeName}</span>
                      </div>
                    </td>
                    <td className="text-muted">{t.description || 'No description provided.'}</td>
                    <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className="action-btns">
                        <button className="icon-btn edit" onClick={() => handleEdit(t)}>
                          <Edit2 size={16} />
                        </button>
                        <button className="icon-btn delete" onClick={() => confirmDelete(t)}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {!isLoading && filteredTypes.length === 0 && (
              <div className="no-records">
                <DraftingCompass size={40} />
                <p>No room types configured yet.</p>
              </div>
            )}
          </div>
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
        
        .type-icon-box {
          width: 32px; height: 32px; background: #EEF2FF; color: #4F46E5;
          border-radius: 8px; display: flex; align-items: center; justify-content: center;
        }

        .action-btns { display: flex; gap: 0.5rem; }
        .icon-btn {
          width: 34px; height: 34px; border: 1px solid var(--border); border-radius: 8px;
          background: white; display: flex; align-items: center; justify-content: center;
          cursor: pointer; transition: all 0.2s;
        }
        .icon-btn.edit:hover { color: var(--primary); border-color: var(--primary); background: #EFF6FF; }
        .icon-btn.delete:hover { color: var(--danger); border-color: var(--danger); background: #FEF2F2; }

        .input-with-icon { position: relative; }
        .input-icon { position: absolute; left: 12px; top: 1.25rem; transform: translateY(-50%); color: #94A3B8; }
        .input-with-icon input { padding-left: 2.75rem; }

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

export default RoomTypeMgmt;
