import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import * as authService from '../services/auth.service';
import { useAuth } from '../context/AuthContext';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function InvitePage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { login } = useAuth(); // Usamos o login do contexto para atualizar o estado global se necessário, mas aqui vamos fazer manual e recarregar ou usar uma função do contexto se houver.
    // O AuthContext tem uma função 'login' que recebe credentials, mas aqui temos um fluxo diferente.
    // O ideal seria o AuthContext ter um método 'setAuthData' ou similar, ou recarregarmos a página.
    // Como o AuthContext lê do localStorage na inicialização, podemos salvar no localStorage e forçar uma atualização ou usar window.location.href.

    const [status, setStatus] = useState('loading'); // loading, error, success
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        const token = searchParams.get('token');

        if (!token) {
            setStatus('error');
            setErrorMessage('Link de convite inválido (token ausente).');
            return;
        }

        const processInvite = async () => {
            try {
                // O authService.loginWithInvite já salva no localStorage
                await authService.loginWithInvite(token);

                // Forçar atualização do contexto ou redirecionar
                // Como o AuthContext não expõe um método direto para setar usuário sem credenciais (login normal),
                // e o loadUserFromStorage roda no mount, um reload simples ou redirecionamento pode funcionar se o AuthContext ouvir mudanças ou se recarregarmos a app.
                // Vamos tentar navegar para /dashboard e deixar o AuthContext pegar o token do storage (se ele não pegar automaticamente, talvez precisemos de um reload).
                // O AuthContext tem um useEffect que roda loadUserFromStorage apenas no mount.

                // Opção Segura: Redirecionar com reload para garantir que o AuthContext pegue o novo estado
                window.location.href = '/dashboard';

            } catch (error) {
                console.error(error);
                setStatus('error');
                setErrorMessage(error.message || 'Falha ao processar o convite.');
            }
        };

        processInvite();
    }, [searchParams, navigate]);

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                <h2 className="text-xl font-semibold text-slate-700">Validando seu convite...</h2>
                <p className="text-slate-500">Por favor, aguarde um momento.</p>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
                <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Ops! Algo deu errado.</h2>
                    <p className="text-slate-600 mb-6">{errorMessage}</p>
                    <Button onClick={() => navigate('/login')} className="w-full">
                        Ir para Login
                    </Button>
                </div>
            </div>
        );
    }

    return null; // Success redireciona
}
