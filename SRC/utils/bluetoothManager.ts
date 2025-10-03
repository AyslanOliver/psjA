// Gerenciador de Bluetooth que detecta o ambiente e usa o serviço apropriado
import { BluetoothPrinterService } from './bluetoothPrinter'
import { BluetoothPrinterCordovaService } from './bluetoothPrinterCordova'

// Detectar se estamos rodando no Cordova
export function isCordovaEnvironment(): boolean {
  return typeof window !== 'undefined' && 
         (window as any).cordova !== undefined
}

// Detectar se estamos rodando no navegador web
export function isWebEnvironment(): boolean {
  return typeof window !== 'undefined' && 
         'bluetooth' in navigator &&
         !isCordovaEnvironment()
}

// Aguardar o carregamento do plugin Bluetooth no Cordova
export function waitForCordovaBluetoothPlugin(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!isCordovaEnvironment()) {
      resolve(false);
      return;
    }

    // Se o plugin já está disponível
    if ((window as any).bluetoothSerial) {
      resolve(true);
      return;
    }

    let attempts = 0;
    const maxAttempts = 10;
    const checkInterval = 500;

    const checkPlugin = () => {
      attempts++;
      
      if ((window as any).bluetoothSerial) {
        resolve(true);
        return;
      }

      if (attempts >= maxAttempts) {
        console.warn('Plugin Bluetooth não carregou após múltiplas tentativas');
        resolve(false);
        return;
      }

      // Tentar novamente após um delay
      setTimeout(checkPlugin, checkInterval);
    };

    // Aguardar o evento deviceready se Cordova estiver disponível
    if ((window as any).cordova) {
      document.addEventListener('deviceready', () => {
        console.log('DeviceReady disparado, verificando plugin Bluetooth...');
        setTimeout(checkPlugin, 100);
      }, false);
      
      // Fallback caso deviceready já tenha sido disparado
      setTimeout(() => {
        if (attempts === 0) {
          console.log('Iniciando verificação do plugin Bluetooth...');
          checkPlugin();
        }
      }, 100);
    } else {
      // Se não há Cordova, tentar verificar diretamente
      setTimeout(checkPlugin, 100);
    }
  });
}

// Classe gerenciadora que usa o serviço apropriado
export class BluetoothManager {
  private webService: BluetoothPrinterService
  private cordovaService: BluetoothPrinterCordovaService

  constructor() {
    this.webService = new BluetoothPrinterService()
    this.cordovaService = new BluetoothPrinterCordovaService()
  }

  // Obter o serviço apropriado baseado no ambiente
  private getService() {
    if (isCordovaEnvironment()) {
      return this.cordovaService
    } else if (isWebEnvironment()) {
      return this.webService
    } else {
      throw new Error('Ambiente não suportado para Bluetooth')
    }
  }

  // Verificar se Bluetooth está disponível
  isBluetoothAvailable(): boolean {
    if (isCordovaEnvironment()) {
      // No Cordova, verificar se o plugin está carregado
      return typeof window !== 'undefined' && (window as any).bluetoothSerial !== undefined
    } else {
      return this.webService.isBluetoothAvailable()
    }
  }

  // Verificar se Bluetooth está disponível de forma assíncrona (para Cordova)
  async isBluetoothAvailableAsync(): Promise<boolean> {
    if (isCordovaEnvironment()) {
      return await waitForCordovaBluetoothPlugin()
    } else {
      return this.webService.isBluetoothAvailable()
    }
  }

  // Verificar se está conectado
  isConnected(): boolean {
    if (isCordovaEnvironment()) {
      return this.cordovaService.isConnected()
    } else {
      return this.webService.isConnected()
    }
  }

  // Escanear dispositivos Bluetooth
  async scanDevices() {
    if (isCordovaEnvironment()) {
      return await this.cordovaService.scanDevices()
    } else {
      return await this.webService.scanDevices()
    }
  }

  // Conectar ao dispositivo
  async connect(deviceId?: string) {
    if (isCordovaEnvironment()) {
      return await this.cordovaService.connect(deviceId)
    } else {
      return await this.webService.connect(deviceId)
    }
  }

  // Desconectar do dispositivo
  async disconnect() {
    if (isCordovaEnvironment()) {
      return await this.cordovaService.disconnect()
    } else {
      return await this.webService.disconnect()
    }
  }

  // Tentar reconectar
  async tryReconnect() {
    return this.getService().tryReconnect()
  }

  // Imprimir pedido
  async printOrder(orderData: any) {
    return this.getService().printOrder(orderData)
  }

  // Imprimir via da cozinha
  async printKitchenOrder(orderData: any) {
    return this.getService().printKitchenOrder(orderData)
  }

  // Teste de impressão
  async printTest() {
    if (isCordovaEnvironment()) {
      return await this.cordovaService.printTest()
    } else {
      return await this.webService.printTest()
    }
  }

  // Teste da via da cozinha
  async printKitchenTest() {
    if (isCordovaEnvironment()) {
      return await this.cordovaService.printKitchenTest()
    } else {
      return await this.webService.printKitchenTest()
    }
  }

  // Definir dispositivo lembrado (apenas para web)
  setRememberedDevice(deviceId: string) {
    if (isWebEnvironment()) {
      return (this.webService as any).setRememberedDevice(deviceId)
    }
    // Para Cordova, isso é gerenciado automaticamente
  }

  // Obter informações do dispositivo (apenas para web)
  getDeviceInfo() {
    if (isWebEnvironment()) {
      return (this.webService as any).getDeviceInfo()
    }
    // Para Cordova, retornar informações básicas
    return {
      connected: this.isConnected(),
      id: null,
      name: null
    }
  }

  // Obter informações do ambiente
  getEnvironmentInfo() {
    return {
      isCordova: isCordovaEnvironment(),
      isWeb: isWebEnvironment(),
      bluetoothAvailable: this.isBluetoothAvailable(),
      connected: this.isConnected()
    }
  }
}

// Instância global
export const bluetoothManager = new BluetoothManager()

// Exportar também os serviços individuais para compatibilidade
export { BluetoothPrinterService } from './bluetoothPrinter'
export { BluetoothPrinterCordovaService } from './bluetoothPrinterCordova'