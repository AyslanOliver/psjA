// @ts-ignore
import { LumiClient } from '@lumi.new/sdk'

// Configuração do Lumi SDK
export const lumi = new LumiClient({
  // Configurações básicas - usando valores padrão para desenvolvimento
  projectId: 'p123456789012345678',
  apiBaseUrl: 'https://api.lumi.new',
  authOrigin: 'https://auth.lumi.new'
})

// Exportar tipos úteis
// Exportar tipos úteis
export type LumiClient = any
