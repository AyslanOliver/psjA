import React, { useState } from 'react';
import { importFromJsonFile } from '../lib/importDatabase';

interface ImportDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ImportDatabaseModal: React.FC<ImportDatabaseModalProps> = ({ isOpen, onClose }) => {
  const [selectedCollection, setSelectedCollection] = useState<string>('produtos');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importStatus, setImportStatus] = useState<string>('');
  const [error, setError] = useState<string>('');

  const collections = [
    { value: 'produtos', label: 'Produtos' },
    { value: 'clientes', label: 'Clientes' },
    { value: 'pedidos', label: 'Pedidos' },
    { value: 'entregadores', label: 'Entregadores' },
    { value: 'configuracoes', label: 'Configurações' }
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setError('');
      setImportStatus('');
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setError('Selecione um arquivo para importar');
      return;
    }

    setIsImporting(true);
    setError('');
    setImportStatus('Importando dados...');

    try {
      await importFromJsonFile(selectedFile, selectedCollection);
      setImportStatus(`Importação para ${selectedCollection} concluída com sucesso!`);
      setSelectedFile(null);
      
      // Limpar o input de arquivo
      const fileInput = document.getElementById('fileInput') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err) {
      console.error('Erro na importação:', err);
      setError(`Erro ao importar: ${err instanceof Error ? err.message : String(err)}`);
      setImportStatus('');
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Importar Dados</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Selecione a coleção
          </label>
          <select
            className="w-full p-2 border border-gray-300 rounded"
            value={selectedCollection}
            onChange={(e) => setSelectedCollection(e.target.value)}
            disabled={isImporting}
          >
            {collections.map((collection) => (
              <option key={collection.value} value={collection.value}>
                {collection.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Selecione o arquivo JSON
          </label>
          <input
            id="fileInput"
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="w-full p-2 border border-gray-300 rounded"
            disabled={isImporting}
          />
          <p className="text-xs text-gray-500 mt-1">
            Selecione o arquivo JSON exportado do MongoDB
          </p>
        </div>
        
        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}
        
        {importStatus && (
          <div className="mb-4 p-2 bg-green-100 text-green-700 rounded">
            {importStatus}
          </div>
        )}
        
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            disabled={isImporting}
          >
            Fechar
          </button>
          <button
            onClick={handleImport}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-300"
            disabled={!selectedFile || isImporting}
          >
            {isImporting ? 'Importando...' : 'Importar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportDatabaseModal;