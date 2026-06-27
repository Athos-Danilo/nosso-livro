package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"nosso-livro/servico-autenticacao-usuario/internal/repositorio"
)

func main() {
	log.Println("[API] Iniciando o Serviço de Autenticação e Usuário...")

	// 1. Conexão com o Banco de Dados
	urlBanco := os.Getenv("URL_BANCO_DADOS")
	if urlBanco == "" {
		log.Println("[Aviso] A variável de ambiente URL_BANCO_DADOS não está definida. O serviço continuará, mas falhará em chamadas de banco.")
	} else {
		poolBanco, err := repositorio.ConectarBanco(urlBanco)
		if err != nil {
			log.Fatalf("[Erro] Falha catastrófica ao conectar no banco de dados: %v\n", err)
		}
		defer poolBanco.Close()
	}

	// Endpoint básico de verificação de saúde para testar a inicialização do servidor
	http.HandleFunc("/saude", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		fmt.Fprint(w, `{"status": "ativo", "mensagem": "Serviço de Autenticação e Usuário está funcionando corretamente"}`)
	})

	porta := ":8080"
	log.Printf("[API] Servidor HTTP rodando na porta %s\n", porta)
	if err := http.ListenAndServe(porta, nil); err != nil {
		log.Fatalf("[Erro] Erro ao iniciar o servidor HTTP: %v\n", err)
	}
}

