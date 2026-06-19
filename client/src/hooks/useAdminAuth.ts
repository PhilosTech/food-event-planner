import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

export function useAdminAuth() {
  const navigate = useNavigate();
  const adminToken = useAuthStore((s) => s.adminToken);

  useEffect(() => {
    if (!adminToken) {
      navigate('/admin/login', { replace: true });
    }
  }, [adminToken, navigate]);

  return { adminToken };
}
