import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { isAdminLoggedIn } from '../../lib/adminAuth';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // isAdminLoggedIn is async — must be awaited
    isAdminLoggedIn().then((loggedIn) => {
      if (!loggedIn) {
        navigate('/admin/login', { replace: true });
      } else {
        setChecked(true);
      }
    });
  }, [navigate]);

  if (!checked) return null;
  return <>{children}</>;
}
