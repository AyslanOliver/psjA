import React from 'react'
import { X, Phone, MapPin, Calendar, Package, DollarSign } from 'lucide-react'
import { Cliente } from '../../hooks/useClientes'

interface ClienteViewModalProps {
  isOpen: boolean
  onClose: () => void
  cliente: Cliente | null
}

export function ClienteViewModal({ isOpen, onClose, cliente }: ClienteViewModalProps) {
  if (!isOpen || !cliente) return null

  const enderecosPrincipal = cliente.enderecos?.find(e => e.principal) || cliente.enderecos?.[0]
  const ticketMedio = cliente.totalPedidos > 0 ? cliente.valorTotalGasto / cliente.totalPedidos : 0

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Detalhes do Cliente</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Header do Cliente */}
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-bold text-2xl">
                {cliente.nome?.charAt(0)?.toUpperCase() || '?'}
              </span>
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-gray-900">{cliente.nome}</h3>
              <div className="flex items-center mt-2">
                <span className={`inline-flex items-center px-3 py-1 text-sm font-semibold rounded-full ${
                  cliente.ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {cliente.ativo ? '✓ Ativo' : '✗ Inativo'}
                </span>
              </div>
            </div>
          </div>

          {/* Informações de Contato */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Informações de Contato</h4>
            <div className="space-y-2">
              <div className="flex items-center text-gray-600">
                <Phone className="w-4 h-4 mr-3" />
                <span>{cliente.telefone || 'Telefone não informado'}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <Calendar className="w-4 h-4 mr-3" />
                <span>
                  Cliente desde {cliente.createdAt ? new Date(cliente.createdAt).toLocaleDateString('pt-BR') : 'Data não informada'}
                </span>
              </div>
            </div>
          </div>

          {/* Endereços */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Endereços</h4>
            {cliente.enderecos && cliente.enderecos.length > 0 ? (
              <div className="space-y-3">
                {cliente.enderecos.map((endereco, index) => (
                  <div key={index} className="bg-white rounded-lg p-3 border">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{endereco.nome}</span>
                      {endereco.principal && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          Principal
                        </span>
                      )}
                    </div>
                    <div className="flex items-start text-gray-600">
                      <MapPin className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <p>{endereco.rua}, {endereco.numero}</p>
                        {endereco.complemento && <p>{endereco.complemento}</p>}
                        <p>{endereco.bairro}</p>
                        {endereco.referencia && (
                          <p className="text-sm text-gray-500 mt-1">
                            Referência: {endereco.referencia}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">Nenhum endereço cadastrado</p>
            )}
          </div>

          {/* Estatísticas */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Estatísticas</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg p-3 text-center">
                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full mx-auto mb-2">
                  <Package className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{cliente.totalPedidos || 0}</p>
                <p className="text-sm text-gray-500">Pedidos</p>
              </div>
              <div className="bg-white rounded-lg p-3 text-center">
                <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full mx-auto mb-2">
                  <DollarSign className="w-4 h-4 text-green-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">R$ {(cliente.valorTotalGasto || 0).toFixed(0)}</p>
                <p className="text-sm text-gray-500">Total Gasto</p>
              </div>
              <div className="bg-white rounded-lg p-3 text-center col-span-2 md:col-span-1">
                <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full mx-auto mb-2">
                  <DollarSign className="w-4 h-4 text-purple-600" />
                </div>
                <p className="text-2xl font-bold text-gray-900">R$ {ticketMedio.toFixed(2)}</p>
                <p className="text-sm text-gray-500">Ticket Médio</p>
              </div>
            </div>
          </div>

          {/* Último Pedido */}
          {cliente.ultimoPedido && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Último Pedido</h4>
              <p className="text-gray-600">
                {new Date(cliente.ultimoPedido).toLocaleDateString('pt-BR')}
              </p>
            </div>
          )}

          {/* Observações */}
          {cliente.observacoes && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Observações</h4>
              <p className="text-gray-600">{cliente.observacoes}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}