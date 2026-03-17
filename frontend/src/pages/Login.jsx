import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Mail, Lock, CalendarDays, BookOpen, Users, ShieldCheck, GraduationCap } from 'lucide-react';
import api from '../api';

const Login = () => {
  const [role, setRole] = useState('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const { login, user, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Loader2 style={{ animation: 'spin 1s linear infinite' }} size={32} /></div>;

  if (user) {
    return <Navigate to={user.role === 'admin' ? '/admin' : '/faculty'} />;
  }

  const validateEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      return setError('Please enter both email and password.');
    }
    if (!validateEmail(email)) {
      return setError('Please enter a valid email format.');
    }

    setIsLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Invalid login credentials.';
      setError(errorMsg.toString());
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!validateEmail(email)) {
      return setError('Please enter a valid email format.');
    }

    setIsLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setSuccessMsg(data.message || 'Password reset requested successfully.');
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || 'Failed to process request.';
      setError(errorMsg.toString());
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (selectedRole, demoEmail, demoPassword) => {
    setRole(selectedRole);
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
    setSuccessMsg('');
  };

  return (
    <div className="login-wrapper">
      {/* LEFT SECTION: Brand Panel */}
      <div className="brand-panel">
        <div className="blobs-container">
          <div className="blob blob-1"></div>
          <div className="blob blob-2"></div>
          
          {/* Subtle Floating BG Icons */}
          <BookOpen className="floating-shape shape-1" size={100} color="rgba(255,255,255,0.07)" />
          <CalendarDays className="floating-shape shape-2" size={140} color="rgba(255,255,255,0.05)" />
          <Users className="floating-shape shape-3" size={120} color="rgba(255,255,255,0.06)" />
          <BookOpen className="floating-shape shape-4" size={70} color="rgba(255,255,255,0.08)" />
        </div>
        
        <div className="brand-content">
          <div className="brand-icon-flex">
            <div className="brand-icon-main">
              <CalendarDays size={48} color="white" strokeWidth={1.5} />
            </div>
            <div className="brand-icon-secondary">
              <BookOpen size={24} color="rgba(255,255,255,0.8)" />
              <Users size={24} color="rgba(255,255,255,0.8)" />
            </div>
          </div>
          <h1 className="brand-title mt-4">Faculty Workload System</h1>
          <p className="brand-subtitle mb-4">Manage faculty workload, classrooms and timetables efficiently.</p>
        </div>
      </div>

      {/* RIGHT SECTION: Login Form */}
      <div className="form-panel">
        <div className={`form-container ${mounted ? 'fade-in' : ''}`}>
          
          <div className="mobile-header flex flex-col items-center justify-center mt-4 mb-4">
            <div className="mobile-icon mb-4">
              <CalendarDays size={32} color="white" strokeWidth={1.5} />
            </div>
            <h2 className="mobile-title">Welcome Back</h2>
          </div>

          <div className="desktop-header">
            <h2 className="title">{isForgotPassword ? 'Reset Password' : 'Log in to your account'}</h2>
            <p className="subtitle">{isForgotPassword ? 'Enter your email to receive a reset link' : 'Welcome back! Please enter your details.'}</p>
          </div>

          <div className="role-toggle">
            <button 
              type="button" 
              className={`role-btn ${role === 'admin' ? 'active' : ''}`}
              onClick={() => {setRole('admin'); setEmail(''); setError('');}} 
            >
              Admin
            </button>
            <button 
              type="button" 
              className={`role-btn ${role === 'faculty' ? 'active' : ''}`}
              onClick={() => {setRole('faculty'); setEmail(''); setError('');}} 
            >
              Faculty
            </button>
          </div>

          {error && <div className="alert error-alert">{error}</div>}
          {successMsg && <div className="alert success-alert">{successMsg}</div>}

          {isForgotPassword ? (
            <form onSubmit={handleForgotPassword} className="login-form" noValidate>
              <div className="input-group">
                <label>Email Address</label>
                <div className="input-wrapper">
                  <Mail className="input-icon" size={20} />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => {setEmail(e.target.value); setError(''); setSuccessMsg('');}}
                    placeholder={`Enter your ${role} email`}
                    required 
                  />
                </div>
              </div>

              <button type="submit" className="primary-btn" disabled={isLoading}>
                {isLoading ? <><Loader2 className="spinner" size={20} /> Processing...</> : 'Reset Password'}
              </button>

              <div className="form-footer">
                <button type="button" className="text-btn" onClick={() => { setIsForgotPassword(false); setError(''); setSuccessMsg(''); }}>
                  &#8592; Back to Login
                </button>
              </div>
            </form>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="login-form" noValidate>
                <div className="input-group">
                  <label>Email Address</label>
                  <div className="input-wrapper">
                    <Mail className="input-icon" size={20} />
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => {setEmail(e.target.value); setError('');}}
                      placeholder={`Enter your ${role} email`}
                      required 
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label>Password</label>
                  <div className="input-wrapper">
                    <Lock className="input-icon" size={20} />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={password}
                      onChange={(e) => {setPassword(e.target.value); setError('');}}
                      placeholder="Enter your password"
                      required 
                    />
                    <button type="button" className="toggle-pwd-btn" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  <div className="forgot-pwd-container">
                    <button type="button" className="text-btn primary-text" onClick={() => { setIsForgotPassword(true); setError(''); setSuccessMsg(''); }}>
                      Forgot Password?
                    </button>
                  </div>
                </div>

                <button type="submit" className="primary-btn" disabled={isLoading}>
                  {isLoading ? <><Loader2 className="spinner" size={20} /> Signing in...</> : 'Sign In'}
                </button>
              </form>

              {/* Demo Accounts Section */}
              <div className="demo-accounts-section">
                <div className="demo-title">
                  <Users size={14} /> Demo Accounts
                </div>
                <div className="demo-cards-container">
                  <div 
                    className="demo-card admin-spec" 
                    onClick={() => handleDemoLogin('admin', 'admin@college.edu', '123456')}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="demo-badge admin-badge">
                        <ShieldCheck size={12} className="mr-1" /> Admin
                      </div>
                    </div>
                    <div className="demo-card-info">
                      <span><b>Email:</b> admin@college.edu</span>
                      <span><b>Pass:</b> 123456</span>
                    </div>
                  </div>

                  <div 
                    className="demo-card faculty-spec" 
                    onClick={() => handleDemoLogin('faculty', 'sam.anton@gmail.com', '123456')}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="demo-badge faculty-badge">
                        <GraduationCap size={12} className="mr-1" /> Faculty
                      </div>
                    </div>
                    <div className="demo-card-info">
                      <span><b>Email:</b> sam.anton@gmail.com</span>
                      <span><b>Pass:</b> 123456</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        /* Essential Reset and Positioning */
        .login-wrapper {
          min-height: 100vh;
          width: 100vw;
          display: flex;
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          background-color: #f8fafc;
        }

        /* --- LEFT BRAND PANEL --- */
        .brand-panel {
          flex: 1 1 55%;
          position: relative;
          background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 3rem;
          color: white;
          overflow: hidden;
        }
        
        .brand-content {
          position: relative;
          z-index: 10;
          max-width: 500px;
          text-align: center;
        }

        .brand-icon-flex {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .brand-icon-main {
          width: 80px; height: 80px;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          display: flex; justify-content: center; align-items: center;
          box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        }

        .brand-icon-secondary {
          display: flex;
          gap: 1.5rem;
        }

        .brand-title {
          font-size: 3rem;
          font-weight: 800;
          letter-spacing: -0.025em;
          margin: 0 0 1rem 0;
          line-height: 1.1;
        }

        .mt-4 { margin-top: 1rem !important; }
        .mb-4 { margin-bottom: 1rem !important; }

        .brand-subtitle {
          font-size: 1.2rem;
          color: rgba(255, 255, 255, 0.85);
          margin: 0;
          line-height: 1.6;
          font-weight: 400;
        }

        /* Blobs for depth */
        .blobs-container {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }
        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.6;
          animation: blob-float 20s infinite ease-in-out alternate;
        }
        .blob-1 {
          top: -10%; left: -10%;
          width: 600px; height: 600px;
          background: #3b82f6;
        }
        .blob-2 {
          bottom: -20%; right: -10%;
          width: 700px; height: 700px;
          background: #db2777;
          animation-delay: -5s;
        }

        @keyframes blob-float {
          0% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(50px, -50px) scale(1.1); }
          100% { transform: translate(-30px, 40px) scale(0.9); }
        }

        .floating-shape {
          position: absolute;
          animation: float-shape 15s ease-in-out infinite alternate;
        }
        .shape-1 { top: 15%; right: 10%; animation-delay: 0s; }
        .shape-2 { bottom: 15%; left: 10%; animation-delay: 2s; }
        .shape-3 { top: 40%; left: 15%; animation-delay: 5s; }
        .shape-4 { bottom: 25%; right: 20%; animation-delay: 7s; }

        @keyframes float-shape {
          0% { transform: translateY(0) rotate(0deg) scale(1); }
          50% { transform: translateY(-30px) rotate(10deg) scale(1.05); }
          100% { transform: translateY(10px) rotate(-10deg) scale(0.95); }
        }

        /* --- RIGHT FORM PANEL --- */
        .form-panel {
          flex: 1 1 45%;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 2rem;
          background-color: #f8fafc;
        }

        .form-container {
          width: 100%;
          max-width: 580px;
          background: #ffffff;
          border-radius: 20px;
          padding: 4rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(226, 232, 240, 0.8);
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.6s ease-out, transform 0.6s ease-out;
        }
        .form-container.fade-in {
          opacity: 1;
          transform: translateY(0);
        }

        .mobile-header { display: none; }
        .desktop-header {
          text-align: left;
          margin-bottom: 2.5rem;
        }
        
        .desktop-header .title {
          font-size: 1.875rem;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 0.5rem 0;
        }
        .desktop-header .subtitle {
          color: #64748b;
          font-size: 1rem;
          margin: 0;
        }

        /* Toggles */
        .role-toggle {
          display: flex;
          background: #f1f5f9;
          border-radius: 12px;
          padding: 0.35rem;
          margin-bottom: 2rem;
        }
        .role-btn {
          flex: 1;
          padding: 0.75rem;
          border: none;
          background: transparent;
          border-radius: 8px;
          color: #64748b;
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .role-btn.active {
          background: #ffffff;
          color: #2563eb;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }

        /* Forms */
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.75rem;
        }
        .input-group label {
          display: block;
          font-size: 0.875rem;
          font-weight: 600;
          color: #334155;
          margin-bottom: 0.5rem;
        }
        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .input-icon {
          position: absolute;
          left: 16px;
          color: #94a3b8;
          pointer-events: none;
          transition: color 0.3s;
        }
        .input-wrapper input {
          width: 100%;
          padding: 0.85rem 1rem 0.85rem 3rem;
          border-radius: 12px;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          font-size: 1rem;
          color: #1e293b;
          outline: none;
          transition: all 0.3s ease;
        }
        .input-wrapper input::placeholder {
          color: #94a3b8;
        }
        .input-wrapper input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
        }
        .input-wrapper input:focus + .input-icon,
        .input-wrapper input:focus ~ .input-icon, 
        .input-wrapper:focus-within .input-icon {
          color: #3b82f6;
        }
        
        .toggle-pwd-btn {
          position: absolute;
          right: 16px;
          background: none;
          border: none;
          padding: 0;
          color: #94a3b8;
          cursor: pointer;
          display: flex;
          transition: color 0.2s;
        }
        .toggle-pwd-btn:hover {
          color: #64748b;
        }

        .forgot-pwd-container {
          display: flex;
          justify-content: flex-end;
          margin-top: 0.75rem;
        }
        .text-btn {
          background: none;
          border: none;
          padding: 0;
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          color: #64748b;
          transition: color 0.2s;
        }
        .text-btn:hover {
          color: #0f172a;
        }
        .text-btn.primary-text {
          color: #2563eb;
        }
        .text-btn.primary-text:hover {
          color: #1d4ed8;
          text-decoration: underline;
        }

        /* Buttons */
        .primary-btn {
          margin-top: 0.5rem;
          width: 100%;
          padding: 0.85rem;
          border-radius: 12px;
          border: none;
          background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
          color: white;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.3s ease;
          box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3);
        }
        .primary-btn:hover:not(:disabled) {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 20px 30px -5px rgba(37, 99, 235, 0.5);
        }
        .primary-btn:active:not(:disabled) {
          transform: translateY(0);
        }
        .primary-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          box-shadow: none;
        }

        .form-footer {
          margin-top: 1rem;
          text-align: center;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Alerts */
        .alert {
          padding: 1rem;
          border-radius: 10px;
          font-size: 0.9rem;
          margin-bottom: 1.5rem;
          font-weight: 500;
        }
        .error-alert {
          background: #fef2f2;
          color: #b91c1c;
          border: 1px solid #fca5a5;
        }
        .success-alert {
          background: #f0fdf4;
          color: #15803d;
          border: 1px solid #86efac;
        }

        /* --- RESPONSIVENESS --- */
        @media (max-width: 1024px) {
          .brand-title { font-size: 2.25rem; }
          .brand-panel { padding: 2rem; }
          .form-container { padding: 3rem; }
        }

        @media (max-width: 768px) {
          .login-wrapper {
            flex-direction: column;
            overflow-x: hidden;
          }
          .brand-panel {
            flex: none;
            width: 100%;
            height: auto;
            padding: 2.5rem 1.5rem;
            min-height: auto;
          }
          .brand-content {
            max-width: 100%;
          }
          .brand-title {
            font-size: 1.75rem;
            margin-bottom: 0.5rem;
          }
          .brand-subtitle {
            font-size: 1rem;
            margin-bottom: 0;
          }
          .brand-icon-flex {
            margin-bottom: 1rem;
            gap: 1rem;
          }
          .brand-icon-main {
            width: 60px; height: 60px;
          }
          .brand-icon-main svg {
            width: 32px; height: 32px;
          }
          .brand-icon-secondary {
            display: none;
          }
          .blobs-container {
            opacity: 0.4;
          }
          .floating-shape {
            display: none; /* Reduce noise on mobile */
          }

          .form-panel {
            flex: none;
            width: 100%;
            min-height: auto;
            padding: 1.5rem;
            margin-top: -20px; /* Slight overlap for modern card feel */
            z-index: 20;
          }
          .form-container {
            padding: 2.5rem 1.5rem;
            max-width: 100%;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0,0,0,0.05);
          }
          .desktop-header { display: block; text-align: center; margin-bottom: 1.5rem; }
          .desktop-header .title { font-size: 1.5rem; }
          .mobile-header { display: none; }
        }

        /* --- DEMO ACCOUNTS --- */
        .demo-accounts-section {
          margin-top: 2.5rem;
          padding-top: 1.5rem;
          border-top: 1px dashed #e2e8f0;
        }
        .demo-title {
          font-size: 0.75rem;
          font-weight: 700;
          color: #94a3b8;
          margin-bottom: 1.25rem;
          text-align: center;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }
        .demo-title::before, .demo-title::after {
          content: '';
          height: 1px;
          flex: 1;
          background: #f1f5f9;
        }
        .demo-cards-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .demo-card {
          background: #ffffff;
          border: 1px solid #f1f5f9;
          border-radius: 14px;
          padding: 1rem;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
        }
        .demo-card:hover {
          background: #f8fafc;
          transform: translateY(-3px);
          box-shadow: 0 10px 20px -5px rgba(0, 0, 0, 0.05);
          border-color: #cbd5e1;
        }
        .demo-badge {
          display: inline-flex;
          align-items: center;
          padding: 0.25rem 0.6rem;
          border-radius: 6px;
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
        }
        .mr-1 { margin-right: 0.25rem; }
        .admin-badge {
          background: #eff6ff;
          color: #2563eb;
        }
        .faculty-badge {
          background: #f5f3ff;
          color: #7c3aed;
        }
        .demo-card-info {
          font-size: 0.75rem;
          color: #64748b;
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
        }
        .demo-card-info span {
          display: block;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .demo-card-info b {
          color: #334155;
          font-weight: 600;
        }

        @media (max-width: 480px) {
          .demo-cards-container {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;
