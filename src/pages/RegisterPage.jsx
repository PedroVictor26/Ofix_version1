import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx'; // Ajuste o caminho
import { Wrench } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth(); // Usando a função register do AuthContext
  const [formData, setFormData] = useState({
    nomeUser: '',
    emailUser: '',
    passwordUser: '',
    confirmPassword: '',
    nomeOficina: '',
    cnpjOficina: '', // Opcional no front-end, mas pode ser útil
    // outros campos da oficina podem ser adicionados se necessário
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.passwordUser !== formData.confirmPassword) {
      toast.error("As senhas não coincidem!");
      return;
    }
    if (formData.passwordUser.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    setIsLoading(true);
    try {
      // O serviço de backend espera: nomeUser, emailUser, passwordUser, nomeOficina, cnpjOficina (opcional), etc.
      await register({
        nomeUser: formData.nomeUser,
        emailUser: formData.emailUser,
        passwordUser: formData.passwordUser,
        nomeOficina: formData.nomeOficina,
        cnpjOficina: formData.cnpjOficina,
        // Adicione outros campos se o backend os esperar
      });
      toast.success('Registro bem-sucedido! Por favor, faça login para continuar.');
      navigate('/login');
    } catch (error) {
      console.error("Falha no registro:", error);
      toast.error(error.message || 'Falha no registro. Verifique os dados ou tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-100 to-green-100 p-4">
      <Card className="w-full max-w-lg shadow-2xl">
        <CardHeader className="text-center">
                    <div className="mx-auto mb-4 h-16 w-16 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg">
            <Wrench className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight text-slate-900">Crie sua Conta OFIX</CardTitle>
          <CardDescription className="text-slate-600">
            Comece a gerenciar sua oficina de forma eficiente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 border-b pb-2 mb-3">Dados do Usuário Principal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <Label htmlFor="nomeUser">Seu Nome Completo</Label>
                    <Input id="nomeUser" value={formData.nomeUser} onChange={handleChange} required />
                </div>
                <div className="space-y-1">
                    <Label htmlFor="emailUser">Seu Email</Label>
                    <Input id="emailUser" type="email" value={formData.emailUser} onChange={handleChange} required />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <Label htmlFor="passwordUser">Senha</Label>
                    <Input id="passwordUser" type="password" value={formData.passwordUser} onChange={handleChange} required />
                </div>
                <div className="space-y-1">
                    <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                    <Input id="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required />
                </div>
            </div>

            <h3 className="text-lg font-semibold text-slate-800 border-b pb-2 pt-4 mb-3">Dados da Oficina</h3>
            <div className="space-y-1">
                <Label htmlFor="nomeOficina">Nome da Oficina</Label>
                <Input id="nomeOficina" value={formData.nomeOficina} onChange={handleChange} required />
            </div>
             <div className="space-y-1">
                <Label htmlFor="cnpjOficina">CNPJ da Oficina (Opcional)</Label>
                <Input id="cnpjOficina" value={formData.cnpjOficina} onChange={handleChange} />
            </div>
            {/* Adicionar mais campos da oficina se necessário (telefone, endereço) */}

            <Button type="submit" className="w-full text-base py-3 bg-green-600 hover:bg-green-700 mt-6" disabled={isLoading}>
              {isLoading ? 'Registrando...' : 'Criar Conta'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center text-sm">
          <Button variant="link" className="text-blue-600 hover:text-blue-700" onClick={() => navigate('/login')}>
            Já tem uma conta? Faça Login
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
