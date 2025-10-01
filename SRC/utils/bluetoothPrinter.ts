// Utilitário para impressora POS58 via Bluetooth
export interface BluetoothDevice {
  id: string
  name: string
  address: string
  connected: boolean
}

export interface PrinterCommands {
  INIT: number[]
  FEED_LINE: number[]
  CUT_PAPER: number[]
  ALIGN_LEFT: number[]
  ALIGN_CENTER: number[]
  ALIGN_RIGHT: number[]
  BOLD_ON: number[]
  BOLD_OFF: number[]
  UNDERLINE_ON: number[]
  UNDERLINE_OFF: number[]
  FONT_SIZE_NORMAL: number[]
  FONT_SIZE_DOUBLE: number[]
}

// Comandos ESC/POS para impressora POS58
export const ESC_POS_COMMANDS: PrinterCommands = {
  INIT: [0x1B, 0x40], // ESC @
  FEED_LINE: [0x0A], // LF
  CUT_PAPER: [0x1D, 0x56, 0x00], // GS V 0
  ALIGN_LEFT: [0x1B, 0x61, 0x00], // ESC a 0
  ALIGN_CENTER: [0x1B, 0x61, 0x01], // ESC a 1
  ALIGN_RIGHT: [0x1B, 0x61, 0x02], // ESC a 2
  BOLD_ON: [0x1B, 0x45, 0x01], // ESC E 1
  BOLD_OFF: [0x1B, 0x45, 0x00], // ESC E 0
  UNDERLINE_ON: [0x1B, 0x2D, 0x01], // ESC - 1
  UNDERLINE_OFF: [0x1B, 0x2D, 0x00], // ESC - 0
  FONT_SIZE_NORMAL: [0x1D, 0x21, 0x00], // GS ! 0
  FONT_SIZE_DOUBLE: [0x1D, 0x21, 0x11], // GS ! 17
}

export class BluetoothPrinterService {
  private device: BluetoothDevice | null = null
  private characteristic: any | null = null
  private readonly SERVICE_UUID = '000018f0-0000-1000-8000-00805f9b34fb'
  private readonly CHARACTERISTIC_UUID = '00002af1-0000-1000-8000-00805f9b34fb'
  private rememberedDeviceId: string | null = null

  // Verificar se Bluetooth está disponível
  isBluetoothAvailable(): boolean {
    return 'bluetooth' in navigator
  }

  // Buscar dispositivos Bluetooth disponíveis
  async scanDevices(): Promise<BluetoothDevice[]> {
    try {
      if (!this.isBluetoothAvailable()) {
        throw new Error('Bluetooth não está disponível neste dispositivo')
      }

      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { namePrefix: 'POS' },
          { namePrefix: 'Printer' },
          { namePrefix: 'BT' },
          { services: [this.SERVICE_UUID] }
        ],
        optionalServices: [this.SERVICE_UUID]
      })

      return [{
        id: device.id,
        name: device.name || 'Impressora Desconhecida',
        address: device.id,
        connected: false
      }]
    } catch (error) {
      console.error('Erro ao buscar dispositivos:', error)
      throw error
    }
  }

  // Definir dispositivo lembrado (por id) para reconexão
  setRememberedDevice(deviceId: string | null) {
    this.rememberedDeviceId = deviceId
  }

  // Tentar reconexão automática usando dispositivos já autorizados pelo navegador
  async tryReconnect(): Promise<boolean> {
    try {
      if (!this.isBluetoothAvailable()) return false
      // getDevices retorna dispositivos já autorizados pelo usuário
      // Nem todos os navegadores suportam; envolver em try/catch
      // @ts-ignore
      const devices = await (navigator.bluetooth.getDevices?.() || [])
      const candidate = (devices as any[]).find(d => !this.rememberedDeviceId || d.id === this.rememberedDeviceId)
      if (!candidate) return false

      const server = await candidate.gatt?.connect()
      if (!server) return false
      const service = await server.getPrimaryService(this.SERVICE_UUID)
      this.characteristic = await service.getCharacteristic(this.CHARACTERISTIC_UUID)

      this.device = {
        id: candidate.id,
        name: candidate.name || 'Impressora POS58',
        address: candidate.id,
        connected: true
      }
      return true
    } catch (err) {
      console.warn('Falha ao reconectar automaticamente:', err)
      return false
    }
  }

  // Conectar à impressora
  async connect(): Promise<boolean> {
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [this.SERVICE_UUID] }]
      })

      const server = await device.gatt?.connect()
      if (!server) throw new Error('Falha ao conectar ao servidor GATT')

      const service = await server.getPrimaryService(this.SERVICE_UUID)
      this.characteristic = await service.getCharacteristic(this.CHARACTERISTIC_UUID)

      this.device = {
        id: device.id,
        name: device.name || 'Impressora POS58',
        address: device.id,
        connected: true
      }

      console.log('Conectado à impressora:', this.device.name)
      return true
    } catch (error) {
      console.error('Erro ao conectar:', error)
      return false
    }
  }

  // Desconectar da impressora
  async disconnect(): Promise<void> {
    if (this.device) {
      this.device.connected = false
      this.device = null
      this.characteristic = null
      console.log('Desconectado da impressora')
    }
  }

  // Enviar dados para impressora
  private async sendData(data: number[]): Promise<void> {
    if (!this.characteristic) {
      throw new Error('Impressora não conectada')
    }

    const buffer = new Uint8Array(data)
    await this.characteristic.writeValue(buffer)
  }

  // Imprimir texto
  async printText(text: string): Promise<void> {
    const encoder = new TextEncoder()
    const data = Array.from(encoder.encode(text))
    await this.sendData(data)
  }

  // Imprimir linha
  async printLine(text: string = ''): Promise<void> {
    await this.printText(text)
    await this.sendData(ESC_POS_COMMANDS.FEED_LINE)
  }

  // Centralizar texto
  async printCentered(text: string): Promise<void> {
    await this.sendData(ESC_POS_COMMANDS.ALIGN_CENTER)
    await this.printLine(text)
    await this.sendData(ESC_POS_COMMANDS.ALIGN_LEFT)
  }

  // Imprimir texto em negrito
  async printBold(text: string): Promise<void> {
    await this.sendData(ESC_POS_COMMANDS.BOLD_ON)
    await this.printText(text)
    await this.sendData(ESC_POS_COMMANDS.BOLD_OFF)
  }

  // Imprimir separador
  async printSeparator(): Promise<void> {
    await this.printLine('--------------------------------')
  }

  // Cortar papel
  async cutPaper(): Promise<void> {
    await this.sendData(ESC_POS_COMMANDS.CUT_PAPER)
  }

  // Imprimir cupom de pedido
  async printOrder(order: any): Promise<void> {
    try {
      // Inicializar impressora
      await this.sendData(ESC_POS_COMMANDS.INIT)
      
      // Cabeçalho
      await this.sendData(ESC_POS_COMMANDS.FONT_SIZE_DOUBLE)
      await this.printCentered('DELIVERYPRO')
      await this.sendData(ESC_POS_COMMANDS.FONT_SIZE_NORMAL)
      
      await this.printCentered('Pedido de Delivery')
      await this.printSeparator()
      
      // Informações do pedido
      await this.printLine(`Pedido: #${order.id}`)
      await this.printLine(`Data: ${new Date(order.data).toLocaleString('pt-BR')}`)
      await this.printLine(`Cliente: ${order.cliente}`)
      await this.printLine(`Telefone: ${order.telefone}`)
      await this.printLine(`Endereço: ${order.endereco}`)
      await this.printSeparator()
      
      // Itens do pedido
      await this.printBold('ITENS:')
      await this.printLine()
      
      for (const item of order.itens) {
        await this.printLine(`${item.quantidade}x ${item.nome}`)
        await this.printLine(`   R$ ${item.preco.toFixed(2)} cada`)
        await this.printLine(`   Subtotal: R$ ${(item.quantidade * item.preco).toFixed(2)}`)
        await this.printLine()
      }
      
      await this.printSeparator()
      
      // Totais
      await this.printLine(`Subtotal: R$ ${order.subtotal.toFixed(2)}`)
      await this.printLine(`Taxa Entrega: R$ ${order.taxaEntrega.toFixed(2)}`)
      await this.printBold(`TOTAL: R$ ${order.total.toFixed(2)}`)
      
      await this.printSeparator()
      
      // Informações de pagamento
      await this.printLine(`Pagamento: ${order.formaPagamento}`)
      if (order.troco) {
        await this.printLine(`Troco para: R$ ${order.troco.toFixed(2)}`)
      }
      
      await this.printSeparator()
      
      // Rodapé
      await this.printCentered('Obrigado pela preferência!')
      await this.printCentered('www.deliverypro.com')
      
      await this.printLine()
      await this.printLine()
      await this.printLine()
      
      // Cortar papel
      await this.cutPaper()
      
    } catch (error) {
      console.error('Erro ao imprimir pedido:', error)
      throw error
    }
  }

  // Imprimir via da cozinha (formato específico para cozinha)
  async printKitchenOrder(order: any): Promise<void> {
    try {
      // Inicializar impressora
      await this.sendData(ESC_POS_COMMANDS.INIT)
      
      // Cabeçalho da via cozinha
      await this.sendData(ESC_POS_COMMANDS.FONT_SIZE_DOUBLE)
      await this.printCentered('VIA COZINHA')
      await this.sendData(ESC_POS_COMMANDS.FONT_SIZE_NORMAL)
      
      await this.printSeparator()
      
      // Informações básicas do pedido
      await this.printBold(`Pedido: #${order.id}`)
      await this.printLine(`Data: ${new Date(order.data).toLocaleString('pt-BR')}`)
      await this.printLine(`Cliente: ${order.cliente}`)
      await this.printLine(`Telefone: ${order.telefone}`)
      if (order.endereco) {
        await this.printLine(`Endereço: ${order.endereco}`)
      }
      await this.printLine(`Pagamento: ${order.formaPagamento}`)
      
      await this.printSeparator()
      
      // Itens do pedido com detalhes para cozinha (mais legível)
      await this.sendData(ESC_POS_COMMANDS.UNDERLINE_ON)
      await this.sendData(ESC_POS_COMMANDS.FONT_SIZE_DOUBLE)
      await this.printCentered('ITENS PARA PREPARO')
      await this.sendData(ESC_POS_COMMANDS.FONT_SIZE_NORMAL)
      await this.sendData(ESC_POS_COMMANDS.UNDERLINE_OFF)
      await this.printLine()
      
      for (let i = 0; i < order.itens.length; i++) {
        const item = order.itens[i]
        // Destacar o nome do item em tamanho duplo e negrito
        await this.sendData(ESC_POS_COMMANDS.FONT_SIZE_DOUBLE)
        await this.printBold(`${i + 1}. ${String(item.nome || '').toUpperCase()}`)
        await this.sendData(ESC_POS_COMMANDS.FONT_SIZE_NORMAL)
        await this.printLine(`Qtd: ${item.quantidade}x`)
        
        // Sabores (para pizzas)
        if (item.sabores && item.sabores.length > 0) {
          await this.printLine(`Sabores: ${item.sabores.join(', ')}`)
        }
        
        // Tamanho
        if (item.tamanho) {
          await this.printLine(`Tamanho: ${item.tamanho}`)
        }
        
        // Observações do item
        if (item.observacoes) {
          await this.printLine(`Obs: ${item.observacoes}`)
        }
        
        await this.printLine() // Linha em branco entre itens
      }
      
      await this.printSeparator()
      
      // Observações gerais do pedido
      if (order.observacoesPedido) {
        await this.printBold('OBSERVACOES GERAIS:')
        await this.printLine(order.observacoesPedido)
        await this.printSeparator()
      }
      
      // Tempo estimado
      await this.printCentered('Tempo Estimado: 30 min')
      
      await this.printLine()
      await this.printLine()
      await this.printLine()
      
      // Cortar papel
      await this.cutPaper()
      
    } catch (error) {
      console.error('Erro ao imprimir via cozinha:', error)
      throw error
    }
  }

  // Teste de impressão
  async printTest(): Promise<void> {
    try {
      await this.sendData(ESC_POS_COMMANDS.INIT)
      await this.printCentered('=== TESTE DE IMPRESSÃO ===')
      await this.printLine()
      await this.printLine('Impressora POS58 conectada!')
      await this.printLine(`Data: ${new Date().toLocaleString('pt-BR')}`)
      await this.printSeparator()
      await this.printBold('Texto em negrito')
      await this.printLine('Texto normal')
      await this.printSeparator()
      await this.printCentered('Teste concluído com sucesso!')
      await this.printLine()
      await this.printLine()
      await this.cutPaper()
    } catch (error) {
      console.error('Erro no teste de impressão:', error)
      throw error
    }
  }

  // Verificar status da conexão
  isConnected(): boolean {
    return this.device?.connected || false
  }

  // Obter informações do dispositivo conectado
  getDeviceInfo(): BluetoothDevice | null {
    return this.device
  }
}

// Instância singleton do serviço
export const bluetoothPrinter = new BluetoothPrinterService()
