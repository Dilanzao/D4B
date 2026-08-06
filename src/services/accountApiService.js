import { ACCOUNT_API_URL, accountApiConfigurationMessage, isAccountApiConfigured } from '../config/accountApi.js';

export class AccountApiError extends Error {
  constructor(code, message, details = null) {
    super(message || 'Não foi possível concluir a operação.');
    this.name = 'AccountApiError';
    this.code = code || 'API_ERROR';
    this.details = details;
  }
}

async function request(action, payload = {}, { signal } = {}) {
  if (!isAccountApiConfigured()) {
    throw new AccountApiError('ACCOUNT_API_NOT_CONFIGURED', accountApiConfigurationMessage());
  }
  let response;
  try {
    response = await fetch(ACCOUNT_API_URL, {
      method: 'POST',
      body: JSON.stringify({ action, ...payload }),
      redirect: 'follow',
      signal
    });
  } catch (error) {
    if (error?.name === 'AbortError') throw error;
    throw new AccountApiError('NETWORK_ERROR', 'Não foi possível acessar o serviço de contas.', error);
  }

  let body;
  try {
    body = await response.json();
  } catch {
    throw new AccountApiError('INVALID_API_RESPONSE', 'O serviço de contas retornou uma resposta inválida.');
  }

  if (!body?.ok) {
    throw new AccountApiError(body?.error?.code || 'API_ERROR', body?.error?.message || 'Não foi possível concluir a operação.', body);
  }
  return body.data ?? {};
}

export const accountApi = {
  listarServidores: () => request('listarServidores'),
  criarConta: input => request('criarConta', input),
  verificarEmail: token => request('verificarEmail', { token }),
  reenviarVerificacao: email => request('reenviarVerificacao', { email }),
  login: input => request('login', input),
  validarSessao: sessionToken => request('validarSessao', { sessionToken }),
  logout: sessionToken => request('logout', { sessionToken }),
  logoutTodasSessoes: sessionToken => request('logoutTodasSessoes', { sessionToken }),
  solicitarRecuperacaoSenha: email => request('solicitarRecuperacaoSenha', { email }),
  redefinirSenha: input => request('redefinirSenha', input),
  alterarSenha: input => request('alterarSenha', input),
  obterConfiguracoesConta: sessionToken => request('obterConfiguracoesConta', { sessionToken }),
  atualizarConfiguracoesConta: input => request('atualizarConfiguracoesConta', input),
  consultarPrecosEmLote: input => request('consultarPrecosEmLote', input),
  registrarPrecosEmLote: input => request('registrarPrecosEmLote', input),
  consultarHistoricoPreco: input => request('consultarHistoricoPreco', input)
};
