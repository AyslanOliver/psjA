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
  const [showImportModal, setShowImportModal] = useState(false)
  
  // Estados para gerenciamento da impressora Bluetooth
  const [bluetoothDevices, setBluetoothDevices] = useState<BluetoothDevice[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectedDevice, setConnectedDevice] = useState<BluetoothDevice | null>(null)
  const [bluetoothSupported, setBluetoothSupported] = useState(false)
  const [bluetoothLoading, setBluetoothLoading] = useState(true)
  
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
    { id: 'impressora', label: 'Impressora', icon: Printer },
    { id: 'sistema', label: 'Sistema', icon: Settings },
    { id: 'dados', label: 'Dados', icon: Database }
  ]

  const diasSemana = [
    { value: 'segunda', label: 'Seg' },
    { value: 'terca', label: 'Ter' },
    { value: 'quarta', label: 'Qua' },
    { value: 'quinta', label: 'Qui' },
    { value: 'sexta', label: 'Sex' },
    { value: 'sabado', label: 'Sáb' },
    { value: 'domingo', label: 'Dom' }
  ]

  const handleSave = async () => {
    try {
      await api.updateConfiguracoes(configuracoes)
      setShowSaveMessage(true)
      setTimeout(() => setShowSaveMessage(false), 3000)
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      alert('Falha ao salvar configurações.')
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
    const initBluetooth = async () => {
      setBluetoothLoading(true)
      try {
        // Usar a verificação assíncrona para Cordova
        const isSupported = await bluetoothManager.isBluetoothAvailableAsync()
        setBluetoothSupported(isSupported)
        
        if (!isSupported) {
          console.log('Bluetooth não suportado ou plugin não carregado')
        }
      } catch (error) {
        console.error('Erro ao verificar Bluetooth:', error)
        setBluetoothSupported(false)
      } finally {
        setBluetoothLoading(false)
      }
    }

    initBluetooth()

    // Verificar se já existe uma conexão ativa
    const deviceInfo = bluetoothManager.getDeviceInfo()
    if (deviceInfo && deviceInfo.connected) {
      setConnectedDevice(deviceInfo)
    }
  }, [])

  // Função para buscar dispositivos Bluetooth
  const scanBluetoothDevices = async () => {
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
      alert('Erro ao buscar dispositivos Bluetooth')
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
        {/* Loja Tab */}
        {activeTab === 'loja' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações da Loja</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome da Loja</label>
                  <input
                    type="text"
                    value={configuracoes.loja.nome}
                    onChange={(e) => updateConfig('loja', 'nome', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                    <input
                      type="tel"
                      value={configuracoes.loja.telefone}
                      onChange={(e) => updateConfig('loja', 'telefone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={configuracoes.loja.email}
                      onChange={(e) => updateConfig('loja', 'email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rua</label>
                    <input
                      type="text"
                      value={configuracoes.loja.endereco.rua}
                      onChange={(e) => updateNestedConfig('loja', 'endereco', 'rua', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Número</label>
                    <input
                      type="text"
                      value={configuracoes.loja.endereco.numero}
                      onChange={(e) => updateNestedConfig('loja', 'endereco', 'numero', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bairro</label>
                    <input
                      type="text"
                      value={configuracoes.loja.endereco.bairro}
                      onChange={(e) => updateNestedConfig('loja', 'endereco', 'bairro', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cidade</label>
                    <input
                      type="text"
                      value={configuracoes.loja.endereco.cidade}
                      onChange={(e) => updateNestedConfig('loja', 'endereco', 'cidade', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">CEP</label>
                    <input
                      type="text"
                      value={configuracoes.loja.endereco.cep}
                      onChange={(e) => updateNestedConfig('loja', 'endereco', 'cep', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Horário de Funcionamento</label>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Abertura</label>
                      <input
                        type="time"
                        value={configuracoes.loja.horarioFuncionamento.abertura}
                        onChange={(e) => updateNestedConfig('loja', 'horarioFuncionamento', 'abertura', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Fechamento</label>
                      <input
                        type="time"
                        value={configuracoes.loja.horarioFuncionamento.fechamento}
                        onChange={(e) => updateNestedConfig('loja', 'horarioFuncionamento', 'fechamento', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-500 mb-2">Dias de Funcionamento</label>
                    <div className="grid grid-cols-4 gap-2">
                      {diasSemana.map((dia) => (
                        <label key={dia.value} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={configuracoes.loja.horarioFuncionamento.diasSemana.includes(dia.value)}
                            onChange={() => toggleDiaSemana(dia.value)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{dia.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delivery Tab */}
        {activeTab === 'delivery' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Configurações de Entrega</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Taxa de Entrega (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={configuracoes.delivery.taxaEntregaBase}
                      onChange={(e) => updateConfig('delivery', 'taxaEntregaBase', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tempo Estimado (min)</label>
                    <input
                      type="number"
                      value={configuracoes.delivery.tempoEstimadoMinutos}
                      onChange={(e) => updateConfig('delivery', 'tempoEstimadoMinutos', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Raio de Entrega (km)</label>
                    <input
                      type="number"
                      value={configuracoes.delivery.raioEntregaKm}
                      onChange={(e) => updateConfig('delivery', 'raioEntregaKm', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Valor Mínimo (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={configuracoes.delivery.valorMinimoEntrega}
                      onChange={(e) => updateConfig('delivery', 'valorMinimoEntrega', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pagamento Tab */}
        {activeTab === 'pagamento' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Formas de Pagamento</h2>
              
              <div className="space-y-4">
                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={configuracoes.pagamento.aceitaDinheiro}
                      onChange={(e) => updateConfig('pagamento', 'aceitaDinheiro', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700">Aceitar Dinheiro</span>
                  </label>

                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={configuracoes.pagamento.aceitaCartao}
                      onChange={(e) => updateConfig('pagamento', 'aceitaCartao', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700">Aceitar Cartão</span>
                  </label>

                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={configuracoes.pagamento.aceitaPix}
                      onChange={(e) => updateConfig('pagamento', 'aceitaPix', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700">Aceitar PIX</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Valor Máximo para Troco (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={configuracoes.pagamento.trocoMaximo}
                    onChange={(e) => updateConfig('pagamento', 'trocoMaximo', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notificações Tab */}
        {activeTab === 'notificacoes' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Preferências de Notificação</h2>
              
              <div className="space-y-4">
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={configuracoes.notificacoes.emailNovoPedido}
                    onChange={(e) => updateConfig('notificacoes', 'emailNovoPedido', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1"
                  />
                  <div>
                    <span className="text-gray-700 font-medium">Email para Novos Pedidos</span>
                    <p className="text-sm text-gray-500">Receber email quando um novo pedido for criado</p>
                  </div>
                </label>

                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={configuracoes.notificacoes.smsStatusPedido}
                    onChange={(e) => updateConfig('notificacoes', 'smsStatusPedido', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1"
                  />
                  <div>
                    <span className="text-gray-700 font-medium">SMS para Status do Pedido</span>
                    <p className="text-sm text-gray-500">Enviar SMS quando o status do pedido mudar</p>
                  </div>
                </label>

                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={configuracoes.notificacoes.whatsappConfirmacao}
                    onChange={(e) => updateConfig('notificacoes', 'whatsappConfirmacao', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mt-1"
                  />
                  <div>
                    <span className="text-gray-700 font-medium">WhatsApp para Confirmações</span>
                    <p className="text-sm text-gray-500">Enviar confirmações via WhatsApp</p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

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

        {/* Sistema Tab */}
        {activeTab === 'sistema' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Configurações do Sistema</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tema</label>
                    <select
                      value={configuracoes.sistema.tema}
                      onChange={(e) => updateConfig('sistema', 'tema', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="claro">Claro</option>
                      <option value="escuro">Escuro</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Idioma</label>
                    <select
                      value={configuracoes.sistema.idioma}
                      onChange={(e) => updateConfig('sistema', 'idioma', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="pt-BR">Português (Brasil)</option>
                      <option value="en-US">English (US)</option>
                      <option value="es-ES">Español</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={configuracoes.sistema.backupAutomatico}
                      onChange={(e) => updateConfig('sistema', 'backupAutomatico', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-gray-700 font-medium">Backup Automático</span>
                      <p className="text-sm text-gray-500">Realizar backup automático dos dados diariamente</p>
                    </div>
                  </label>
                </div>
              </div>
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
      </div>

      {/* Botão Salvar Fixo */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <button
          onClick={handleSave}
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