import { useState, useEffect, useMemo } from 'react';
import api from '../../api';
import { 
  Presentation, Search, Filter, Plus, Edit2, Trash2, 
  ChevronLeft, ChevronRight, ArrowUpDown, X, 
  CheckCircle, AlertCircle, HelpCircle, Loader2,
  Users, MapPin
} from 'lucide-react';

const ClassroomMgmt = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({ 
    roomId: '', roomName: '', roomType: '', capacity: '' 
  });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  
  // Search and Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  
  // Sorting State
  const [sortConfig, setSortConfig] = useState({ key: 'roomName', direction: 'asc' });
  
  // Notification State
  const [notification, setNotification] = useState(null);
  
  // Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [targetRoom, setTargetRoom] = useState(null);

  // Form Error State
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [roomsRes, typesRes] = await Promise.all([
        api.get('/classrooms'),
        api.get('/room-types')
      ]);
      setClassrooms(roomsRes.data);
      setRoomTypes(typesRes.data);
      if (typesRes.data.length > 0 && !formData.roomType) {
        setFormData(prev => ({ ...prev, roomType: typesRes.data[0]._id }));
      }
    } catch (err) {
      showNotification('Failed to load data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClassrooms = async () => {
    try {
      const { data } = await api.get('/classrooms');
      setClassrooms(data);
    } catch (err) {
      showNotification('Failed to load classrooms', 'error');
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.roomId.trim()) newErrors.roomId = 'Room ID is required';
    if (!formData.roomName.trim()) newErrors.roomName = 'Room Name is required';
    if (!formData.roomType) newErrors.roomType = 'Room Type is required';
    
    if (!formData.capacity || formData.capacity <= 0) {
      newErrors.capacity = 'Capacity must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (editingId) {
        await api.put(`/classrooms/${editingId}`, formData);
        showNotification('Classroom details updated successfully');
      } else {
        await api.post('/classrooms', formData);
        showNotification('New classroom added successfully');
      }
      resetForm();
      fetchClassrooms();
    } catch (err) {
      const msg = err.response?.data?.message || 'Operation failed';
      showNotification(msg, 'error');
    }
  };

  const resetForm = () => {
    setFormData({ 
      roomId: '', 
      roomName: '', 
      roomType: roomTypes.length > 0 ? roomTypes[0]._id : '', 
      capacity: '' 
    });
    setEditingId(null);
    setShowForm(false);
    setErrors({});
  };

  const handleEdit = (room) => {
    setEditingId(room._id);
    setFormData({
      roomId: room.roomId,
      roomName: room.roomName,
      roomType: room.roomType?._id || '',
      capacity: room.capacity
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmDelete = (room) => {
    setTargetRoom(room);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!targetRoom) return;
    try {
      await api.delete(`/classrooms/${targetRoom._id}`);
      showNotification('Classroom removed successfully');
      setIsDeleteModalOpen(false);
      setTargetRoom(null);
      fetchClassrooms();
    } catch (err) {
      showNotification('Failed to delete classroom', 'error');
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
  const filteredRooms = useMemo(() => {
    return classrooms.filter(c => {
      const matchesSearch = 
        c.roomName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.roomId.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = !typeFilter || c.roomType?._id === typeFilter;
      
      return matchesSearch && matchesType;
    }).sort((a, b) => {
      let valA = a[sortConfig.key];
      let valB = b[sortConfig.key];
      
      if (sortConfig.key === 'roomType') {
        valA = a.roomType?.typeName || '';
        valB = b.roomType?.typeName || '';
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [classrooms, searchTerm, typeFilter, sortConfig]);

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRooms.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRooms.length / itemsPerPage);

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
              <p>Are you sure you want to delete <strong>{targetRoom?.roomName}</strong>? This will remove all associated timetable slots.</p>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete Room</button>
            </div>
          </div>
        </div>
      )}

      <div className="page-header">
        <div>
          <h1 className="page-title">Classroom Management</h1>
          <p className="page-subtitle">Manage Lecture Halls, Labs and institutional infrastructure.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? <ChevronLeft size={18} /> : <Plus size={18} />}
          {showForm ? 'Back to List' : 'Add New Classroom'}
        </button>
      </div>

      {showForm ? (
        <div className="glass-card animate-slide-in">
          <h2 className="section-title">{editingId ? 'Edit Classroom' : 'Register New Classroom'}</h2>
          <form onSubmit={handleSubmit} className="modern-form">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Room ID / Number</label>
                <input 
                  className={`form-input ${errors.roomId ? 'error' : ''}`}
                  placeholder="e.g. LAB-101"
                  value={formData.roomId} 
                  onChange={e => setFormData({ ...formData, roomId: e.target.value })} 
                />
                {errors.roomId && <span className="error-msg">{errors.roomId}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Display Name</label>
                <input 
                  className={`form-input ${errors.roomName ? 'error' : ''}`}
                  placeholder="e.g. Advanced AI Research Lab"
                  value={formData.roomName} 
                  onChange={e => setFormData({ ...formData, roomName: e.target.value })} 
                />
                {errors.roomName && <span className="error-msg">{errors.roomName}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Room Type</label>
                <select 
                  className="form-input"
                  value={formData.roomType} 
                  onChange={e => setFormData({ ...formData, roomType: e.target.value })}
                >
                  <option value="" disabled>Select Room Type</option>
                  {roomTypes.map(t => <option key={t._id} value={t._id}>{t.typeName}</option>)}
                </select>
                {errors.roomType && <span className="error-msg">{errors.roomType}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Student Capacity</label>
                <input 
                  className={`form-input ${errors.capacity ? 'error' : ''}`}
                  type="number"
                  placeholder="e.g. 60"
                  value={formData.capacity} 
                  onChange={e => setFormData({ ...formData, capacity: e.target.value })} 
                />
                {errors.capacity && <span className="error-msg">{errors.capacity}</span>}
              </div>
            </div>
            
            <div className="form-footer">
              <button className="btn btn-secondary" type="button" onClick={resetForm}>Cancel</button>
              <button className="btn btn-primary" type="submit">
                {editingId ? 'Save Changes' : 'Register Classroom'}
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
                placeholder="Search Room ID or Name..." 
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>
            
            <div className="dropdown-filters">
              <div className="filter-group">
                <Filter size={14} />
                <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setCurrentPage(1); }}>
                  <option value="">All Types</option>
                  {roomTypes.map(t => <option key={t._id} value={t._id}>{t.typeName}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th onClick={() => handleSort('roomId')} className="sortable">Room ID <ArrowUpDown size={14} /></th>
                  <th onClick={() => handleSort('roomName')} className="sortable">Room Name <ArrowUpDown size={14} /></th>
                  <th onClick={() => handleSort('roomType')} className="sortable">Room Type <ArrowUpDown size={14} /></th>
                  <th onClick={() => handleSort('capacity')} className="sortable">Capacity <ArrowUpDown size={14} /></th>
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
                ) : currentItems.map((c) => (
                  <tr key={c._id} className="row-hover">
                    <td className="font-semibold">{c.roomId}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="room-icon-box"><MapPin size={16} /></div>
                        <span style={{ fontWeight: 600 }}>{c.roomName}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`type-tag type-${(c.roomType?.typeName || 'unknown').replace(/\s+/g, '-').toLowerCase()}`}>
                        {c.roomType?.typeName || 'Unknown'}
                      </span>
                    </td>
                    <td>
                      <div className="capacity-visual">
                        <Users size={14} color="#64748B" />
                        <span className="capacity-badge">{c.capacity} Seater</span>
                      </div>
                    </td>
                    <td>
                      <div className="action-btns">
                        <button className="icon-btn edit" onClick={() => handleEdit(c)}>
                          <Edit2 size={16} />
                        </button>
                        <button className="icon-btn delete" onClick={() => confirmDelete(c)}>
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
                <Presentation size={40} />
                <p>No classrooms found in the registry.</p>
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
        
        .room-icon-box {
          width: 32px; height: 32px; background: #FFF7ED; color: #F97316;
          border-radius: 8px; display: flex; align-items: center; justify-content: center;
        }

        .type-tag { 
          padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 700;
          display: inline-flex; align-items: center; white-space: nowrap;
        }
        
        /* Dynamic Type Tag Colors */
        .type-tag.type-lecture-hall { background: #F0F9FF; color: #0369A1; }
        .type-tag.type-lab { background: #ECFDF5; color: #047857; }
        .type-tag.type-seminar-hall { background: #FEF2F2; color: #991B1B; }
        .type-tag:not(.type-lecture-hall):not(.type-lab):not(.type-seminar-hall) { background: #F1F5F9; color: #475569; }

        .capacity-visual { display: flex; align-items: center; gap: 0.4rem; color: #64748B; font-weight: 600; font-size: 0.85rem; }
        .capacity-badge { background: #F1F5F9; padding: 2px 6px; border-radius: 4px; }

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

export default ClassroomMgmt;
