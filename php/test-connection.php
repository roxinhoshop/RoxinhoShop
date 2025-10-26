<?php
// ===== ROOXYCE STORE - TESTE DE CONEXÃO =====
// Desenvolvido por Gabriel (gabwvr)
// Script para testar a conexão com o banco de dados

require_once 'database.php';

echo "<!DOCTYPE html>\n";
echo "<html lang='pt-BR'>\n";
echo "<head>\n";
echo "    <meta charset='UTF-8'>\n";
echo "    <meta name='viewport' content='width=device-width, initial-scale=1.0'>\n";
echo "    <title>ROOXYCE Store - Teste de Conexão</title>\n";
echo "    <style>\n";
echo "        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }\n";
echo "        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }\n";
echo "        .success { color: #28a745; background: #d4edda; padding: 10px; border-radius: 5px; margin: 10px 0; }\n";
echo "        .error { color: #dc3545; background: #f8d7da; padding: 10px; border-radius: 5px; margin: 10px 0; }\n";
echo "        .info { color: #17a2b8; background: #d1ecf1; padding: 10px; border-radius: 5px; margin: 10px 0; }\n";
echo "        .config { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 10px 0; }\n";
echo "        h1 { color: #333; text-align: center; }\n";
echo "        h2 { color: #666; border-bottom: 2px solid #eee; padding-bottom: 10px; }\n";
echo "        .btn { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; text-decoration: none; display: inline-block; margin: 5px; }\n";
echo "        .btn:hover { background: #0056b3; }\n";
echo "        .btn-success { background: #28a745; }\n";
echo "        .btn-success:hover { background: #1e7e34; }\n";
echo "    </style>\n";
echo "</head>\n";
echo "<body>\n";
echo "    <div class='container'>\n";
echo "        <h1>🚀 ROOXYCE Store - Teste de Conexão</h1>\n";

// Mostrar configurações
echo "        <h2>📋 Configurações do Banco de Dados</h2>\n";
echo "        <div class='config'>\n";
echo "            <strong>Host:</strong> " . DB_HOST . "<br>\n";
echo "            <strong>Porta:</strong> " . DB_PORT . "<br>\n";
echo "            <strong>Banco:</strong> " . DB_NAME . "<br>\n";
echo "            <strong>Usuário:</strong> " . DB_USER . "<br>\n";
echo "            <strong>Charset:</strong> " . DB_CHARSET . "<br>\n";
echo "        </div>\n";

echo "        <h2>🔌 Teste de Conexão</h2>\n";

try {
    $db = getDatabase();
    
    // Teste 1: Criar banco de dados
    echo "        <div class='info'>📦 Testando criação do banco de dados...</div>\n";
    $db->createDatabase();
    echo "        <div class='success'>✅ Banco de dados criado/verificado com sucesso!</div>\n";
    
    // Teste 2: Conectar ao banco
    echo "        <div class='info'>🔗 Testando conexão com o banco...</div>\n";
    $connection = $db->getConnection();
    echo "        <div class='success'>✅ Conexão estabelecida com sucesso!</div>\n";
    
    // Teste 3: Verificar versão do MySQL
    echo "        <div class='info'>📊 Verificando versão do MySQL...</div>\n";
    $version = $db->fetchOne("SELECT VERSION() as version");
    echo "        <div class='success'>✅ MySQL Versão: " . $version['version'] . "</div>\n";
    
    // Teste 4: Verificar tabelas existentes
    echo "        <div class='info'>📋 Verificando tabelas existentes...</div>\n";
    $tables = $db->fetchAll("SHOW TABLES");
    if (empty($tables)) {
        echo "        <div class='error'>⚠️ Nenhuma tabela encontrada. Execute a instalação!</div>\n";
        echo "        <a href='install.php' class='btn btn-success'>🛠️ Executar Instalação</a>\n";
    } else {
        echo "        <div class='success'>✅ Tabelas encontradas: " . count($tables) . "</div>\n";
        echo "        <ul>\n";
        foreach ($tables as $table) {
            $tableName = array_values($table)[0];
            echo "            <li>📋 " . $tableName . "</li>\n";
        }
        echo "        </ul>\n";
    }
    
    // Teste 5: Verificar dados de exemplo
    if (!empty($tables)) {
        echo "        <div class='info'>👥 Verificando usuários cadastrados...</div>\n";
        $userCount = $db->fetchOne("SELECT COUNT(*) as total FROM usuarios");
        echo "        <div class='success'>✅ Usuários cadastrados: " . $userCount['total'] . "</div>\n";
        
        echo "        <div class='info'>📂 Verificando categorias cadastradas...</div>\n";
        $categoryCount = $db->fetchOne("SELECT COUNT(*) as total FROM categorias");
        echo "        <div class='success'>✅ Categorias cadastradas: " . $categoryCount['total'] . "</div>\n";
        
        echo "        <div class='info'>🛍️ Verificando produtos cadastrados...</div>\n";
        $productCount = $db->fetchOne("SELECT COUNT(*) as total FROM produtos");
        echo "        <div class='success'>✅ Produtos cadastrados: " . $productCount['total'] . "</div>\n";
    }
    
    echo "        <h2>🎉 Teste Concluído com Sucesso!</h2>\n";
    echo "        <div class='success'>✅ Todas as verificações passaram! O sistema está pronto para uso.</div>\n";
    
    echo "        <h2>🔗 Links Úteis</h2>\n";
    echo "        <a href='../home.html' class='btn'>🏠 Ir para o Site</a>\n";
    echo "        <a href='api.php/test' class='btn'>🧪 Testar API</a>\n";
    echo "        <a href='install.php' class='btn'>🛠️ Reinstalar Banco</a>\n";
    
} catch (Exception $e) {
    echo "        <div class='error'>❌ Erro na conexão: " . $e->getMessage() . "</div>\n";
    
    echo "        <h2>🔧 Possíveis Soluções</h2>\n";
    echo "        <div class='info'>\n";
    echo "            <strong>1. Verificar se o MySQL está rodando:</strong><br>\n";
    echo "            <code>sudo service mysql start</code><br><br>\n";
    echo "            <strong>2. Verificar credenciais no arquivo config.php</strong><br><br>\n";
    echo "            <strong>3. Criar o banco manualmente:</strong><br>\n";
    echo "            <code>CREATE DATABASE rooxyce_store;</code><br><br>\n";
    echo "            <strong>4. Verificar permissões do usuário MySQL</strong>\n";
    echo "        </div>\n";
}

echo "        <h2>📝 Informações do Sistema</h2>\n";
echo "        <div class='config'>\n";
echo "            <strong>PHP Versão:</strong> " . phpversion() . "<br>\n";
echo "            <strong>Data/Hora:</strong> " . date('Y-m-d H:i:s') . "<br>\n";
echo "            <strong>Timezone:</strong> " . date_default_timezone_get() . "<br>\n";
echo "            <strong>Extensões PHP:</strong> " . (extension_loaded('pdo_mysql') ? '✅ PDO MySQL' : '❌ PDO MySQL') . "<br>\n";
echo "        </div>\n";

echo "    </div>\n";
echo "</body>\n";
echo "</html>\n";
?>

