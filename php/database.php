<?php
// ===== ROOXYCE STORE - CLASSE DE CONEXÃO COM BANCO DE DADOS =====
// Desenvolvido por Gabriel (gabwvr)
// Classe para gerenciar conexões e operações com o banco de dados

require_once 'config.php';

class Database {
    private $connection;
    private $host;
    private $db_name;
    private $username;
    private $password;
    private $charset;

    public function __construct() {
        $this->host = DB_HOST;
        $this->db_name = DB_NAME;
        $this->username = DB_USER;
        $this->password = DB_PASS;
        $this->charset = DB_CHARSET;
    }

    // Conectar ao banco de dados
    public function connect() {
        $this->connection = null;

        try {
            $dsn = "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=" . $this->charset;
            $this->connection = new PDO($dsn, $this->username, $this->password);
            $this->connection->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->connection->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            
            if (APP_DEBUG) {
                error_log("Conexão com banco de dados estabelecida com sucesso");
            }
        } catch(PDOException $e) {
            if (APP_DEBUG) {
                error_log("Erro na conexão: " . $e->getMessage());
            }
            throw new Exception("Erro na conexão com o banco de dados");
        }

        return $this->connection;
    }

    // Obter conexão
    public function getConnection() {
        if ($this->connection === null) {
            $this->connect();
        }
        return $this->connection;
    }

    // Executar query
    public function query($sql, $params = []) {
        try {
            $stmt = $this->getConnection()->prepare($sql);
            $stmt->execute($params);
            return $stmt;
        } catch(PDOException $e) {
            if (APP_DEBUG) {
                error_log("Erro na query: " . $e->getMessage());
                error_log("SQL: " . $sql);
                error_log("Params: " . json_encode($params));
            }
            throw new Exception("Erro na execução da query");
        }
    }

    // Buscar um registro
    public function fetchOne($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->fetch();
    }

    // Buscar múltiplos registros
    public function fetchAll($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->fetchAll();
    }

    // Inserir registro e retornar ID
    public function insert($sql, $params = []) {
        $this->query($sql, $params);
        return $this->getConnection()->lastInsertId();
    }

    // Atualizar registros
    public function update($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->rowCount();
    }

    // Deletar registros
    public function delete($sql, $params = []) {
        $stmt = $this->query($sql, $params);
        return $stmt->rowCount();
    }

    // Iniciar transação
    public function beginTransaction() {
        return $this->getConnection()->beginTransaction();
    }

    // Confirmar transação
    public function commit() {
        return $this->getConnection()->commit();
    }

    // Reverter transação
    public function rollback() {
        return $this->getConnection()->rollback();
    }

    // Verificar se tabela existe
    public function tableExists($tableName) {
        $sql = "SHOW TABLES LIKE :tableName";
        $result = $this->fetchOne($sql, [':tableName' => $tableName]);
        return !empty($result);
    }

    // Criar banco de dados se não existir
    public function createDatabase() {
        try {
            $dsn = "mysql:host=" . $this->host . ";charset=" . $this->charset;
            $pdo = new PDO($dsn, $this->username, $this->password);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
            $sql = "CREATE DATABASE IF NOT EXISTS `" . $this->db_name . "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";
            $pdo->exec($sql);
            
            if (APP_DEBUG) {
                error_log("Banco de dados '{$this->db_name}' criado/verificado com sucesso");
            }
            
            return true;
        } catch(PDOException $e) {
            if (APP_DEBUG) {
                error_log("Erro ao criar banco de dados: " . $e->getMessage());
            }
            throw new Exception("Erro ao criar banco de dados");
        }
    }

    // Fechar conexão
    public function close() {
        $this->connection = null;
    }

    // Destructor
    public function __destruct() {
        $this->close();
    }
}

// Função helper para obter instância do banco
function getDatabase() {
    static $database = null;
    if ($database === null) {
        $database = new Database();
    }
    return $database;
}
?>

