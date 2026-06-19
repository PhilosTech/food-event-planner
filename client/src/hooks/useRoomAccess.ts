import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

export function useRoomAccess() {
  const { slug = '' } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const getRoomAccess = useAuthStore((s) => s.getRoomAccess);
  const access = getRoomAccess(slug);

  useEffect(() => {
    if (!access) {
      navigate(`/room/${slug}`, { replace: true });
    }
  }, [access, slug, navigate]);

  return {
    access,
    isLeader: access?.role === 'leader',
    isVolunteer: access?.role === 'volunteer',
    canEdit: access?.role === 'leader' || access?.role === 'volunteer',
    slug,
  };
}
