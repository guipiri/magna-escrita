import { ApiError, ErrorKeys } from '@repo/shared';
import axios, { AxiosError } from 'axios';

export const errorMessages: Record<ErrorKeys, string> = {
  BAD_REQUEST_MISSING_GOOGLE_AUTH_TOKEN:
    'Token de autenticação do Google ausente.',
  UNAUTHORIZED_INVALID_GOOGLE_CREDENTIALS: 'Credenciais do Google inválidas.',
  UNAUTHORIZED_INVALID_TOKEN: 'Token de autenticação inválido.',
  UNAUTHORIZED_USER_NOT_FOUND: 'Usuário não encontrado.',
  UNAUTHORIZED_BACKOFFICE_ACCESS:
    'Acesso negado. Usuário não autorizado para acessar o backoffice.',
  UNAUTHORIZED_INVALID_WEBHOOK_SIGNATURE: 'Assinatura do webhook inválida.',
  UNAUTHORIZED_CREATE_SCHOOL:
    'Acesso negado. Usuário não autorizado para criar escola.',
  UNAUTHORIZED_USER_IS_NOT_ADMIN: 'Apenas administradores podem criar eventos.',

  FORBIDDEN_MISSING_AUTH_TOKEN: 'Token de autenticação ausente.',
  FORBIDDEN_INSUFFICIENT_PERMISSIONS: 'Permissões insuficientes.',
  FORBIDDEN_BOOK_READY:
    'Este livro está finalizado (status Pronto). Usuários com perfil da escola não podem fazer modificações em livros finalizados.',
  NOT_FOUND_BOOK_NOT_FOUND: 'Livro não encontrado.',
  HTTP_ERROR: 'Ocorreu um erro na requisição.',
  INTERNAL_ERROR: 'Ocorreu um erro interno no servidor.',

  NOT_FOUND_ORDER: 'Pedido não encontrado.',
  NOT_FOUND_SCHOOL: 'Escola não encontrada.',
  NOT_FOUND_UNIT: 'Unidade não encontrada.',
  NOT_FOUND_EVENT: 'Evento não encontrado.',
  NOT_FOUND_BOOK_TEMPLATE: 'Template de livro não encontrado.',
  NOT_FOUND_GRADE: 'Turma não encontrada.',

  BAD_REQUEST_GRADE_NAME: 'Nome da turma é obrigatório.',
  BAD_REQUEST_STUDENTS: 'Adicione pelo menos um aluno.',
  BAD_REQUEST_MULTIPLE_UNITS_ACCESS:
    'Usuário tem acesso a múltiplas unidades. Selecione uma unidade para continuar.',
  BAD_REQUEST_NO_VALID_UNIT_ID: 'Nenhuma unidade válida encontrada.',
  CONFLICT_EVENT_ALREADY_ACTIVE:
    'Já existe um evento planejado ou em andamento para esta unidade.',

  BAD_REQUEST_TIMELINE_ORDER:
    'A ordem dos eventos da timeline deve ser respeitada: o evento n não pode acontecer após o evento n+1.',

  BAD_REQUEST_TIMELINE_PAST:
    'Nenhuma data modificada da timeline pode estar no passado.',


  UNAUTHORIZED_USER_NO_ACCESS_TO_UNIT:
    'Usuário não tem acesso à unidade selecionada.',

  BAD_REQUEST_GRADE_NAME_ALREADY_EXISTS:
    'Já existe uma turma com esse nome nesta unidade.',
  BAD_REQUEST_SCHOOL_USER_WITHOUT_UNITS:
    'Um usuário com perfil de escola precisa estar associado a pelo menos uma unidade.',
  BAD_REQUEST_INVALID_ROLE_FOR_USER_CREATION:
    'Perfil inválido para criação de usuário.',
  CONFLICT_EMAIL_ALREADY_EXISTS:
    'Já existe um usuário cadastrado com este e-mail.',
  NOT_FOUND_USER:
    'Usuário não encontrado.',
  BAD_REQUEST_CANNOT_DELETE_SELF:
    'Você não pode excluir sua própria conta de usuário.',

  CONFLICT_EXISTING_BOOKS: 'Já existem livros associados ao registro.',
  CONFLICT_EVENT_WITH_EXISTING_BOOKS:
    'Não é possível alterar a unidade ou o ano letivo de um evento que possui livros vinculados.',
  CONFLICT_REMOVE_UNIT_WITH_BOOKS:
    'Não é possível remover a unidade porque existem livros criados utilizando este template nas turmas dessa unidade.',
  CONFLICT_CHANGE_PAGES_WITH_BOOKS:
    'Não é possível alterar as páginas do template porque existem livros criados utilizando ele.',

  CREATE_PIX_ORDER_FAILED: 'Falha ao criar pedido PIX.',
  CREATE_CARD_ORDER_FAILED: 'Falha ao criar pedido com cartão de crédito.',

  NOT_FOUND_PDF_CLASS: 'Turma não encontrada.',
  NOT_FOUND_PDF_NO_ELIGIBLE_PAGES:
    'O template desta turma não possui páginas elegíveis para o PDF (DRAW, DRAW_TEXT ou TEXT).',
  NOT_FOUND_PDF_NO_STUDENTS: 'Esta turma não possui alunos matriculados.',
  NOT_FOUND_PDF_NO_ACTIVE_EVENT:
    'Não há evento ativo para a unidade desta turma no ano letivo vigente.',

  CONFLICT_MORE_THAN_ONE_ACTIVE_EVENT: 'Mais de um evento ativo encontrado.',
  BAD_REQUEST_QR_CODE_NOT_READABLE: 'O QR Code da imagem não pode ser lido.',
  BAD_REQUEST_DRAW_SQUARE_NOT_FOUND:
    'O espaço para desenho não foi encontrado.',
  BAD_REQUEST_BOOK_TEMPLATE_MISMATCH: 'Template de livro incorreto.',
  NOT_FOUND_STUDENT: 'Matrícula não encontrada.',
  NOT_FOUND_BOOK_TEMPLATE_PAGE: 'Página do template não encontrada.',
  NOT_FOUND_ACTIVE_EVENT_FOR_STUDENT: 'Nenhum evento ativo para a matrícula.',
  INTERNAL_CLOUDFLARE_UPLOAD_FAILED: 'Erro ao fazer upload.',
  INTERNAL_GEMINI_RECOGNITION_FAILED: 'Erro no reconhecimento de imagem.',
  INTERNAL_GOOGLE_CLOUD_VISION_RECOGNITION_FAILED: 'Erro no Google Vision.',
  INTERNAL_QR_CODE_RECOGNITION_FAILED: 'Erro na leitura do QR Code.',

  UNKNOWN_ERROR: 'Ocorreu um erro desconhecido. Tente novamente mais tarde.',
};

export const getApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError(error)) {
    const data = (error as AxiosError<ApiError>).response?.data;
    if (data) return data;
  }

  return {
    statusCode: 0,
    key: ErrorKeys.UNKNOWN_ERROR,
    message: 'Erro inesperado',
    timestamp: new Date().toISOString(),
    path: 'UNKNOWN_PATH',
  };
};

export const getErrorMessageByKey = (key: ErrorKeys): string => {
  return errorMessages[key];
};

export const getErrorMessage = (error: unknown): string => {
  const apiError = getApiError(error);
  return getErrorMessageByKey(apiError.key);
};
