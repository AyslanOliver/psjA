# Script para exportar dados do MongoDB
# Substitua os valores abaixo com suas informações de conexão
$MONGO_URI="mongodb://seu_usuario:sua_senha@seu_host:porta/seu_banco"
$EXPORT_DIR="./data"

# Criar diretório de exportação se não existir
if (-not (Test-Path -Path $EXPORT_DIR)) {
    New-Item -ItemType Directory -Path $EXPORT_DIR
}

# Lista de coleções para exportar
$collections = @("produtos", "clientes", "pedidos", "entregadores", "configuracoes")

foreach ($collection in $collections) {
    Write-Host "Exportando coleção: $collection"
    
    # Comando mongoexport para exportar a coleção em formato JSON
    mongoexport --uri="$MONGO_URI" --collection=$collection --out="$EXPORT_DIR/$collection.json" --jsonArray
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Exportação de $collection concluída com sucesso!" -ForegroundColor Green
    } else {
        Write-Host "Erro ao exportar $collection" -ForegroundColor Red
    }
}

Write-Host "Processo de exportação concluído. Os arquivos estão disponíveis em: $EXPORT_DIR" -ForegroundColor Cyan