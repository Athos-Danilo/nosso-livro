// ─── Configuração do Jest — Serviço de Notificação ──────────────────────────
// Utiliza ts-jest para transpilação de TypeScript diretamente nos testes.

import type { Config } from 'jest';

const configuracao: Config = {
  // Utiliza o preset ts-jest para transpilação de TypeScript
  preset: 'ts-jest',

  // Ambiente de execução Node.js (sem DOM)
  testEnvironment: 'node',

  // Diretório raiz dos testes
  roots: ['<rootDir>/src'],

  // Padrão de busca de arquivos de teste
  testMatch: ['**/__testes__/**/*.test.ts'],

  // Extensões de módulo reconhecidas
  moduleFileExtensions: ['ts', 'js', 'json'],

  // Timeout aumentado para testes de rede (Ethereal Email)
  testTimeout: 20_000,

  // Limpa mocks automaticamente entre testes
  clearMocks: true,

  // Exibe resultados detalhados
  verbose: true,
};

export default configuracao;
