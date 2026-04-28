# TrOCR FastAPI Service

Microserviço FastAPI para OCR usando o modelo TrOCR.

## Requisitos

- Python 3.11+
- `pip3` ou `pip`

## Instalação

### Opção 1: Instalar globalmente (simples para desenvolvimento)

```bash
pip3 install -r requirements.txt
```

### Opção 2: Usar ambiente virtual (recomendado para produção)

```bash
python3 -m venv .venv
source .venv/bin/activate  # No Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## Execução

### Separadamente

```bash
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Junto com toda a stack (do root do workspace)

```bash
# Primeiro: instalar dependências Python
pip3 install -r apps/trocr-api/requirements.txt

# Depois: rodar tudo junto
yarn dev
```

Isso inicia:

- `api` (NestJS) em `http://localhost:3000`
- `web` (React) em `http://localhost:5173`
- `trocr-api` (FastAPI) em `http://localhost:8000`

## Endpoints

- `GET /health` — verifica status do serviço
- `POST /ocr` — extrai texto de uma imagem
  - Envie como `multipart/form-data` com campo `image`
  - Retorna `{ "text": "..." }`

## Configuração

- `TROCR_MODEL_NAME`: modelo Hugging Face. Padrão: `microsoft/trocr-base-printed`
- `TROCR_DEVICE`: dispositivo PyTorch (`cpu` ou `cuda`). Padrão: `cpu`

## Integração com a API Nest

Defina `TROCR_API_URL` apontando para o endpoint do OCR:

```bash
export TROCR_API_URL=http://localhost:8000/ocr
```

Ou adicione ao `.env` da API Nest.
