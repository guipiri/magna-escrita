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
  FORBIDDEN_MISSING_AUTH_TOKEN: 'Token de autenticação ausente.',
  FORBIDDEN_INSUFFICIENT_PERMISSIONS: 'Permissões insuficientes.',
  NOT_FOUND_BOOK_NOT_FOUND: 'Livro não encontrado.',
  HTTP_ERROR: 'Ocorreu um erro na requisição.',
  INTERNAL_ERROR: 'Ocorreu um erro interno no servidor.',

  NOT_FOUND_ORDER: 'Pedido não encontrado.',
  NOT_FOUND_SCHOOL: 'Escola não encontrada.',
  NOT_FOUND_UNIT: 'Unidade não encontrada.',
  NOT_FOUND_GRADE: 'Turma não encontrada.',

  BAD_REQUEST_GRADE_NAME: 'Nome da turma é obrigatório.',
  BAD_REQUEST_STUDENTS: 'Adicione pelo menos um aluno.',

  UNAUTHORIZED_USER_NO_ACCESS_TO_UNIT:
    'Usuário não tem acesso à unidade selecionada.',
  BAD_REQUEST_GRADE_NAME_ALREADY_EXISTS:
    'Já existe uma turma com esse nome nesta unidade.',

  CREATE_PIX_ORDER_FAILED: 'Falha ao criar pedido PIX.',
  CREATE_CARD_ORDER_FAILED: 'Falha ao criar pedido com cartão de crédito.',

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
