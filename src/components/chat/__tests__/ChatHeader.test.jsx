/**
 * Testes unitários para ChatHeader component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ChatHeader from '../ChatHeader';

describe('ChatHeader', () => {
  const defaultProps = {
    statusConexao: 'conectado',
    vozHabilitada: true,
    falando: false,
    onToggleVoz: vi.fn(),
    onPararFala: vi.fn(),
    onLimparHistorico: vi.fn(),
    onToggleConfig: vi.fn(),
    onReconectar: vi.fn()
  };

  describe('renderização', () => {
    it('deve renderizar título e logo', () => {
      render(<ChatHeader {...defaultProps} />);

      expect(screen.getByText('Assistente IA OFIX')).toBeInTheDocument();
      expect(screen.getByText('Powered by Agno AI Agent')).toBeInTheDocument();
    });

    it('deve renderizar todos os botões de ação', () => {
      render(<ChatHeader {...defaultProps} />);

      expect(screen.getByTitle('Desativar voz')).toBeInTheDocument();
      expect(screen.getByTitle('Limpar histórico')).toBeInTheDocument();
      expect(screen.getByTitle('Configurações de voz')).toBeInTheDocument();
      expect(screen.getByText('Reconectar')).toBeInTheDocument();
    });
  });

  describe('status de conexão', () => {
    it('deve exibir status "Agente Online" quando conectado', () => {
      render(<ChatHeader {...defaultProps} statusConexao="conectado" />);

      expect(screen.getByText('Agente Online')).toBeInTheDocument();
    });

    it('deve exibir status "Conectando..." quando conectando', () => {
      render(<ChatHeader {...defaultProps} statusConexao="conectando" />);

      expect(screen.getByText('Conectando...')).toBeInTheDocument();
    });

    it('deve exibir status "Erro de Conexão" quando houver erro', () => {
      render(<ChatHeader {...defaultProps} statusConexao="erro" />);

      expect(screen.getByText('Erro de Conexão')).toBeInTheDocument();
    });

    it('deve exibir status "Desconectado" por padrão', () => {
      render(<ChatHeader {...defaultProps} statusConexao="desconectado" />);

      expect(screen.getByText('Desconectado')).toBeInTheDocument();
    });
  });

  describe('botão de voz', () => {
    it('deve exibir ícone de volume quando voz está habilitada', () => {
      render(<ChatHeader {...defaultProps} vozHabilitada={true} />);

      const button = screen.getByTitle('Desativar voz');
      expect(button).toBeInTheDocument();
    });

    it('deve exibir ícone de mudo quando voz está desabilitada', () => {
      render(<ChatHeader {...defaultProps} vozHabilitada={false} />);

      const button = screen.getByTitle('Ativar voz');
      expect(button).toBeInTheDocument();
    });

    it('deve chamar onToggleVoz ao clicar', () => {
      const onToggleVoz = vi.fn();
      render(<ChatHeader {...defaultProps} onToggleVoz={onToggleVoz} />);

      const button = screen.getByTitle('Desativar voz');
      fireEvent.click(button);

      expect(onToggleVoz).toHaveBeenCalledTimes(1);
    });
  });

  describe('botão parar fala', () => {
    it('deve exibir botão quando está falando', () => {
      render(<ChatHeader {...defaultProps} falando={true} />);

      const button = screen.getByTitle('Parar fala');
      expect(button).toBeInTheDocument();
    });

    it('não deve exibir botão quando não está falando', () => {
      render(<ChatHeader {...defaultProps} falando={false} />);

      const button = screen.queryByTitle('Parar fala');
      expect(button).not.toBeInTheDocument();
    });

    it('deve chamar onPararFala ao clicar', () => {
      const onPararFala = vi.fn();
      render(<ChatHeader {...defaultProps} falando={true} onPararFala={onPararFala} />);

      const button = screen.getByTitle('Parar fala');
      fireEvent.click(button);

      expect(onPararFala).toHaveBeenCalledTimes(1);
    });
  });

  describe('botão limpar histórico', () => {
    it('deve chamar onLimparHistorico ao clicar', () => {
      const onLimparHistorico = vi.fn();
      render(<ChatHeader {...defaultProps} onLimparHistorico={onLimparHistorico} />);

      const button = screen.getByTitle('Limpar histórico');
      fireEvent.click(button);

      expect(onLimparHistorico).toHaveBeenCalledTimes(1);
    });
  });

  describe('botão configurações', () => {
    it('deve chamar onToggleConfig ao clicar', () => {
      const onToggleConfig = vi.fn();
      render(<ChatHeader {...defaultProps} onToggleConfig={onToggleConfig} />);

      const button = screen.getByTitle('Configurações de voz');
      fireEvent.click(button);

      expect(onToggleConfig).toHaveBeenCalledTimes(1);
    });
  });

  describe('botão reconectar', () => {
    it('deve chamar onReconectar ao clicar', () => {
      const onReconectar = vi.fn();
      render(<ChatHeader {...defaultProps} onReconectar={onReconectar} />);

      const button = screen.getByText('Reconectar');
      fireEvent.click(button);

      expect(onReconectar).toHaveBeenCalledTimes(1);
    });

    it('deve estar desabilitado quando conectando', () => {
      render(<ChatHeader {...defaultProps} statusConexao="conectando" />);

      const button = screen.getByText('Reconectar');
      expect(button).toBeDisabled();
    });

    it('deve estar habilitado quando não está conectando', () => {
      render(<ChatHeader {...defaultProps} statusConexao="conectado" />);

      const button = screen.getByText('Reconectar');
      expect(button).not.toBeDisabled();
    });
  });

  describe('valores padrão', () => {
    it('deve usar valores padrão quando props não são fornecidas', () => {
      render(
        <ChatHeader
          onToggleVoz={vi.fn()}
          onPararFala={vi.fn()}
          onLimparHistorico={vi.fn()}
          onToggleConfig={vi.fn()}
          onReconectar={vi.fn()}
        />
      );

      expect(screen.getByText('Desconectado')).toBeInTheDocument();
      expect(screen.getByTitle('Desativar voz')).toBeInTheDocument();
    });
  });

  describe('estilos condicionais', () => {
    it('deve aplicar estilo verde quando voz está habilitada', () => {
      render(<ChatHeader {...defaultProps} vozHabilitada={true} />);

      const button = screen.getByTitle('Desativar voz');
      expect(button).toHaveClass('text-green-600');
    });

    it('deve aplicar estilo cinza quando voz está desabilitada', () => {
      render(<ChatHeader {...defaultProps} vozHabilitada={false} />);

      const button = screen.getByTitle('Ativar voz');
      expect(button).toHaveClass('text-gray-600');
    });
  });

  describe('acessibilidade', () => {
    it('deve ter títulos descritivos em todos os botões', () => {
      render(<ChatHeader {...defaultProps} />);

      expect(screen.getByTitle('Desativar voz')).toBeInTheDocument();
      expect(screen.getByTitle('Limpar histórico')).toBeInTheDocument();
      expect(screen.getByTitle('Configurações de voz')).toBeInTheDocument();
    });

    it('deve ter texto visível no botão reconectar', () => {
      render(<ChatHeader {...defaultProps} />);

      expect(screen.getByText('Reconectar')).toBeInTheDocument();
    });
  });
});
