import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Droplets, Loader2 } from 'lucide-react';
import { useAuth, PORTAL_ROLES } from '@/context/AuthContext';
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

const PortalLogin = () => {
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión');
      setIsSubmitting(false);
      return;
    }

    // Validate that the logged-in user is a portal (CLIENTE) user
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

    if (!role || !PORTAL_ROLES.includes(role as never)) {
      // Internal staff tried to log in through the portal — reject
      setError('Este acceso es exclusivo para clientes');
      // Revoke the token so they are not inadvertently left logged in
      localStorage.removeItem('ctcf_access_token');
      setIsSubmitting(false);
      return;
    }

    navigate('/portal', { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-primary/5 to-background">
      {/* Portal header bar */}
      <header className="border-b bg-background/80 px-6 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center gap-2">
          <Droplets className="h-6 w-6 text-primary" />
          <span className="font-semibold text-primary">CEA Querétaro</span>
          <span className="text-muted-foreground">· Portal del Cliente</span>
        </div>
      </header>

      {/* Login card */}
      <div className="flex flex-1 items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="space-y-4 pb-4">
            <div className="flex items-center justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Droplets className="h-8 w-8 text-primary" />
              </div>
            </div>
            <div className="text-center">
              <CardTitle className="text-2xl font-bold">Portal del Cliente</CardTitle>
              <CardDescription className="mt-1 text-sm">
                Ingrese con sus credenciales para acceder a su cuenta
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="portal-email">Correo electrónico</Label>
                <Input
                  id="portal-email"
                  type="email"
                  placeholder="cliente@ejemplo.com"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="portal-password">Contraseña</Label>
                <Input
                  id="portal-password"
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
                  'Acceder al portal'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PortalLogin;
