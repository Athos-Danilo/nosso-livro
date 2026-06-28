package controlador

import (
	"encoding/json"
	"net/http"
)

// responderComJSON envia uma resposta HTTP formatada em JSON
func responderComJSON(w http.ResponseWriter, status int, dados interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if dados != nil {
		if err := json.NewEncoder(w).Encode(dados); err != nil {
			// Se falhar ao serializar, envia erro interno básico
			http.Error(w, `{"erro": "falha ao serializar resposta do servidor"}`, http.StatusInternalServerError)
		}
	}
}

// responderComErro envia uma resposta de erro HTTP padronizada em JSON
func responderComErro(w http.ResponseWriter, status int, mensagem string) {
	resposta := map[string]string{"erro": mensagem}
	responderComJSON(w, status, resposta)
}
