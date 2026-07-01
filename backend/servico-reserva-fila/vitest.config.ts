import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Carrega variáveis do .env.test nos workers
    setupFiles: ['testSetup.ts'],

    // Ambiente de execução: Node.js (sem DOM)
    environment: 'node',

    // Padrão de arquivos de teste
    include: ['src/**/*.spec.ts', 'src/**/*.test.ts'],

    // Timeout global para testes individuais (30s — acomoda o teste de concorrência)
    testTimeout: 30_000,

    // Timeout de hooks (beforeAll/afterAll com migrations pode demorar)
    hookTimeout: 60_000,

    // Cobertura de código
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/servidor.ts',      // Ponto de entrada — não é testado unitariamente
        'src/banco/prisma.ts',  // Singleton do cliente — mockado nos testes
        'src/**/*.spec.ts',
        'src/**/*.test.ts',
      ],
    },

    // Sequencial para testes de integração (evita race conditions entre suítes)
    // Os testes dentro de cada suíte ainda podem ser paralelos onde seguro
    pool: 'forks',
  },
});
