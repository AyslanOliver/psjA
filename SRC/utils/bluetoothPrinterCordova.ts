// Utilitário para impressora POS58 via Bluetooth no Cordova
declare global {
  interface Window {
    bluetoothSerial: any;
  }
}

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

export class BluetoothPrinterCordovaService {
  private device: BluetoothDevice | null = null
  private rememberedDeviceId: string | null = null

  // Verificar se Bluetooth está disponível
  isBluetoothAvailable(): boolean {
    return typeof window !== 'undefined' && window.bluetoothSerial !== undefined
  }

  // Verificar se está conectado
  isConnected(): boolean {
    return this.device?.connected || false
  }

  // Buscar dispositivos Bluetooth disponíveis
  async scanDevices(): Promise<BluetoothDevice[]> {
    return new Promise((resolve, reject) => {
      if (!this.isBluetoothAvailable()) {
        reject(new Error('Bluetooth não está disponível'))
        return
      }

      window.bluetoothSerial.list(
        (devices: any[]) => {
          const bluetoothDevices: BluetoothDevice[] = devices.map(device => ({
            id: device.address,
            name: device.name || 'Dispositivo Desconhecido',
            address: device.address,
            connected: false
          }))
          resolve(bluetoothDevices)
        },
        (error: any) => {
          reject(new Error(`Erro ao buscar dispositivos: ${error}`))
        }
      )
    })
  }

  // Conectar a um dispositivo
  async connect(deviceId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isBluetoothAvailable()) {
        reject(new Error('Bluetooth não está disponível'))
        return
      }

      window.bluetoothSerial.connect(
        deviceId,
        () => {
          this.device = {
            id: deviceId,
            name: 'Impressora',
            address: deviceId,
            connected: true
          }
          this.rememberedDeviceId = deviceId
          localStorage.setItem('rememberedBluetoothDevice', deviceId)
          resolve()
        },
        (error: any) => {
          reject(new Error(`Erro ao conectar: ${error}`))
        }
      )
    })
  }

  // Desconectar
  async disconnect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isBluetoothAvailable()) {
        reject(new Error('Bluetooth não está disponível'))
        return
      }

      window.bluetoothSerial.disconnect(
        () => {
          this.device = null
          resolve()
        },
        (error: any) => {
          reject(new Error(`Erro ao desconectar: ${error}`))
        }
      )
    })
  }

  // Tentar reconectar automaticamente
  async tryReconnect(): Promise<void> {
    const rememberedDeviceId = localStorage.getItem('rememberedBluetoothDevice')
    if (rememberedDeviceId) {
      try {
        await this.connect(rememberedDeviceId)
      } catch (error) {
        console.error('Erro ao reconectar automaticamente:', error)
        throw error
      }
    } else {
      throw new Error('Nenhum dispositivo lembrado para reconectar')
    }
  }

  // Enviar dados para impressora
  private async sendData(data: number[]): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected()) {
        reject(new Error('Impressora não está conectada'))
        return
      }

      const uint8Array = new Uint8Array(data)
      
      window.bluetoothSerial.write(
        uint8Array,
        () => resolve(),
        (error: any) => reject(new Error(`Erro ao enviar dados: ${error}`))
      )
    })
  }

  // Enviar texto
  private async sendText(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected()) {
        reject(new Error('Impressora não está conectada'))
        return
      }

      window.bluetoothSerial.write(
        text,
        () => resolve(),
        (error: any) => reject(new Error(`Erro ao enviar texto: ${error}`))
      )
    })
  }

  // Imprimir pedido completo
  async printOrder(orderData: any): Promise<void> {
    try {
      // Inicializar impressora
      await this.sendData(ESC_POS_COMMANDS.INIT)
      
      // Cabeçalho
      await this.sendData(ESC_POS_COMMANDS.ALIGN_CENTER)
      await this.sendData(ESC_POS_COMMANDS.BOLD_ON)
      await this.sendData(ESC_POS_COMMANDS.FONT_SIZE_DOUBLE)
      await this.sendText('PIZZARIA DELIVERY\n')
      await this.sendData(ESC_POS_COMMANDS.FONT_SIZE_NORMAL)
      await this.sendData(ESC_POS_COMMANDS.BOLD_OFF)
      await this.sendText('--------------------------------\n')
      
      // Informações do pedido
      await this.sendData(ESC_POS_COMMANDS.ALIGN_LEFT)
      await this.sendText(`Pedido: ${orderData.id}\n`)
      await this.sendText(`Data: ${orderData.data}\n`)
      await this.sendText(`Cliente: ${orderData.cliente}\n`)
      await this.sendText(`Telefone: ${orderData.telefone}\n`)
      await this.sendText(`Endereco: ${orderData.endereco}\n`)
      await this.sendText('--------------------------------\n')
      
      // Itens
      await this.sendData(ESC_POS_COMMANDS.BOLD_ON)
      await this.sendText('ITENS:\n')
      await this.sendData(ESC_POS_COMMANDS.BOLD_OFF)
      
      for (const item of orderData.itens) {
        await this.sendText(`${item.quantidade}x ${item.nome}\n`)
        if (item.sabores && item.sabores.length > 0) {
          await this.sendText(`   Sabores: ${item.sabores.join(', ')}\n`)
        }
        if (item.tamanho) {
          await this.sendText(`   Tamanho: ${item.tamanho}\n`)
        }
        if (item.observacoes) {
          await this.sendText(`   Obs: ${item.observacoes}\n`)
        }
        await this.sendText(`   R$ ${item.preco.toFixed(2)}\n`)
        await this.sendText('--------------------------------\n')
      }
      
      // Total
      await this.sendData(ESC_POS_COMMANDS.BOLD_ON)
      await this.sendText(`Subtotal: R$ ${orderData.subtotal.toFixed(2)}\n`)
      await this.sendText(`Taxa Entrega: R$ ${orderData.taxaEntrega.toFixed(2)}\n`)
      await this.sendText(`TOTAL: R$ ${orderData.total.toFixed(2)}\n`)
      await this.sendData(ESC_POS_COMMANDS.BOLD_OFF)
      
      // Pagamento
      await this.sendText('--------------------------------\n')
      await this.sendText(`Pagamento: ${orderData.formaPagamento}\n`)
      if (orderData.troco > 0) {
        await this.sendText(`Troco para: R$ ${orderData.troco.toFixed(2)}\n`)
      }
      
      // Observações
      if (orderData.observacoesPedido) {
        await this.sendText('--------------------------------\n')
        await this.sendText(`Observacoes: ${orderData.observacoesPedido}\n`)
      }
      
      // Rodapé
      await this.sendText('--------------------------------\n')
      await this.sendData(ESC_POS_COMMANDS.ALIGN_CENTER)
      await this.sendText('Obrigado pela preferencia!\n')
      await this.sendText('\n\n')
      
      // Cortar papel
      await this.sendData(ESC_POS_COMMANDS.CUT_PAPER)
      
    } catch (error) {
      console.error('Erro ao imprimir pedido:', error)
      throw error
    }
  }

  // Imprimir via da cozinha
  async printKitchenOrder(orderData: any): Promise<void> {
    try {
      // Inicializar impressora
      await this.sendData(ESC_POS_COMMANDS.INIT)
      
      // Cabeçalho da cozinha
      await this.sendData(ESC_POS_COMMANDS.ALIGN_CENTER)
      await this.sendData(ESC_POS_COMMANDS.BOLD_ON)
      await this.sendData(ESC_POS_COMMANDS.FONT_SIZE_DOUBLE)
      await this.sendText('*** VIA COZINHA ***\n')
      await this.sendData(ESC_POS_COMMANDS.FONT_SIZE_NORMAL)
      await this.sendData(ESC_POS_COMMANDS.BOLD_OFF)
      await this.sendText('================================\n')
      
      // Informações do pedido
      await this.sendData(ESC_POS_COMMANDS.ALIGN_LEFT)
      await this.sendData(ESC_POS_COMMANDS.BOLD_ON)
      await this.sendText(`PEDIDO: ${orderData.numeroPedido || orderData.id}\n`)
      await this.sendData(ESC_POS_COMMANDS.BOLD_OFF)
      await this.sendText(`Data/Hora: ${orderData.dataHora || orderData.data}\n`)
      
      if (orderData.status) {
        await this.sendText(`Status: ${orderData.status}\n`)
      }
      
      if (orderData.prioridade || orderData.urgente) {
        await this.sendData(ESC_POS_COMMANDS.BOLD_ON)
        await this.sendText(`PRIORIDADE: ${orderData.prioridade || 'URGENTE'}\n`)
        await this.sendData(ESC_POS_COMMANDS.BOLD_OFF)
      }
      
      await this.sendText('================================\n')
      
      // Informações do cliente
      await this.sendData(ESC_POS_COMMANDS.BOLD_ON)
      await this.sendText('CLIENTE:\n')
      await this.sendData(ESC_POS_COMMANDS.BOLD_OFF)
      await this.sendText(`Nome: ${orderData.cliente}\n`)
      await this.sendText(`Telefone: ${orderData.telefone}\n`)
      await this.sendText(`Endereco: ${orderData.endereco}\n`)
      await this.sendText(`Pagamento: ${orderData.formaPagamento}\n`)
      
      if (orderData.troco && orderData.troco > 0) {
        await this.sendText(`Troco: R$ ${orderData.troco.toFixed(2)}\n`)
      }
      
      await this.sendText('================================\n')
      
      // Tempos estimados
      if (orderData.tempoPreparo || orderData.tempoEntrega) {
        await this.sendData(ESC_POS_COMMANDS.BOLD_ON)
        await this.sendText('TEMPOS ESTIMADOS:\n')
        await this.sendData(ESC_POS_COMMANDS.BOLD_OFF)
        
        if (orderData.tempoPreparo) {
          await this.sendText(`Preparo: ${orderData.tempoPreparo} min\n`)
        }
        
        if (orderData.tempoEntrega) {
          await this.sendText(`Entrega: ${orderData.tempoEntrega} min\n`)
        }
        
        await this.sendText('================================\n')
      }
      
      // Entregador
      if (orderData.entregador) {
        await this.sendData(ESC_POS_COMMANDS.BOLD_ON)
        await this.sendText('ENTREGADOR:\n')
        await this.sendData(ESC_POS_COMMANDS.BOLD_OFF)
        await this.sendText(`${orderData.entregador}\n`)
        await this.sendText('================================\n')
      }
      
      // Itens para preparo
      await this.sendData(ESC_POS_COMMANDS.BOLD_ON)
      await this.sendData(ESC_POS_COMMANDS.FONT_SIZE_DOUBLE)
      await this.sendText('ITENS PARA PREPARO:\n')
      await this.sendData(ESC_POS_COMMANDS.FONT_SIZE_NORMAL)
      await this.sendData(ESC_POS_COMMANDS.BOLD_OFF)
      await this.sendText('================================\n')
      
      for (const item of orderData.itens) {
        // Quantidade e nome do item
        await this.sendData(ESC_POS_COMMANDS.BOLD_ON)
        await this.sendText(`>>> ${item.quantidade}x ${item.nome} <<<\n`)
        await this.sendData(ESC_POS_COMMANDS.BOLD_OFF)
        
        // Sabores
        if (item.sabores && item.sabores.length > 0) {
          await this.sendText(`Sabores: ${item.sabores.join(', ')}\n`)
        }
        
        // Tamanho
        if (item.tamanho) {
          await this.sendText(`Tamanho: ${item.tamanho}\n`)
        }
        
        // Ingredientes extras
        if (item.ingredientesExtras && item.ingredientesExtras.length > 0) {
          await this.sendData(ESC_POS_COMMANDS.BOLD_ON)
          await this.sendText(`EXTRAS: ${item.ingredientesExtras.join(', ')}\n`)
          await this.sendData(ESC_POS_COMMANDS.BOLD_OFF)
        }
        
        // Ingredientes removidos
        if (item.ingredientesRemovidos && item.ingredientesRemovidos.length > 0) {
          await this.sendData(ESC_POS_COMMANDS.BOLD_ON)
          await this.sendText(`REMOVER: ${item.ingredientesRemovidos.join(', ')}\n`)
          await this.sendData(ESC_POS_COMMANDS.BOLD_OFF)
        }
        
        // Observações do item
        if (item.observacoes) {
          await this.sendData(ESC_POS_COMMANDS.UNDERLINE_ON)
          await this.sendText(`OBS: ${item.observacoes}\n`)
          await this.sendData(ESC_POS_COMMANDS.UNDERLINE_OFF)
        }
        
        await this.sendText('--------------------------------\n')
      }
      
      // Observações gerais
      if (orderData.observacoesPedido) {
        await this.sendData(ESC_POS_COMMANDS.BOLD_ON)
        await this.sendText('OBSERVACOES GERAIS:\n')
        await this.sendData(ESC_POS_COMMANDS.BOLD_OFF)
        await this.sendText(`${orderData.observacoesPedido}\n`)
        await this.sendText('================================\n')
      }
      
      // Resumo final
      await this.sendData(ESC_POS_COMMANDS.ALIGN_CENTER)
      await this.sendData(ESC_POS_COMMANDS.BOLD_ON)
      await this.sendText('RESUMO:\n')
      await this.sendData(ESC_POS_COMMANDS.BOLD_OFF)
      await this.sendText(`Total de itens: ${orderData.itens.length}\n`)
      await this.sendText(`Valor total: R$ ${orderData.valorTotal || orderData.total}\n`)
      await this.sendText('\n')
      await this.sendData(ESC_POS_COMMANDS.BOLD_ON)
      await this.sendText('*** COZINHA ***\n')
      await this.sendData(ESC_POS_COMMANDS.BOLD_OFF)
      await this.sendText('\n\n')
      
      // Cortar papel
      await this.sendData(ESC_POS_COMMANDS.CUT_PAPER)
      
    } catch (error) {
      console.error('Erro ao imprimir via da cozinha:', error)
      throw error
    }
  }

  // Teste de impressão
  async printTest(): Promise<void> {
    try {
      await this.sendData(ESC_POS_COMMANDS.INIT)
      await this.sendData(ESC_POS_COMMANDS.ALIGN_CENTER)
      await this.sendData(ESC_POS_COMMANDS.BOLD_ON)
      await this.sendText('TESTE DE IMPRESSAO\n')
      await this.sendData(ESC_POS_COMMANDS.BOLD_OFF)
      await this.sendText('Impressora funcionando!\n')
      await this.sendText('\n\n')
      await this.sendData(ESC_POS_COMMANDS.CUT_PAPER)
    } catch (error) {
      console.error('Erro no teste de impressão:', error)
      throw error
    }
  }

  // Teste da via da cozinha
  async printKitchenTest(): Promise<void> {
    const testOrder = {
      numeroPedido: '001',
      id: '001',
      dataHora: new Date().toLocaleString('pt-BR'),
      data: new Date().toLocaleDateString('pt-BR'),
      cliente: 'Cliente Teste',
      telefone: '(11) 99999-9999',
      endereco: 'Rua Teste, 123 - Bairro Teste',
      status: 'Em preparo',
      prioridade: 'Normal',
      urgente: false,
      tempoPreparo: 30,
      tempoEntrega: 45,
      entregador: 'João Silva',
      formaPagamento: 'Dinheiro',
      troco: 50.00,
      itens: [
        {
          quantidade: 2,
          nome: 'Pizza Grande',
          sabores: ['Margherita', 'Calabresa'],
          tamanho: 'Grande',
          ingredientesExtras: ['Queijo extra', 'Azeitona'],
          ingredientesRemovidos: ['Cebola'],
          observacoes: 'Massa fina, bem assada',
          preco: 45.00
        },
        {
          quantidade: 1,
          nome: 'Refrigerante',
          tamanho: '2L',
          observacoes: 'Gelado',
          preco: 8.00
        }
      ],
      observacoesPedido: 'Cliente preferencial - entregar com cuidado',
      valorTotal: 53.00,
      total: 53.00
    }

    await this.printKitchenOrder(testOrder)
  }
}

// Instância global
export const bluetoothPrinterCordova = new BluetoothPrinterCordovaService()