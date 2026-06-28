package repositorio

import (
	"context"
	"errors"
	"fmt"
	"os"
	"sync"
	"testing"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"nosso-livro/servico-autenticacao-usuario/internal/dominio"
)

// obterURLBancoTeste verifica e retorna a string de conexão para banco de testes
func obterURLBancoTeste() string {
	url := os.Getenv("URL_BANCO_DADOS_TESTE")
	if url == "" {
		// Fallback para URL de produção/dev caso queira rodar localmente no mesmo banco
		url = os.Getenv("URL_BANCO_DADOS")
	}
	return url
}

// TestRepositorioFluxoCompleto testa o cadastro, buscas e restrições de chaves únicas do repositório
func TestRepositorioFluxoCompleto(t *testing.T) {
	urlBanco := obterURLBancoTeste()
	if urlBanco == "" {
		t.Skip("Pulando testes de integração: variáveis URL_BANCO_DADOS_TESTE ou URL_BANCO_DADOS não estão configuradas")
	}

	ctx := context.Background()
	pool, err := ConectarBanco(urlBanco)
	if err != nil {
		t.Fatalf("falha ao conectar no banco de testes: %v", err)
	}
	defer pool.Close()

	repo := NovoRepositorioUsuarioPostgres(pool)

	// Garante limpeza de restos de testes anteriores se houver
	limparUsuariosDeTeste(t, pool)
	defer limparUsuariosDeTeste(t, pool)

	timestamp := time.Now().UnixNano()
	whatsappUnico := fmt.Sprintf("55119%d", timestamp%100000000)
	emailUnico := fmt.Sprintf("usuario_%d@teste.com", timestamp)

	usuario := &dominio.Usuario{
		Nome:      "Usuário de Teste Integrado",
		WhatsApp:  whatsappUnico,
		Email:     emailUnico,
		SenhaHash: "$2a$10$tM2Ld...mock_hash...",
		Permissao: "membro",
		Ativo:     true,
	}

	// 1. Testa a criação
	err = repo.Criar(ctx, usuario)
	if err != nil {
		t.Fatalf("falha ao criar usuário no banco: %v", err)
	}

	if usuario.ID == "" {
		t.Error("esperava ID UUID gerado pelo banco e preenchido na struct")
	}
	if usuario.CriadoEm.IsZero() || usuario.AtualizadoEm.IsZero() {
		t.Error("esperava datas de controle de tempo geradas pelo banco")
	}

	// 2. Testa busca por ID
	buscadoID, err := repo.BuscarPorID(ctx, usuario.ID)
	if err != nil {
		t.Errorf("falha ao buscar usuário por ID: %v", err)
	} else if buscadoID.Email != usuario.Email {
		t.Errorf("esperava email '%s', obteve '%s'", usuario.Email, buscadoID.Email)
	}

	// 3. Testa busca por WhatsApp
	buscadoWA, err := repo.BuscarPorWhatsApp(ctx, usuario.WhatsApp)
	if err != nil {
		t.Errorf("falha ao buscar usuário por WhatsApp: %v", err)
	} else if buscadoWA.ID != usuario.ID {
		t.Errorf("esperava ID '%s', obteve '%s'", usuario.ID, buscadoWA.ID)
	}

	// 4. Testa busca por E-mail
	buscadoEmail, err := repo.BuscarPorEmail(ctx, usuario.Email)
	if err != nil {
		t.Errorf("falha ao buscar usuário por E-mail: %v", err)
	} else if buscadoEmail.ID != usuario.ID {
		t.Errorf("esperava ID '%s', obteve '%s'", usuario.ID, buscadoEmail.ID)
	}

	// 5. Testa violação de WhatsApp duplicado
	usuarioDuplicadoWA := &dominio.Usuario{
		Nome:      "Outro Nome",
		WhatsApp:  usuario.WhatsApp, // Mesmo WhatsApp
		Email:     fmt.Sprintf("outro_%d@teste.com", timestamp),
		SenhaHash: "hash",
		Permissao: "membro",
		Ativo:     true,
	}
	err = repo.Criar(ctx, usuarioDuplicadoWA)
	if !errors.Is(err, dominio.ErrWhatsAppDuplicado) {
		t.Errorf("esperava erro '%v', obteve: %v", dominio.ErrWhatsAppDuplicado, err)
	}

	// 6. Testa violação de E-mail duplicado
	usuarioDuplicadoEmail := &dominio.Usuario{
		Nome:      "Outro Nome",
		WhatsApp:  fmt.Sprintf("551198%d", timestamp%10000000),
		Email:     usuario.Email, // Mesmo E-mail
		SenhaHash: "hash",
		Permissao: "membro",
		Ativo:     true,
	}
	err = repo.Criar(ctx, usuarioDuplicadoEmail)
	if !errors.Is(err, dominio.ErrEmailDuplicado) {
		t.Errorf("esperava erro '%v', obteve: %v", dominio.ErrEmailDuplicado, err)
	}
}

// TestRepositorioConcorrenciaMassiva testa cadastros simultâneos concorrentes garantindo integridade
func TestRepositorioConcorrenciaMassiva(t *testing.T) {
	urlBanco := obterURLBancoTeste()
	if urlBanco == "" {
		t.Skip("Pulando teste de concorrência: banco de testes não configurado")
	}

	ctx := context.Background()
	pool, err := ConectarBanco(urlBanco)
	if err != nil {
		t.Fatalf("falha ao conectar no banco de testes: %v", err)
	}
	defer pool.Close()

	repo := NovoRepositorioUsuarioPostgres(pool)

	limparUsuariosDeTeste(t, pool)
	defer limparUsuariosDeTeste(t, pool)

	timestamp := time.Now().UnixNano()
	whatsappColisao := fmt.Sprintf("551199%d", timestamp%1000000)

	totalGoroutines := 20
	var wg sync.WaitGroup
	var mu sync.Mutex

	sucessos := 0
	errosDuplicados := 0
	outrosErros := 0

	wg.Add(totalGoroutines)
	for i := 0; i < totalGoroutines; i++ {
		go func(id int) {
			defer wg.Done()

			// Cadastro com mesmo WhatsApp, mas e-mail diferente
			usuario := &dominio.Usuario{
				Nome:      fmt.Sprintf("Usuário Concorrente %d", id),
				WhatsApp:  whatsappColisao,
				Email:     fmt.Sprintf("concorrente_%d_%d@teste.com", id, timestamp),
				SenhaHash: "hash",
				Permissao: "membro",
				Ativo:     true,
			}

			err := repo.Criar(ctx, usuario)

			mu.Lock()
			defer mu.Unlock()

			if err == nil {
				sucessos++
			} else if errors.Is(err, dominio.ErrWhatsAppDuplicado) {
				errosDuplicados++
			} else {
				outrosErros++
			}
		}(i)
	}

	wg.Wait()

	// Validações do teste de concorrência massiva
	if sucessos != 1 {
		t.Errorf("esperava que exatamente 1 cadastro concorrente obtivesse sucesso, obteve: %d", sucessos)
	}

	esperadoErros := totalGoroutines - 1
	if errosDuplicados != esperadoErros {
		t.Errorf("esperava que exatamente %d cadastros falhassem com WhatsApp duplicado, obteve: %d", esperadoErros, errosDuplicados)
	}

	if outrosErros > 0 {
		t.Errorf("detectou %d erros não esperados durante o teste de concorrência", outrosErros)
	}
}

// limparUsuariosDeTeste remove usuários gerados nos testes para manter o banco limpo
func limparUsuariosDeTeste(t *testing.T, pool *pgxpool.Pool) {
	ctx := context.Background()
	_, err := pool.Exec(ctx, "DELETE FROM usuarios WHERE email LIKE '%@teste.com'")
	if err != nil {
		t.Logf("[Aviso] Falha ao limpar banco de dados de testes: %v", err)
	}
}
