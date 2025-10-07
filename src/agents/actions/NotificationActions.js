/**
 * 📱 NOTIFICATION ACTIONS
 * 
 * Ações relacionadas ao envio de notificações e comunicação
 */

class NotificationActions {
  constructor() {
    this.name = 'NotificationActions';
    this.version = '1.0.0';
  }

  /**
   * Enviar notificação genérica
   */
  async send(parameters, context) {
    console.log('📱 Executando: Enviar notificação');
    console.log('📋 Parâmetros:', parameters);
    
    try {
      const { destinatario, mensagem } = parameters;
      
      if (!destinatario || !mensagem) {
        throw new Error('Destinatário e mensagem são obrigatórios');
      }
      
      const notification = {
        id: `NOT-${Date.now()}`,
        destinatario,
        mensagem,
        tipo: parameters.tipo || 'INFO',
        prioridade: parameters.prioridade || 'NORMAL',
        canal: parameters.canal || 'SISTEMA',
        dataEnvio: new Date(),
        remetente: context.user?.id || 'MATIAS',
        status: 'ENVIADO'
      };
      
      // TODO: Integrar com sistema real de notificações
      // await notificationService.send(notification);
      
      console.log('✅ Notificação enviada');
      
      return {
        success: true,
        message: `Notificação enviada para ${destinatario}`,
        data: notification
      };
      
    } catch (error) {
      console.error('❌ Erro ao enviar notificação:', error);
      
      return {
        success: false,
        message: `Erro ao enviar notificação: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Enviar mensagem via WhatsApp
   */
  async sendWhatsApp(parameters, context) {
    console.log('📱 Executando: Enviar WhatsApp');
    console.log('📋 Parâmetros:', parameters);
    
    try {
      const { telefone, mensagem } = parameters;
      
      if (!telefone || !mensagem) {
        throw new Error('Telefone e mensagem são obrigatórios');
      }
      
      // Validar formato do telefone
      const phoneRegex = /^\d{10,11}$/;
      const cleanPhone = telefone.replace(/\D/g, '');
      
      if (!phoneRegex.test(cleanPhone)) {
        throw new Error('Formato de telefone inválido. Use apenas números (10 ou 11 dígitos)');
      }
      
      // Preparar mensagem personalizada
      const personalizedMessage = this.personalizeMessage(mensagem, context);
      
      const whatsappMessage = {
        id: `WPP-${Date.now()}`,
        telefone: cleanPhone,
        mensagem: personalizedMessage,
        dataEnvio: new Date(),
        remetente: context.user?.oficinaId || 'OFIX',
        status: 'PENDENTE'
      };
      
      // TODO: Integrar com WhatsApp Business API
      // const result = await whatsappService.sendMessage(whatsappMessage);
      
      // Simulação
      whatsappMessage.status = 'ENVIADO';
      whatsappMessage.messageId = `wpp_${Date.now()}`;
      
      console.log('✅ WhatsApp enviado');
      
      return {
        success: true,
        message: `WhatsApp enviado para ${telefone}`,
        data: whatsappMessage,
        preview: personalizedMessage.substring(0, 100) + '...'
      };
      
    } catch (error) {
      console.error('❌ Erro ao enviar WhatsApp:', error);
      
      return {
        success: false,
        message: `Erro ao enviar WhatsApp: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Enviar email
   */
  async sendEmail(parameters, context) {
    console.log('📱 Executando: Enviar email');
    console.log('📋 Parâmetros:', parameters);
    
    try {
      const { email, assunto, mensagem } = parameters;
      
      if (!email || !assunto || !mensagem) {
        throw new Error('Email, assunto e mensagem são obrigatórios');
      }
      
      // Validar email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new Error('Formato de email inválido');
      }
      
      const emailData = {
        id: `EMAIL-${Date.now()}`,
        destinatario: email,
        assunto,
        mensagem: this.personalizeMessage(mensagem, context),
        dataEnvio: new Date(),
        remetente: context.user?.email || 'oficina@ofix.com',
        status: 'ENVIADO'
      };
      
      // TODO: Integrar com serviço de email
      // await emailService.send(emailData);
      
      console.log('✅ Email enviado');
      
      return {
        success: true,
        message: `Email enviado para ${email}`,
        data: emailData
      };
      
    } catch (error) {
      console.error('❌ Erro ao enviar email:', error);
      
      return {
        success: false,
        message: `Erro ao enviar email: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Enviar SMS
   */
  async sendSMS(parameters, context) {
    console.log('📱 Executando: Enviar SMS');
    console.log('📋 Parâmetros:', parameters);
    
    try {
      const { telefone, mensagem } = parameters;
      
      if (!telefone || !mensagem) {
        throw new Error('Telefone e mensagem são obrigatórios');
      }
      
      // Limitar tamanho da mensagem SMS
      const maxLength = 160;
      let smsMessage = mensagem;
      
      if (smsMessage.length > maxLength) {
        smsMessage = smsMessage.substring(0, maxLength - 3) + '...';
      }
      
      const smsData = {
        id: `SMS-${Date.now()}`,
        telefone: telefone.replace(/\D/g, ''),
        mensagem: smsMessage,
        dataEnvio: new Date(),
        remetente: 'OFIX',
        status: 'ENVIADO',
        caracteres: smsMessage.length
      };
      
      // TODO: Integrar com serviço de SMS
      // await smsService.send(smsData);
      
      console.log('✅ SMS enviado');
      
      return {
        success: true,
        message: `SMS enviado para ${telefone}`,
        data: smsData
      };
      
    } catch (error) {
      console.error('❌ Erro ao enviar SMS:', error);
      
      return {
        success: false,
        message: `Erro ao enviar SMS: ${error.message}`,
        error: error.message
      };
    }
  }

  /**
   * Personalizar mensagem com dados do contexto
   */
  personalizeMessage(mensagem, context) {
    let personalizedMessage = mensagem;
    
    // Substituir placeholders
    const replacements = {
      '{oficina}': context.user?.oficinaNome || 'Ofix',
      '{data}': new Date().toLocaleDateString('pt-BR'),
      '{hora}': new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      '{atendente}': context.user?.nome || 'Matias'
    };
    
    for (const [placeholder, value] of Object.entries(replacements)) {
      personalizedMessage = personalizedMessage.replace(new RegExp(placeholder, 'g'), value);
    }
    
    // Adicionar assinatura padrão se não houver
    if (!personalizedMessage.includes('Ofix') && !personalizedMessage.includes('oficina')) {
      personalizedMessage += '\n\n---\nOficina Ofix - Seu carro em boas mãos';
    }
    
    return personalizedMessage;
  }

  /**
   * Obter templates de mensagem
   */
  getMessageTemplates() {
    return {
      agendamento_confirmacao: {
        titulo: 'Confirmação de Agendamento',
        whatsapp: 'Olá! Seu agendamento para {data} às {hora} foi confirmado. Aguardamos você na {oficina}!',
        email: 'Prezado cliente,\n\nSeu agendamento foi confirmado para {data} às {hora}.\n\nAguardamos você na {oficina}.\n\nAtenciosamente,\n{atendente}',
        sms: 'Agendamento confirmado para {data} às {hora} na {oficina}.'
      },
      servico_pronto: {
        titulo: 'Serviço Concluído',
        whatsapp: 'Boa notícia! Seu veículo está pronto para retirada. Pode vir buscar na {oficina} até às 18h.',
        email: 'Prezado cliente,\n\nTemos o prazer de informar que seu veículo está pronto para retirada.\n\nHorário de funcionamento: Segunda a sexta, 8h às 18h.\n\nAguardamos você!',
        sms: 'Seu veículo está pronto! Retire na {oficina} até 18h.'
      },
      peca_chegou: {
        titulo: 'Peça Disponível',
        whatsapp: 'A peça do seu veículo chegou! Pode agendar a continuação do serviço. Entre em contato conosco.',
        email: 'Prezado cliente,\n\nA peça necessária para seu veículo chegou.\n\nEntre em contato para agendar a continuação do serviço.\n\nTelefone: (11) 99999-9999',
        sms: 'Peça chegou! Ligue para agendar: (11) 99999-9999'
      }
    };
  }

  /**
   * Enviar notificação usando template
   */
  async sendFromTemplate(parameters, context) {
    try {
      const { templateId, destinatario, canal, dados } = parameters;
      
      const templates = this.getMessageTemplates();
      const template = templates[templateId];
      
      if (!template) {
        throw new Error(`Template ${templateId} não encontrado`);
      }
      
      let mensagem = template[canal] || template.whatsapp;
      
      // Substituir dados específicos do template
      if (dados) {
        for (const [key, value] of Object.entries(dados)) {
          mensagem = mensagem.replace(new RegExp(`{${key}}`, 'g'), value);
        }
      }
      
      // Chamar método de envio apropriado
      switch (canal) {
        case 'whatsapp':
          return await this.sendWhatsApp({ telefone: destinatario, mensagem }, context);
        case 'email':
          return await this.sendEmail({ 
            email: destinatario, 
            assunto: template.titulo, 
            mensagem 
          }, context);
        case 'sms':
          return await this.sendSMS({ telefone: destinatario, mensagem }, context);
        default:
          return await this.send({ destinatario, mensagem }, context);
      }
      
    } catch (error) {
      console.error('❌ Erro ao enviar template:', error);
      
      return {
        success: false,
        message: `Erro ao enviar template: ${error.message}`,
        error: error.message
      };
    }
  }

  async healthCheck() {
    try {
      const templates = this.getMessageTemplates();
      return templates && Object.keys(templates).length > 0;
    } catch {
      return false;
    }
  }
}

export { NotificationActions };
