import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: ''
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      const result = await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName
      });
      
      if (result.success) {
        toast.success(`User profile created successfully: ${result.user.username}`);
        navigate('/login');
      } else {
        toast.error(result.error || 'Failed to register');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(
        error.response?.data?.message || 
        error.message || 
        'An error occurred during registration'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center vh-100 bg-light">
      <div className="card shadow p-3 border-0 rounded-4" style={{ width: "350px" }}>
        {/* Logo */}
        <div className="text-center">
          <img
            // src={msteams}
            alt="Teams Logo"
            className="mb-2"
            style={{ height: "40px" }}
          />
          {/* <h4 className="fw-semibold mb-1">Teams Chat App</h4> */}
          <p className="text-muted">Create a new account</p>
        </div>
          
        <form onSubmit={handleSubmit}>
          <div className="mb-2">
            <label htmlFor="username" className="form-label small mb-1">
              Username
            </label>
            <input
              type="text"
              className="form-control form-control-sm"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Choose a username"
              required
            />
          </div>

          <div className="mb-2">
            <label htmlFor="fullName" className="form-label small mb-1">
              Full Name
            </label>
            <input
              type="text"
              className="form-control form-control-sm"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
            />
          </div>
          
          <div className="mb-2">
            <label htmlFor="email" className="form-label small mb-1">
              Email
            </label>
            <input
              type="email"
              className="form-control form-control-sm"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>
          
          <div className="mb-3">
            <label htmlFor="password" className="form-label small mb-1">
              Password
            </label>
            <input
              type="password"
              className="form-control form-control-sm"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password"
              required
            />
          </div>
          
          <button
            type="submit"
            className="btn btn-primary btn-sm w-100 mb-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Creating account...
              </>
            ) : (
              'Sign Up'
            )}
          </button>
        </form>
        
        <div className="text-center">
          <p className="small mb-0">
            Already have an account?{' '}
            <Link to="/login" className="text-decoration-none">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;