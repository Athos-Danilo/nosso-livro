import logging
import json
from datetime import datetime

class FormatadorJson(logging.Formatter):
    """Formatador de log personalizado que gera saídas estruturadas em formato JSON."""
    
    def format(self, record: logging.LogRecord) -> str:
        registro_log = {
            "timestamp": datetime.fromtimestamp(record.created).isoformat(),
            "nivel": record.levelname,
            "mensagem": record.getMessage(),
            "modulo": record.module,
            "funcao": record.funcName
        }
        
        if record.exc_info:
            registro_log["excecao"] = self.formatException(record.exc_info)
            
        return json.dumps(registro_log, ensure_ascii=False)

def configurar_logs() -> None:
    """Configura o sistema de logs padrão para interceptar e formatar em JSON."""
    logger_raiz = logging.getLogger()
    
    # Remove handlers padrão existentes
    for handler in logger_raiz.handlers[:]:
        logger_raiz.removeHandler(handler)
        
    # Adiciona o novo handler com formatação JSON
    handler_console = logging.StreamHandler()
    handler_console.setFormatter(FormatadorJson())
    logger_raiz.addHandler(handler_console)
    logger_raiz.setLevel(logging.INFO)

    # Redireciona logs das bibliotecas internas de servidores para o logger raiz
    for nome_logger in ("uvicorn", "uvicorn.error", "uvicorn.access", "fastapi"):
        logger = logging.getLogger(nome_logger)
        logger.handlers = []
        logger.propagate = True
