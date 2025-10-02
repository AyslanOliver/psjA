import React, { useState, useEffect } from 'react'
import { 
  Settings, 
  Store, 
  DollarSign, 
  Truck, 
  Bell,   
  Save,
  AlertCircle,
  CheckCircle,
  Printer,
  Bluetooth,
  Search,
  Database,
  Download,
  Upload
} from 'lucide-react'
import { bluetoothManager } from '../utils/bluetoothManager'
import type { BluetoothDevice } from '../utils/bluetoothPrinter'
import { api } from '../lib/api'
import ImportDatabaseModal from '../components/ImportDatabaseModal'

interface ConfiguracaoSistema {
  loja: {
    nome: string
    telefone: string
    email: string
    endereco: {
      rua: string
      numero: string
      bairro: string
      cidade: string
      cep: string
    }
    horarioFuncionamento: {
      abertura: string
      fechamento: string
      diasSemana: string[]
    }
  }
  delivery: {
    taxaEntregaBase: number
    tempoEstimadoMinutos: number
    raioEntregaKm: number
    valorMinimoEntrega: number
  }
  pagamento: {
    aceitaDinheiro: boolean
    aceitaCartao: boolean
    aceitaPix: boolean
    trocoMaximo: number
  }
  notificacoes: {
    emailNovoPedido: boolean
    smsStatusPedido: boolean
    whatsappConfirmacao: boolean
  }
  impressora: {
    habilitada: boolean
    tipo: 'usb' | 'ethernet' | 'bluetooth'
    porta: string
    ip: string
    larguraPapel: number
    cortarPapel: boolean
    imprimirLogo: boolean
    logoUrl: string
    rodape: string
    testeImpressao: boolean
  }
  sistema: {
    tema: 'claro' | 'escuro'
    idioma: string
    timezone: string
    backupAutomatico: boolean
  }
}

const Configuracoes: React.FC = () => {
  const [activeTab, setActiveTab] = useState('loja')
  const [showSaveMessage, setShowSaveMessage] = useState(false)
  
  // Estados para gerenciamento da impressora Bluetooth
  const [, setBluetoothDevices] = useState<BluetoothDevice[]>([])
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isScanning, setIsScanning] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectedDevice, setConnectedDevice] = useState<BluetoothDevice | null>(null)
  const [bluetoothSupported, setBluetoothSupported] = useState(false)
  
  const [configuracoes, setConfiguracoes] = useState<ConfiguracaoSistema>({
    loja: {
      nome: 'Pastelaria do João',
      telefone: '(11) 99999-9999',
      email: 'contato@pastelaria.com',
      endereco: {
        rua: 'Rua das Flores',
        numero: '123',
        bairro: 'Centro',
        cidade: 'São Paulo',
        cep: '01234-567'
      },
      horarioFuncionamento: {
        abertura: '08:00',
        fechamento: '22:00',
        diasSemana: ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado']
      }
    },
    delivery: {
      taxaEntregaBase: 5.00,
      tempoEstimadoMinutos: 45,
      raioEntregaKm: 10,
      valorMinimoEntrega: 20.00
    },
    pagamento: {
      aceitaDinheiro: true,
      aceitaCartao: true,
      aceitaPix: true,
      trocoMaximo: 200.00
    },
    notificacoes: {
      emailNovoPedido: true,
      smsStatusPedido: false,
      whatsappConfirmacao: true
    },
    impressora: {
      habilitada: false,
      tipo: 'usb',
      porta: 'COM1',
      ip: '192.168.1.100',
      larguraPapel: 58,
      cortarPapel: true,
      imprimirLogo: false,
      logoUrl: '',
      rodape: 'Obrigado pela preferência!',
      testeImpressao: false
    },
    sistema: {
      tema: 'claro',
      idioma: 'pt-BR',
      timezone: 'America/Sao_Paulo',
      backupAutomatico: true
    }
  })

  const tabs = [
    { id: 'loja', label: 'Loja', icon: Store },
    { id: 'delivery', label: 'Delivery', icon: Truck },
    { id: 'pagamento', label: 'Pagamento', icon: DollarSign },
    { id: 'notificacoes', label: 'Notificações', icon: Bell },
    { id: 'impressora', label: 'Impressora POS58', icon: Printer },
    { id: 'sistema', label: 'Sistema', icon: Settings }
  ]

  const diasSemana = [
    { value: 'segunda', label: 'Segunda-feira' },
    { value: 'terca', label: 'Terça-feira' },
    { value: 'quarta', label: 'Quarta-feira' },
    { value: 'quinta', label: 'Quinta-feira' },
    { value: 'sexta', label: 'Sexta-feira' },
    { value: 'sabado', label: 'Sábado' },
    { value: 'domingo', label: 'Domingo' }
  ]

  const handleSave = async () => {
    try {
      const tipoBackend = configuracoes.impressora.tipo === 'ethernet' ? 'wifi' : configuracoes.impressora.tipo
      // Normalização/validação de Delivery conforme regras do backend
      const taxaEntrega = Math.max(0, Number(configuracoes.delivery.taxaEntregaBase || 0))
      const tempoMedioEntrega = Math.max(10, parseInt(String(configuracoes.delivery.tempoEstimadoMinutos || 0)))
      const raioEntrega = Math.max(1, parseInt(String(configuracoes.delivery.raioEntregaKm || 0)))
      const pedidoMinimo = Math.max(0, Number(configuracoes.delivery.valorMinimoEntrega || 0))

      // Sempre persistir todas as seções (inclui delivery)
      await api.updateConfiguracoes({
        loja: configuracoes.loja,
        delivery: {
          taxaEntrega,
          tempoMedioEntrega,
          raioEntrega,
          pedidoMinimo
        },
        pagamento: {
          aceitaDinheiro: configuracoes.pagamento.aceitaDinheiro,
          aceitaCartao: configuracoes.pagamento.aceitaCartao,
          aceitaPix: configuracoes.pagamento.aceitaPix
        },
        notificacoes: {
          email: configuracoes.notificacoes.emailNovoPedido,
          sms: configuracoes.notificacoes.smsStatusPedido,
          whatsapp: configuracoes.notificacoes.whatsappConfirmacao
        },
        sistema: configuracoes.sistema,
        impressora: {
          ...configuracoes.impressora,
          tipo: tipoBackend
        }
      })

      // Se houver dispositivo conectado, persistir dados específicos da impressora
      if (connectedDevice) {
        await api.updateConfiguracaoCategoria('impressora', {
          tipo: 'bluetooth',
          bluetoothDeviceId: connectedDevice.id,
          bluetoothDeviceName: connectedDevice.name,
          lembrarDispositivo: true,
          reconectarAutomaticamente: true
        })
      }

      setShowSaveMessage(true)
      setTimeout(() => setShowSaveMessage(false), 3000)
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      alert('Falha ao salvar configurações. Verifique a API.')
    }
  }

  const updateConfig = (section: keyof ConfiguracaoSistema, field: string, value: any) => {
    setConfiguracoes(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }

  const updateNestedConfig = (section: keyof ConfiguracaoSistema, nestedField: string, field: string, value: any) => {
    setConfiguracoes(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [nestedField]: {
          ...(prev[section] as any)[nestedField],
          [field]: value
        }
      }
    }))
  }

  const toggleDiaSemana = (dia: string) => {
    const diasAtuais = configuracoes.loja.horarioFuncionamento.diasSemana
    const novosDias = diasAtuais.includes(dia)
      ? diasAtuais.filter(d => d !== dia)
      : [...diasAtuais, dia]
    
    updateNestedConfig('loja', 'horarioFuncionamento', 'diasSemana', novosDias)
  }

  // Funções para gerenciamento da impressora Bluetooth
  useEffect(() => {
    setBluetoothSupported(bluetoothManager.isBluetoothAvailable())
    
    // Carregar configurações do backend ao montar
    ;(async () => {
      try {
        const data = await api.getConfiguracoes()
        // Mapear campos do backend -> frontend
        setConfiguracoes(prev => ({
          ...prev,
          loja: {
            ...prev.loja,
            nome: data.loja?.nome ?? prev.loja.nome,
            telefone: data.loja?.telefone ?? prev.loja.telefone,
            email: data.loja?.email ?? prev.loja.email,
            endereco: {
              rua: data.loja?.endereco?.rua ?? prev.loja.endereco.rua,
              numero: data.loja?.endereco?.numero ?? prev.loja.endereco.numero,
              bairro: data.loja?.endereco?.bairro ?? prev.loja.endereco.bairro,
              cidade: data.loja?.endereco?.cidade ?? prev.loja.endereco.cidade,
              cep: data.loja?.endereco?.cep ?? prev.loja.endereco.cep
            },
            horarioFuncionamento: prev.loja.horarioFuncionamento
          },
          delivery: {
            taxaEntregaBase: data.delivery?.taxaEntrega ?? prev.delivery.taxaEntregaBase,
            tempoEstimadoMinutos: data.delivery?.tempoMedioEntrega ?? prev.delivery.tempoEstimadoMinutos,
            raioEntregaKm: data.delivery?.raioEntrega ?? prev.delivery.raioEntregaKm,
            valorMinimoEntrega: data.delivery?.pedidoMinimo ?? prev.delivery.valorMinimoEntrega
          },
          pagamento: {
            aceitaDinheiro: data.pagamento?.aceitaDinheiro ?? prev.pagamento.aceitaDinheiro,
            aceitaCartao: data.pagamento?.aceitaCartao ?? prev.pagamento.aceitaCartao,
            aceitaPix: data.pagamento?.aceitaPix ?? prev.pagamento.aceitaPix,
            trocoMaximo: prev.pagamento.trocoMaximo
          },
          notificacoes: {
            emailNovoPedido: data.notificacoes?.email ?? prev.notificacoes.emailNovoPedido,
            smsStatusPedido: data.notificacoes?.sms ?? prev.notificacoes.smsStatusPedido,
            whatsappConfirmacao: data.notificacoes?.whatsapp ?? prev.notificacoes.whatsappConfirmacao
          },
          impressora: {
            ...prev.impressora,
            habilitada: data.impressora?.habilitada ?? prev.impressora.habilitada,
            tipo: (data.impressora?.tipo === 'wifi' ? 'ethernet' : data.impressora?.tipo) ?? prev.impressora.tipo,
            porta: data.impressora?.porta ?? prev.impressora.porta,
            ip: data.impressora?.ip ?? prev.impressora.ip,
            larguraPapel: data.impressora?.larguraPapel ?? prev.impressora.larguraPapel,
            cortarPapel: data.impressora?.cortarPapel ?? prev.impressora.cortarPapel,
            imprimirLogo: data.impressora?.imprimirLogo ?? prev.impressora.imprimirLogo,
            logoUrl: data.impressora?.logoUrl ?? prev.impressora.logoUrl,
            rodape: data.impressora?.rodape ?? prev.impressora.rodape
          },
          sistema: {
            ...prev.sistema,
            tema: data.sistema?.tema ?? prev.sistema.tema,
            idioma: data.sistema?.idioma ?? prev.sistema.idioma,
            timezone: data.sistema?.timezone ?? prev.sistema.timezone,
            backupAutomatico: data.sistema?.backupAutomatico ?? prev.sistema.backupAutomatico
          }
        }))

        // Definir dispositivo lembrado para reconexão automática
        if (data.impressora?.bluetoothDeviceId) {
          bluetoothManager.setRememberedDevice(data.impressora.bluetoothDeviceId)
        }
      } catch (err) {
        console.error('Erro ao carregar configurações:', err)
      }
    })()

    // Verificar se já existe uma conexão ativa
    const deviceInfo = bluetoothManager.getDeviceInfo()
    if (deviceInfo && deviceInfo.connected) {
      setConnectedDevice(deviceInfo)
    }
  }, [])

  const handleScanDevices = async () => {
    if (!bluetoothSupported) {
      alert('Bluetooth não está disponível neste dispositivo')
      return
    }

    setIsScanning(true)
    try {
      const devices = await bluetoothManager.scanDevices()
      setBluetoothDevices(devices)
    } catch (error) {
      console.error('Erro ao buscar dispositivos:', error)
      alert('Erro ao buscar dispositivos Bluetooth. Verifique se o Bluetooth está ativado.')
    } finally {
      setIsScanning(false)
    }
  }

  // Função para conectar a um dispositivo
  const connectToDevice = async (deviceId: string) => {
    setIsConnecting(true)
    try {
      await bluetoothManager.connect(deviceId)
      const deviceInfo = bluetoothManager.getDeviceInfo()
      setConnectedDevice(deviceInfo)
      alert('Conectado com sucesso!')
    } catch (error) {
      console.error('Erro ao conectar:', error)
      alert('Erro ao conectar ao dispositivo')
    } finally {
      setIsConnecting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Mobile Otimizado */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-3">
          <h1 className="text-lg font-bold text-gray-900">Configurações</h1>
        </div>
        
        {/* Tabs Mobile - Scroll Horizontal */}
        <div className="overflow-x-auto">
          <div className="flex space-x-1 px-4 pb-2 min-w-max">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-20">
        {/* Impressora Tab - Otimizada para Mobile */}
        {activeTab === 'impressora' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Impressora POS58</h2>
              
              {bluetoothLoading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">Verificando Bluetooth...</p>
                </div>
              ) : !bluetoothSupported ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800">Bluetooth não disponível</h4>
                      <p className="text-sm text-yellow-700 mt-1">
                        Aguarde o carregamento do aplicativo ou verifique se o Bluetooth está habilitado no dispositivo.
                      </p>
                      <button
                        onClick={() => window.location.reload()}
                        className="mt-2 text-sm text-yellow-800 underline"
                      >
                        Recarregar página
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Status da Conexão */}
                  {connectedDevice ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-green-800">
                            Conectado: {connectedDevice.name}
                          </h4>
                          <p className="text-sm text-green-700">
                            ID: {connectedDevice.id}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <p className="text-sm text-gray-600">Nenhuma impressora conectada</p>
                    </div>
                  )}

                  {/* Buscar Dispositivos */}
                  <div className="space-y-3">
                    <button
                      onClick={scanBluetoothDevices}
                      disabled={isScanning}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
                    >
                      <Search className="h-4 w-4" />
                      <span>{isScanning ? 'Buscando...' : 'Buscar Impressoras'}</span>
                    </button>

                    {/* Lista de Dispositivos */}
                    {bluetoothDevices.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-700">Dispositivos encontrados:</h4>
                        {bluetoothDevices.map((device) => (
                          <div
                            key={device.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{device.name}</p>
                              <p className="text-xs text-gray-500">{device.id}</p>
                            </div>
                            <button
                              onClick={() => connectToDevice(device.id)}
                              disabled={isConnecting}
                              className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
                            >
                              {isConnecting ? 'Conectando...' : 'Conectar'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dados Tab - Nova aba para importação */}
        {activeTab === 'dados' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Gerenciamento de Dados</h2>
              
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-md font-medium text-gray-900 mb-2">Importar Dados</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Importe dados do MongoDB para o banco local do aplicativo
                  </p>
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Importar Dados</span>
                  </button>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-md font-medium text-gray-900 mb-2">Exportar Dados</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Exporte dados do banco local para backup
                  </p>
                  <button
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    <span>Exportar Dados</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ... outras tabs existentes ... */}
      </div>

      {/* Botão Salvar Fixo */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <button
          onClick={() => {/* função salvar */}}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Save className="h-4 w-4" />
          <span>Salvar Configurações</span>
        </button>
        
        {showSaveMessage && (
          <div className="mt-2 flex items-center justify-center space-x-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span className="text-sm">Configurações salvas com sucesso!</span>
          </div>
        )}
      </div>

      {/* Modal de Importação */}
      <ImportDatabaseModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
      />
    </div>
  )
}

export default Configuracoes