

import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from '@tanstack/react-router';
import { LogOut, User } from 'lucide-react';

const AuthButton = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 hidden md:block">
          Halo, {user.full_name || (user as any).name || user.email}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={signOut}
          className="flex items-center gap-1"
        >
          <LogOut size={16} />
          <span className="hidden md:inline">Keluar</span>
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={() => navigate({ to: '/auth' })}
      className="bg-green-600 hover:bg-green-700 flex items-center gap-1"
    >
      <User size={16} />
      Masuk/Daftar
    </Button>
  );
};

export default AuthButton;
