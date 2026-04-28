# `Turborepo` Vite starter

This is a community-maintained example. If you experience a problem, please submit a pull request with a fix. GitHub Issues will be closed.

## Using this example

Run the following command:

```sh
npx create-turbo@latest -e with-vite-react
```

## What's inside?

This Turborepo includes the following packages and apps:

### Apps and Packages

- `web`: react [vite](https://vitejs.dev) ts app
- `@repo/ui`: a stub component library shared by `web` application
- `@repo/eslint-config`: shared `eslint` configurations
- `@repo/typescript-config`: `tsconfig.json`s used throughout the monorepo

Each package and app is 100% [TypeScript](https://www.typescriptlang.org/).

### Utilities

This Turborepo has some additional tools already setup for you:

- [TypeScript](https://www.typescriptlang.org/) for static type checking
- [ESLint](https://eslint.org/) for code linting
- [Prettier](https://prettier.io) for code formatting

## Upload de páginas de livro com identificação por QR

A API (`apps/api`) expõe o endpoint `POST /book-pages/upload` para receber **somente** a imagem da página no campo `image` (`multipart/form-data`).

No processamento do upload, a API:

1. Lê o QR code da imagem para obter `alunoId` e `pagina`.
2. Extrai o texto (OCR) da página.
3. Extrai/salva o desenho da página.
4. Salva os artefatos em `uploads/<alunoId>/pagina-<NNN>/`.

## APIs de OCR

Três implementações estão disponíveis:

- **Tesseract.js**: OCR em JavaScript (padrão). Sem dependências externas.
- **Google Vision**: OCR em nuvem. Requer credenciais `GOOGLE_APPLICATION_CREDENTIALS`.
- **TrOCR**: OCR via modelo Hugging Face em FastAPI. Requer `TROCR_API_URL`.

### Setup inicial

1. **Instalar dependências Node:**

   ```bash
   yarn install
   ```

2. **Instalar dependências Python (TrOCR):**
   ```bash
   pip3 install -r apps/trocr-api/requirements.txt
   ```

### Desenvolvimento

Para rodar **toda a stack** em paralelo (APIs Node + API Python):

```bash
yarn dev
```

Isso inicia:

- `api` (NestJS) em `http://localhost:3000`
- `web` (React) em `http://localhost:5173`
- `trocr-api` (FastAPI) em `http://localhost:8000`

Para usar TrOCR como estratégia de OCR, configure:

```bash
export TROCR_API_URL=http://localhost:8000/ocr
```

### Pré-requisitos no ambiente

O processamento usa ferramentas de linha de comando:

- Leitura de QR: `zbarimg` (ou `QR_READER_CMD`)
- OCR: `tesseract` (ou `OCR_CMD`)
- Extração de desenho (opcional): `DRAWING_EXTRACTOR_CMD`

Se `DRAWING_EXTRACTOR_CMD` não for informado, o serviço salva o desenho como cópia da imagem original.

### Extração automática do desenho (OpenCV)

Há um script pronto em `apps/api/scripts/extract_drawing_cv.py` para localizar o quadrado do desenho mesmo com variação de ângulo/tamanho da foto.

Configuração sugerida:

```bash
export DRAWING_EXTRACTOR_CMD=python3
export DRAWING_EXTRACTOR_ARGS="apps/api/scripts/extract_drawing_cv.py"
```

O serviço chamará automaticamente:

```bash
python3 apps/api/scripts/extract_drawing_cv.py <input_image> <output_image>
```

Dependências do script:

- Python 3
- OpenCV (`cv2`)
- NumPy

### Upload do desenho para Cloudflare R2

Após extrair o desenho, a API envia o arquivo para o Cloudflare R2.

Variáveis obrigatórias:

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET`

Variável opcional:

- `R2_PUBLIC_BASE_URL` (base pública para montar URL final do arquivo)

Dependência necessária:

- `@aws-sdk/client-s3`

O objeto é salvo com chave no formato:

- `<alunoId>/pagina-<NNN>/desenho.<ext>`

### Formatos aceitos no QR

- JSON: `{"alunoId":"ALUNO-001","pagina":1}`
- Texto: `aluno:ALUNO-001;pagina:1`

### Exemplo com cURL

```bash
curl -X POST http://localhost:3000/book-pages/upload   -F "image=@./pagina-01.png"
```
