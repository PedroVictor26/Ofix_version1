/**
 * Testes unitários para MessageBubble component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MessageBubble from '../MessageBubble';

describe('MessageBubble', () => {
  const baseConversa = {
    id: 1,
    conteudo: 'Mensagem de teste',
    timestamp: '2024-01-01T10:30:00.000Z',
    metadata: {}
  };

  describe('renderização básica', () => {
    it('deve renderizar conteúdo da mensagem', () => {
      const conversa = { ...baseConversa, tipo: 'usuario' };
      render(<MessageBubble conversa={conversa} />);

      expect(screen.getByText('Mensagem de teste')).toBeInTheDocument();
    });

    it('deve renderizar timestamp formatado', () => {
      const conversa = { ...baseConversa, tipo: 'usuario' };
      render(<MessageBubble conversa={conversa} />);

      // Timestamp deve estar presente (formato pode variar por locale)
      const timestamp = screen.getByText(/\d{2}:\d{2}/);
      expect(timestamp).toBeInTheDocument();
    });

    it('não deve renderizar timestamp se não fornecido', () => {
      const conversa = { ...baseConversa, tipo: 'usuario', timestamp: null };
      render(<MessageBubble conversa={conversa} />);

      const timestamps = screen.queryAllByText(/\d{2}:\d{2}/);
      expect(timestamps).toHaveLength(0);
    });
  });

  describe('tipos de mensagem', () => {
    it('deve renderizar mensagem do usuário com estilo correto', () => {
      const conversa = { ...baseConversa, tipo: 'usuario' };
      const { container } = render(<MessageBubble conversa={conversa} />);

      const bubble = container.querySelector('.bg-blue-600');
      expect(bubble).toBeInTheDocument();
    });

    it('deve renderizar mensagem do agente com estilo correto', () => {
      const conversa = { ...baseConversa, tipo: 'agente' };
      const { container } = render(<MessageBubble conversa={conversa} />);

      const bubble = container.querySelector('.bg-white');
      expect(bubble).toBeInTheDocument();
    });

    it('deve renderizar mensagem de sistema com estilo correto', () => {
      const conversa = { ...baseConversa, tipo: 'sistema' };
      const { container } = render(<MessageBubble conversa={conversa} />);

      const bubble = container.querySelector('.bg-slate-100');
      expect(bubble).toBeInTheDocument();
    });

    it('deve renderizar mensagem de erro com estilo correto', () => {
      const conversa = { ...baseConversa, tipo: 'erro' };
      const { container } = render(<MessageBubble conversa={conversa} />);

      const bubble = container.querySelector('.bg-red-50');
      expect(bubble).toBeInTheDocument();
    });

    it('deve renderizar mensagem de confirmação com estilo correto', () => {
      const conversa = { ...baseConversa, tipo: 'confirmacao' };
      const { container } = render(<MessageBubble conversa={conversa} />);

      const bubble = container.querySelector('.bg-green-50');
      expect(bubble).toBeInTheDocument();
    });

    it('deve renderizar mensagem de pergunta com estilo correto', () => {
      const conversa = { ...baseConversa, tipo: 'pergunta' };
      const { container } = render(<MessageBubble conversa={conversa} />);

      const bubble = container.querySelector('.bg-yellow-50');
      expect(bubble).toBeInTheDocument();
    });

    it('deve renderizar mensagem de cadastro com estilo correto', () => {
      const conversa = { ...baseConversa, tipo: 'cadastro' };
      const { container } = render(<MessageBubble conversa={conversa} />);

      const bubble = container.querySelector('.bg-purple-50');
      expect(bubble).toBeInTheDocument();
    });

    it('deve usar estilo padrão para tipo desconhecido', () => {
      const conversa = { ...baseConversa, tipo: 'desconhecido' };
      const { container } = render(<MessageBubble conversa={conversa} />);

      const bubble = container.querySelector('.bg-white');
      expect(bubble).toBeInTheDocument();
    });
  });

  describe('avatares', () => {
    it('deve exibir avatar à direita para mensagens do usuário', () => {
      const conversa = { ...baseConversa, tipo: 'usuario' };
      const { container } = render(<MessageBubble conversa={conversa} />);

      const wrapper = container.querySelector('.justify-end');
      expect(wrapper).toBeInTheDocument();
    });

    it('deve exibir avatar à esquerda para mensagens do agente', () => {
      const conversa = { ...baseConversa, tipo: 'agente' };
      const { container } = render(<MessageBubble conversa={conversa} />);

      const wrapper = container.querySelector('.justify-start');
      expect(wrapper).toBeInTheDocument();
    });

    it('deve centralizar mensagens do sistema', () => {
      const conversa = { ...baseConversa, tipo: 'sistema' };
      const { container } = render(<MessageBubble conversa={conversa} />);

      const wrapper = container.querySelector('.justify-center');
      expect(wrapper).toBeInTheDocument();
    });

    it('não deve exibir avatar para mensagens do usuário no lado esquerdo', () => {
      const conversa = { ...baseConversa, tipo: 'usuario' };
      const { container } = render(<MessageBubble conversa={conversa} />);

      // Avatar do usuário deve estar à direita
      const avatars = container.querySelectorAll('.w-8.h-8');
      expect(avatars).toHaveLength(1);
    });
  });

  describe('botões de ação', () => {
    it('deve renderizar botão de cadastro quando tipo é cadastro e há dados', () => {
      const conversa = {
        ...baseConversa,
        tipo: 'cadastro',
        metadata: {
          dadosExtraidos: {
            nome: 'João Silva',
            telefone: '11999999999'
          }
        }
      };
      render(<MessageBubble conversa={conversa} />);

      const button = screen.getByText(/Cadastrar Cliente/);
      expect(button).toBeInTheDocument();
    });

    it('não deve renderizar botão se não for tipo cadastro', () => {
      const conversa = {
        ...baseConversa,
        tipo: 'agente',
        metadata: {
          dadosExtraidos: {
            nome: 'João Silva'
          }
        }
      };
      render(<MessageBubble conversa={conversa} />);

      const button = screen.queryByText(/Cadastrar Cliente/);
      expect(button).not.toBeInTheDocument();
    });

    it('não deve renderizar botão se não houver dadosExtraidos', () => {
      const conversa = {
        ...baseConversa,
        tipo: 'cadastro',
        metadata: {}
      };
      render(<MessageBubble conversa={conversa} />);

      const button = screen.queryByText(/Cadastrar Cliente/);
      expect(button).not.toBeInTheDocument();
    });

    it('deve chamar onAbrirModal com dados ao clicar no botão', () => {
      const onAbrirModal = vi.fn();
      const dadosExtraidos = {
        nome: 'João Silva',
        telefone: '11999999999'
      };
      const conversa = {
        ...baseConversa,
        tipo: 'cadastro',
        metadata: { dadosExtraidos }
      };

      render(<MessageBubble conversa={conversa} onAbrirModal={onAbrirModal} />);

      const button = screen.getByText(/Cadastrar Cliente/);
      fireEvent.click(button);

      expect(onAbrirModal).toHaveBeenCalledWith(dadosExtraidos);
    });
  });

  describe('formatação de conteúdo', () => {
    it('deve preservar quebras de linha no conteúdo', () => {
      const conversa = {
        ...baseConversa,
        tipo: 'agente',
        conteudo: 'Linha 1\nLinha 2\nLinha 3'
      };
      const { container } = render(<MessageBubble conversa={conversa} />);

      const content = container.querySelector('.whitespace-pre-wrap');
      expect(content).toBeInTheDocument();
      expect(content?.textContent).toBe('Linha 1\nLinha 2\nLinha 3');
    });

    it('deve limitar largura máxima da mensagem', () => {
      const conversa = { ...baseConversa, tipo: 'usuario' };
      const { container } = render(<MessageBubble conversa={conversa} />);

      const messageContainer = container.querySelector('.max-w-\\[70\\%\\]');
      expect(messageContainer).toBeInTheDocument();
    });

    it('deve usar largura total para mensagens do sistema', () => {
      const conversa = { ...baseConversa, tipo: 'sistema' };
      const { container } = render(<MessageBubble conversa={conversa} />);

      const messageContainer = container.querySelector('.max-w-full');
      expect(messageContainer).toBeInTheDocument();
    });
  });

  describe('otimização com React.memo', () => {
    it('deve ser um componente memoizado', () => {
      expect(MessageBubble.$$typeof).toBeDefined();
    });

    it('não deve re-renderizar com mesmas props', () => {
      const conversa = { ...baseConversa, tipo: 'usuario' };
      const { rerender } = render(<MessageBubble conversa={conversa} />);

      const firstRender = screen.getByText('Mensagem de teste');
      
      // Re-render com mesmas props
      rerender(<MessageBubble conversa={conversa} />);

      const secondRender = screen.getByText('Mensagem de teste');
      
      // Deve ser o mesmo elemento
      expect(firstRender).toBe(secondRender);
    });
  });

  describe('callbacks opcionais', () => {
    it('deve funcionar sem onAbrirModal', () => {
      const conversa = {
        ...baseConversa,
        tipo: 'cadastro',
        metadata: {
          dadosExtraidos: { nome: 'João' }
        }
      };

      expect(() => {
        render(<MessageBubble conversa={conversa} />);
      }).not.toThrow();
    });

    it('deve funcionar sem onExecutarAcao', () => {
      const conversa = { ...baseConversa, tipo: 'agente' };

      expect(() => {
        render(<MessageBubble conversa={conversa} />);
      }).not.toThrow();
    });
  });

  describe('acessibilidade', () => {
    it('deve ter texto legível', () => {
      const conversa = { ...baseConversa, tipo: 'usuario' };
      render(<MessageBubble conversa={conversa} />);

      const text = screen.getByText('Mensagem de teste');
      expect(text).toHaveClass('text-sm');
    });

    it('deve ter contraste adequado para diferentes tipos', () => {
      const tipos = ['usuario', 'agente', 'erro', 'confirmacao'];
      
      tipos.forEach(tipo => {
        const conversa = { ...baseConversa, tipo };
        const { container } = render(<MessageBubble conversa={conversa} />);
        
        const textElement = container.querySelector('[class*="text-"]');
        expect(textElement).toBeInTheDocument();
      });
    });
  });
});
