# Implementation Plan

- [x] 1. Criar sistema de logging estruturado


  - Implementar classe Logger com métodos error, warn, info, debug
  - Adicionar envio de logs para servidor em produção
  - Configurar níveis de log por ambiente
  - _Requirements: 1.4_








- [ ] 2. Implementar validação e sanitização de mensagens
  - Criar função validarMensagem com validações de tamanho e formato
  - Integrar DOMPurify para sanitização de HTML/XSS






  - Adicionar testes unitários para validação
  - _Requirements: 1.5_






- [ ] 3. Criar hook useAuthHeaders
  - Extrair lógica de autenticação em hook reutilizável



  - Implementar tratamento de erros de token
  - Adicionar testes unitários
  - _Requirements: 1.6_




- [ ] 4. Refatorar useChatAPI com retry e timeout
  - Implementar retry logic com exponential backoff
  - Adicionar timeout configurável de 30s
  - Integrar validação de mensagens



  - Adicionar logging estruturado
  - Criar testes unitários incluindo cenários de retry
  - _Requirements: 1.6, 1.7_




- [ ] 5. Otimizar useChatHistory com debounce e limite
  - Implementar debounce de 1s para auto-save
  - Adicionar limite de 100 mensagens
  - Criar métodos de busca e estatísticas
  - Adicionar testes unitários
  - _Requirements: 1.6, 1.8_

- [ ] 6. Extrair hook useVoiceRecognition
  - Mover lógica de reconhecimento de voz para hook separado
  - Implementar modo contínuo

  - Adicionar filtro por confiança mínima
  - Criar testes unitários com mocks
  - _Requirements: 1.6_

- [x] 7. Extrair hook useVoiceSynthesis





  - Mover lógica de síntese de voz para hook separado
  - Implementar limpeza de markdown
  - Adicionar prevenção de eco
  - Criar testes unitários
  - _Requirements: 1.6_

- [ ] 8. Criar componente ChatHeader
  - Extrair header da AIPage
  - Implementar exibição de status de conexão
  - Adicionar botões de ação (voz, limpar, config, reconectar)
  - _Requirements: 1.6_

- [ ] 9. Criar componente MessageBubble
  - Extrair renderização de mensagem individual
  - Implementar renderização condicional por tipo
  - Adicionar botões de ação contextuais
  - Usar React.memo para otimização
  - _Requirements: 1.6, 1.8_

- [ ] 10. Criar componente ChatMessages com virtualização
  - Extrair lista de mensagens da AIPage
  - Implementar virtualização com react-window
  - Adicionar scroll automático
  - _Requirements: 1.6, 1.8_

- [ ] 11. Criar componente ChatInput
  - Extrair input de mensagem da AIPage
  - Adicionar barra de sugestões
  - Implementar validação em tempo real
  - _Requirements: 1.6, 1.11_

- [ ] 12. Criar componente VoiceConfigPanel
  - Extrair painel de configurações de voz
  - Implementar controles de velocidade, tom e volume
  - Adicionar seletor de vozes
  - _Requirements: 1.6_

- [ ] 13. Implementar sistema de toast notifications
  - Criar componente Toast reutilizável
  - Implementar fila de toasts
  - Adicionar tipos (success, error, warning, info)
  - Integrar em toda a aplicação
  - _Requirements: 1.9_

- [ ] 14. Criar constantes e configurações centralizadas
  - Expandir aiPageConfig.js com todas as constantes
  - Remover magic numbers do código
  - Adicionar configurações de consultas
  - _Requirements: 1.6, 1.8_

- [ ] 15. Implementar endpoint /agno/consultar-agendamentos
  - Criar rota no backend
  - Implementar query com filtros de período e status
  - Adicionar formatação de resposta
  - Criar testes de integração
  - _Requirements: 1.1_

- [ ] 16. Implementar endpoint /agno/consultar-clientes
  - Criar rota no backend
  - Implementar busca por nome, CPF e telefone
  - Adicionar formatação de resposta com histórico
  - Criar testes de integração
  - _Requirements: 1.2_

- [ ] 17. Implementar endpoint /agno/consultar-estoque
  - Criar rota no backend
  - Implementar busca por nome e categoria
  - Adicionar alertas de estoque mínimo
  - Criar testes de integração
  - _Requirements: 1.3_

- [ ] 18. Implementar endpoint /agno/consultar-os
  - Criar rota no backend
  - Implementar busca por número, status e cliente
  - Adicionar detalhes de serviços e peças
  - Criar testes de integração
  - _Requirements: 1.10_

- [x] 19. Implementar NLP intent classification





  - Criar função classifyIntent com patterns
  - Adicionar suporte para múltiplas intenções
  - Implementar cálculo de confiança
  - Criar testes unitários
  - _Requirements: 1.1, 1.2, 1.3, 1.10_

- [ ] 20. Implementar NLP entity extraction
  - Criar função extractEntities
  - Adicionar extração de nome, CPF, telefone, placa, OS
  - Implementar extração de período temporal
  - Criar testes unitários
  - _Requirements: 1.1, 1.2, 1.3, 1.10_

- [ ] 21. Criar utility queryParser
  - Implementar parseQuery para processar intenções
  - Adicionar reconhecimento de padrões
  - Integrar com entity extraction
  - Criar testes unitários
  - _Requirements: 1.1, 1.2, 1.3, 1.10_

- [ ] 22. Criar utility dataFormatter
  - Implementar formatarAgendamento
  - Implementar formatarCliente
  - Implementar formatarEstoque
  - Implementar formatarOS
  - Adicionar formatação de data e moeda
  - Criar testes unitários
  - _Requirements: 1.1, 1.2, 1.3, 1.10_

- [ ] 23. Criar hook useQueryHandler
  - Implementar executarConsulta com roteamento
  - Adicionar cache de consultas recentes
  - Implementar tratamento de erros por tipo
  - Criar testes unitários
  - _Requirements: 1.1, 1.2, 1.3, 1.10_

- [ ] 24. Criar componente QueryResultsPanel
  - Implementar exibição de resultados estruturados
  - Adicionar renderização condicional por tipo
  - Implementar botões de ação (detalhes, exportar)
  - _Requirements: 1.1, 1.2, 1.3, 1.10_

- [ ] 25. Implementar sugestões contextuais
  - Criar componente SuggestionsBar
  - Implementar lógica de sugestões baseada em contexto
  - Adicionar sugestões iniciais e dinâmicas
  - _Requirements: 1.11_

- [ ] 26. Integrar consulta de agendamentos no frontend
  - Conectar useQueryHandler com endpoint
  - Adicionar renderização de resultados
  - Implementar tratamento de erros
  - Adicionar testes de integração
  - _Requirements: 1.1_

- [ ] 27. Integrar consulta de clientes no frontend
  - Conectar useQueryHandler com endpoint
  - Adicionar renderização de resultados
  - Implementar abertura de modal com dados
  - Adicionar testes de integração
  - _Requirements: 1.2_

- [ ] 28. Integrar consulta de estoque no frontend
  - Conectar useQueryHandler com endpoint
  - Adicionar renderização de resultados com alertas
  - Implementar visualização de localização
  - Adicionar testes de integração
  - _Requirements: 1.3_

- [ ] 29. Integrar consulta de OS no frontend
  - Conectar useQueryHandler com endpoint
  - Adicionar renderização detalhada de OS
  - Implementar visualização de serviços e peças
  - Adicionar testes de integração
  - _Requirements: 1.10_

- [ ] 30. Implementar endpoint /agno/exportar-conversa
  - Criar rota no backend
  - Implementar geração de PDF
  - Adicionar upload para storage temporário
  - Criar testes de integração
  - _Requirements: 1.12_

- [ ] 31. Integrar exportação de conversas no frontend
  - Adicionar botão de exportar no header
  - Implementar seleção de período
  - Adicionar download de arquivo
  - _Requirements: 1.12_

- [ ] 32. Adicionar rate limiting no backend
  - Implementar middleware de rate limit
  - Configurar limites por endpoint
  - Adicionar mensagens de erro apropriadas
  - _Requirements: 1.5, 1.7_

- [ ] 33. Implementar caching no backend
  - Adicionar NodeCache para consultas frequentes
  - Configurar TTL apropriado por tipo
  - Implementar invalidação de cache
  - _Requirements: 1.8_

- [ ] 34. Adicionar índices no banco de dados
  - Criar índices para agendamentos
  - Criar índices para clientes
  - Criar índices para estoque
  - Criar índices para ordens de serviço
  - _Requirements: 1.8_

- [ ] 35. Implementar lazy loading de componentes
  - Adicionar React.lazy para VoiceConfigPanel
  - Adicionar React.lazy para QueryResultsPanel
  - Implementar Suspense com fallback
  - _Requirements: 1.8_

- [ ] 36. Configurar code splitting
  - Configurar manualChunks no vite.config
  - Separar vendor, voice e chat bundles
  - Otimizar tamanho dos bundles
  - _Requirements: 1.8_

- [ ] 37. Adicionar monitoramento com Sentry
  - Configurar Sentry no frontend
  - Configurar Sentry no backend
  - Integrar com sistema de logging
  - _Requirements: 1.4_

- [ ] 38. Criar testes E2E para fluxo de consultas
  - Testar consulta de agendamentos end-to-end
  - Testar consulta de clientes end-to-end
  - Testar consulta de estoque end-to-end
  - Testar consulta de OS end-to-end
  - _Requirements: 1.1, 1.2, 1.3, 1.10_

- [ ] 39. Criar testes de performance
  - Testar renderização de 100+ mensagens
  - Testar debounce de auto-save
  - Testar virtualização de lista
  - Medir tempo de resposta de consultas
  - _Requirements: 1.8_

- [ ] 40. Documentar APIs e componentes
  - Adicionar JSDoc em todos os componentes
  - Documentar endpoints da API
  - Criar guia de uso das consultas
  - Atualizar README com novas funcionalidades
  - _Requirements: Todos_

- [ ] 41. Refatorar AIPage principal
  - Integrar todos os novos componentes
  - Remover código duplicado
  - Simplificar lógica principal
  - Reduzir para ~200 linhas
  - _Requirements: 1.6_

- [ ] 42. Realizar testes de integração completos
  - Testar fluxo completo de chat
  - Testar integração com todos os endpoints
  - Testar tratamento de erros
  - Testar retry logic
  - _Requirements: Todos_

- [ ] 43. Otimizar bundle size
  - Analisar bundle com vite-bundle-visualizer
  - Remover dependências não utilizadas
  - Otimizar imports
  - Verificar tree-shaking
  - _Requirements: 1.8_

- [ ] 44. Configurar CI/CD
  - Adicionar testes no pipeline
  - Configurar build automático
  - Adicionar linting e type checking
  - Configurar deploy automático
  - _Requirements: Todos_

- [ ] 45. Realizar testes de aceitação do usuário
  - Testar todas as funcionalidades com usuários reais
  - Coletar feedback
  - Ajustar UX conforme necessário
  - Validar performance em produção
  - _Requirements: Todos_

