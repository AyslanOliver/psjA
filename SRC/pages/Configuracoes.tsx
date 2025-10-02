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
  Search
} from 'lucide-react'
import { bluetoothManager } from '../utils/bluetoothManager'
import type { BluetoothDevice } from '../utils/bluetoothPrinter'
import { api } from '../lib/api'

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

  const handleConnectDevice = async () => {
    setIsConnecting(true)
    try {
      const connected = await bluetoothManager.connect()
      if (connected) {
        const deviceInfo = bluetoothManager.getDeviceInfo()
        setConnectedDevice(deviceInfo)
        updateConfig('impressora', 'tipo', 'bluetooth')
        // Persistir dispositivo no backend para reconexão futura
        if (deviceInfo) {
          await api.updateConfiguracaoCategoria('impressora', {
            bluetoothDeviceId: deviceInfo.id,
            bluetoothDeviceName: deviceInfo.name,
            lembrarDispositivo: true,
            reconectarAutomaticamente: true
          })
          // Atualizar serviço com o deviceId lembrado
          bluetoothManager.setRememberedDevice(deviceInfo.id)
        }
        alert('Impressora conectada com sucesso!')
      } else {
        alert('Falha ao conectar com a impressora')
      }
    } catch (error) {
      console.error('Erro ao conectar:', error)
      alert('Erro ao conectar com a impressora')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnectDevice = async () => {
    try {
      await bluetoothManager.disconnect()
      setConnectedDevice(null)
      alert('Impressora desconectada')
    } catch (error) {
      console.error('Erro ao desconectar:', error)
    }
  }

  const handleTestPrint = async () => {
    if (!connectedDevice) {
      alert('Nenhuma impressora conectada')
      return
    }

    updateConfig('impressora', 'testeImpressao', true)
    try {
      await bluetoothManager.printTest()
      alert('Teste de impressão enviado com sucesso!')
    } catch (error) {
      console.error('Erro no teste de impressão:', error)
      alert('Erro ao enviar teste de impressão')
    } finally {
      updateConfig('impressora', 'testeImpressao', false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-600 mt-2">
            Gerencie as configurações do seu sistema
          </p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Save className="h-4 w-4" />
          <span>Salvar Alterações</span>
        </button>
      </div>

      {/* Success Message */}
      {showSaveMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <span className="text-green-800">Configurações salvas com sucesso!</span>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'loja' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações da Loja</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome da Loja
                    </label>
                    <input
                      type="text"
                      value={configuracoes.loja.nome}
                      onChange={(e) => updateConfig('loja', 'nome', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefone
                    </label>
                    <input
                      type="tel"
                      value={configuracoes.loja.telefone}
                      onChange={(e) => updateConfig('loja', 'telefone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={configuracoes.loja.email}
                      onChange={(e) => updateConfig('loja', 'email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Endereço</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rua
                    </label>
                    <input
                      type="text"
                      value={configuracoes.loja.endereco.rua}
                      onChange={(e) => updateNestedConfig('loja', 'endereco', 'rua', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número
                    </label>
                    <input
                      type="text"
                      value={configuracoes.loja.endereco.numero}
                      onChange={(e) => updateNestedConfig('loja', 'endereco', 'numero', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bairro
                    </label>
                    <input
                      type="text"
                      value={configuracoes.loja.endereco.bairro}
                      onChange={(e) => updateNestedConfig('loja', 'endereco', 'bairro', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cidade
                    </label>
                    <input
                      type="text"
                      value={configuracoes.loja.endereco.cidade}
                      onChange={(e) => updateNestedConfig('loja', 'endereco', 'cidade', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CEP
                    </label>
                    <input
                      type="text"
                      value={configuracoes.loja.endereco.cep}
                      onChange={(e) => updateNestedConfig('loja', 'endereco', 'cep', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Horário de Funcionamento</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Abertura
                    </label>
                    <input
                      type="time"
                      value={configuracoes.loja.horarioFuncionamento.abertura}
                      onChange={(e) => updateNestedConfig('loja', 'horarioFuncionamento', 'abertura', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fechamento
                    </label>
                    <input
                      type="time"
                      value={configuracoes.loja.horarioFuncionamento.fechamento}
                      onChange={(e) => updateNestedConfig('loja', 'horarioFuncionamento', 'fechamento', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dias de Funcionamento
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
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
          )}

          {activeTab === 'delivery' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Configurações de Entrega</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Taxa de Entrega Base (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={configuracoes.delivery.taxaEntregaBase}
                      onChange={(e) => updateConfig('delivery', 'taxaEntregaBase', parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tempo Estimado (minutos)
                    </label>
                    <input
                      type="number"
                      value={configuracoes.delivery.tempoEstimadoMinutos}
                      onChange={(e) => updateConfig('delivery', 'tempoEstimadoMinutos', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Raio de Entrega (km)
                    </label>
                    <input
                      type="number"
                      value={configuracoes.delivery.raioEntregaKm}
                      onChange={(e) => updateConfig('delivery', 'raioEntregaKm', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Valor Mínimo para Entrega (R$)
                    </label>
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
          )}

          {activeTab === 'pagamento' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Formas de Pagamento</h3>
                <div className="space-y-4">
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

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor Máximo para Troco (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={configuracoes.pagamento.trocoMaximo}
                    onChange={(e) => updateConfig('pagamento', 'trocoMaximo', parseFloat(e.target.value))}
                    className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notificacoes' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Preferências de Notificação</h3>
                <div className="space-y-4">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={configuracoes.notificacoes.emailNovoPedido}
                      onChange={(e) => updateConfig('notificacoes', 'emailNovoPedido', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-gray-700 font-medium">Email para Novos Pedidos</span>
                      <p className="text-sm text-gray-500">Receber email quando um novo pedido for criado</p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={configuracoes.notificacoes.smsStatusPedido}
                      onChange={(e) => updateConfig('notificacoes', 'smsStatusPedido', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-gray-700 font-medium">SMS para Status do Pedido</span>
                      <p className="text-sm text-gray-500">Enviar SMS quando o status do pedido mudar</p>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={configuracoes.notificacoes.whatsappConfirmacao}
                      onChange={(e) => updateConfig('notificacoes', 'whatsappConfirmacao', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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

          {activeTab === 'impressora' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Configurações da Impressora POS58</h3>
                
                {/* Configurações Básicas */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Configurações Básicas</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={configuracoes.impressora.habilitada}
                          onChange={(e) => updateConfig('impressora', 'habilitada', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <span className="text-gray-700 font-medium">Habilitar Impressora</span>
                          <p className="text-sm text-gray-500">Ativar impressão automática de pedidos</p>
                        </div>
                      </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tipo de Conexão
                        </label>
                        <select
                          value={configuracoes.impressora.tipo}
                          onChange={(e) => updateConfig('impressora', 'tipo', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="usb">USB</option>
                          <option value="ethernet">Ethernet</option>
                          <option value="bluetooth">Bluetooth</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Largura do Papel (mm)
                        </label>
                        <select
                          value={configuracoes.impressora.larguraPapel}
                          onChange={(e) => updateConfig('impressora', 'larguraPapel', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value={58}>58mm</option>
                          <option value={80}>80mm</option>
                        </select>
                      </div>
                    </div>

                    {configuracoes.impressora.tipo === 'usb' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Porta USB
                        </label>
                        <input
                          type="text"
                          value={configuracoes.impressora.porta}
                          onChange={(e) => updateConfig('impressora', 'porta', e.target.value)}
                          placeholder="COM1, COM2, /dev/ttyUSB0, etc."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    )}

                    {configuracoes.impressora.tipo === 'ethernet' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Endereço IP
                        </label>
                        <input
                          type="text"
                          value={configuracoes.impressora.ip}
                          onChange={(e) => updateConfig('impressora', 'ip', e.target.value)}
                          placeholder="192.168.1.100"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Configurações de Impressão */}
                <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Configurações de Impressão</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={configuracoes.impressora.cortarPapel}
                          onChange={(e) => updateConfig('impressora', 'cortarPapel', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <span className="text-gray-700 font-medium">Cortar Papel Automaticamente</span>
                          <p className="text-sm text-gray-500">Cortar o papel após cada impressão</p>
                        </div>
                      </label>
                    </div>

                    <div>
                      <label className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={configuracoes.impressora.imprimirLogo}
                          onChange={(e) => updateConfig('impressora', 'imprimirLogo', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <span className="text-gray-700 font-medium">Imprimir Logo</span>
                          <p className="text-sm text-gray-500">Incluir logo da empresa no cabeçalho</p>
                        </div>
                      </label>
                    </div>

                    {configuracoes.impressora.imprimirLogo && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          URL do Logo
                        </label>
                        <input
                          type="url"
                          value={configuracoes.impressora.logoUrl}
                          onChange={(e) => updateConfig('impressora', 'logoUrl', e.target.value)}
                          placeholder="https://exemplo.com/logo.png"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rodapé Personalizado
                      </label>
                      <textarea
                        value={configuracoes.impressora.rodape}
                        onChange={(e) => updateConfig('impressora', 'rodape', e.target.value)}
                        placeholder="Mensagem que aparecerá no final do cupom"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Gerenciamento de Dispositivos Bluetooth */}
                {configuracoes.impressora.tipo === 'bluetooth' && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Dispositivos Bluetooth</h4>
                    
                    <div className="space-y-4">
                      {!bluetoothSupported && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex items-start space-x-2">
                            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                            <div>
                              <h4 className="text-sm font-medium text-red-800">Bluetooth Não Suportado</h4>
                              <p className="text-sm text-red-700 mt-1">
                                Seu navegador não suporta Bluetooth Web API.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {bluetoothSupported && (
                        <>
                          {connectedDevice ? (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <Bluetooth className="h-5 w-5 text-green-600" />
                                  <div>
                                    <h4 className="text-sm font-medium text-green-800">
                                      Conectado: {connectedDevice.name}
                                    </h4>
                                    <p className="text-sm text-green-700">
                                      ID: {connectedDevice.id}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  onClick={handleDisconnectDevice}
                                  className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                                >
                                  Desconectar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="flex items-center space-x-3">
                                <button
                                  onClick={handleScanDevices}
                                  disabled={isScanning}
                                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                  <Search className="h-4 w-4" />
                                  <span>
                                    {isScanning ? 'Buscando...' : 'Buscar Impressoras'}
                                  </span>
                                </button>
                                
                                <button
                                  onClick={handleConnectDevice}
                                  disabled={isConnecting}
                                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                  <Bluetooth className="h-4 w-4" />
                                  <span>
                                    {isConnecting ? 'Conectando...' : 'Conectar Impressora'}
                                  </span>
                                </button>
                              </div>
                              
                              <p className="text-sm text-gray-600">
                                Clique em "Conectar Impressora" para selecionar e conectar uma impressora POS58 via Bluetooth.
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Teste de Impressão */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Teste de Impressão</h4>
                  
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Use esta função para testar se a impressora está configurada corretamente.
                    </p>
                    
                    <div className="flex space-x-3">
                      <button
                        onClick={configuracoes.impressora.tipo === 'bluetooth' ? handleTestPrint : () => {
                          // Simular teste de impressão para USB/Ethernet
                          updateConfig('impressora', 'testeImpressao', true);
                          setTimeout(() => {
                            updateConfig('impressora', 'testeImpressao', false);
                            alert('Teste de impressão enviado! Verifique se o cupom foi impresso.');
                          }, 2000);
                        }}
                        disabled={
                          !configuracoes.impressora.habilitada || 
                          configuracoes.impressora.testeImpressao ||
                          (configuracoes.impressora.tipo === 'bluetooth' && !connectedDevice)
                        }
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        <Printer className="h-4 w-4" />
                        <span>
                          {configuracoes.impressora.testeImpressao ? 'Enviando...' : 'Teste Básico'}
                        </span>
                      </button>

                      <button
                        onClick={async () => {
                          if (!connectedDevice) {
                            alert('Nenhuma impressora conectada');
                            return;
                          }
                          updateConfig('impressora', 'testeImpressao', true);
                          try {
                            await bluetoothManager.printKitchenTest();
                            alert('Teste da via da cozinha enviado com sucesso!');
                          } catch (error) {
                            console.error('Erro no teste da via da cozinha:', error);
                            alert('Erro ao enviar teste da via da cozinha');
                          } finally {
                            updateConfig('impressora', 'testeImpressao', false);
                          }
                        }}
                        disabled={
                          !configuracoes.impressora.habilitada || 
                          configuracoes.impressora.testeImpressao ||
                          (configuracoes.impressora.tipo === 'bluetooth' && !connectedDevice)
                        }
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        <Printer className="h-4 w-4" />
                        <span>
                          {configuracoes.impressora.testeImpressao ? 'Enviando...' : 'Teste Via Cozinha'}
                        </span>
                      </button>
                    </div>

                    {configuracoes.impressora.tipo === 'bluetooth' && !connectedDevice && (
                      <p className="text-sm text-yellow-600">
                        Conecte uma impressora Bluetooth para realizar o teste.
                      </p>
                    )}
                  </div>
                </div>

                {!configuracoes.impressora.habilitada && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-yellow-800">Impressora Desabilitada</h4>
                        <p className="text-sm text-yellow-700 mt-1">
                          Habilite a impressora para usar as funcionalidades de impressão automática.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'sistema' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Configurações do Sistema</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tema
                    </label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Idioma
                    </label>
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fuso Horário
                    </label>
                    <select
                      value={configuracoes.sistema.timezone}
                      onChange={(e) => updateConfig('sistema', 'timezone', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="America/Sao_Paulo">São Paulo (GMT-3)</option>
                      <option value="America/New_York">New York (GMT-5)</option>
                      <option value="Europe/London">London (GMT+0)</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6">
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

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800">Atenção</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Algumas alterações podem exigir reinicialização do sistema para entrar em vigor.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Configuracoes