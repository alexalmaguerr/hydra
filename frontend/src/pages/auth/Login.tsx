import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Droplets, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PORTAL_ROLES } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      // useAuth updates user synchronously from the token after login
      // Read role from token via a re-render; navigate based on role stored in context
      // We re-read via the hook after state update — navigate after login resolves
      // The user state updates before this line continues since login() calls setUser
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
      setIsSubmitting(false);
      return;
    }

    // Role-based redirect — read fresh value via localStorage decode
    // (useAuth().user not yet re-rendered here, so decode token directly)
    const token = localStorage.getItem('ctcf_access_token');
    let role: string | null = null;
    if (token) {
      try {
        const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(base64)) as { role?: string };
        role = payload.role ?? null;
      } catch {
        // ignore decode errors
      }
    }

    navigate(role && PORTAL_ROLES.includes(role as never) ? '/portal' : '/app', {
      replace: true,
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-4 pb-4">
          <div className="flex items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Droplets className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div className="text-center">
            <CardTitle className="text-2xl font-bold">CEA Querétaro</CardTitle>
            <CardDescription className="mt-1 text-sm">
              Sistema de Gestión de Agua Potable
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@ceaqro.mx"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ingresando…
                </>
              ) : (
                'Iniciar sesión'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
