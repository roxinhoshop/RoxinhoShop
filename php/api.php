<?php
// ===== ROOXYCE STORE - API REST =====
// Desenvolvido por Gabriel (gabwvr)
// API para comunicação entre frontend e backend

require_once 'database.php';

class RooxyceAPI {
    private $db;
    private $method;
    private $endpoint;
    private $params;

    public function __construct() {
        $this->db = getDatabase();
        $this->method = $_SERVER['REQUEST_METHOD'];
        $this->parseRequest();
    }

    // Analisar requisição
    private function parseRequest() {
        $request = $_SERVER['REQUEST_URI'];
        $path = parse_url($request, PHP_URL_PATH);
        $path = str_replace('/php/api.php', '', $path);
        $path = trim($path, '/');
        
        $parts = explode('/', $path);
        $this->endpoint = $parts[0] ?? '';
        $this->params = array_slice($parts, 1);
    }

    // Processar requisição
    public function processRequest() {
        try {
            switch ($this->endpoint) {
                case 'usuarios':
                    return $this->handleUsers();
                case 'produtos':
                    return $this->handleProducts();
                case 'categorias':
                    return $this->handleCategories();
                case 'pedidos':
                    return $this->handleOrders();
                case 'auth':
                    return $this->handleAuth();
                case 'test':
                    return $this->handleTest();
                default:
                    return $this->response(['error' => 'Endpoint não encontrado'], 404);
            }
        } catch (Exception $e) {
            return $this->response(['error' => $e->getMessage()], 500);
        }
    }

    // Gerenciar usuários
    private function handleUsers() {
        switch ($this->method) {
            case 'GET':
                if (isset($this->params[0])) {
                    return $this->getUserById($this->params[0]);
                }
                return $this->getAllUsers();
                
            case 'POST':
                return $this->createUser();
                
            case 'PUT':
                if (isset($this->params[0])) {
                    return $this->updateUser($this->params[0]);
                }
                return $this->response(['error' => 'ID do usuário requerido'], 400);
                
            case 'DELETE':
                if (isset($this->params[0])) {
                    return $this->deleteUser($this->params[0]);
                }
                return $this->response(['error' => 'ID do usuário requerido'], 400);
                
            default:
                return $this->response(['error' => 'Método não permitido'], 405);
        }
    }

    // Gerenciar produtos
    private function handleProducts() {
        switch ($this->method) {
            case 'GET':
                if (isset($this->params[0])) {
                    return $this->getProductById($this->params[0]);
                }
                return $this->getAllProducts();
                
            case 'POST':
                return $this->createProduct();
                
            default:
                return $this->response(['error' => 'Método não permitido'], 405);
        }
    }

    // Gerenciar categorias
    private function handleCategories() {
        switch ($this->method) {
            case 'GET':
                return $this->getAllCategories();
                
            default:
                return $this->response(['error' => 'Método não permitido'], 405);
        }
    }

    // Gerenciar pedidos
    private function handleOrders() {
        switch ($this->method) {
            case 'GET':
                if (isset($this->params[0])) {
                    return $this->getOrderById($this->params[0]);
                }
                return $this->getAllOrders();
                
            case 'POST':
                return $this->createOrder();
                
            default:
                return $this->response(['error' => 'Método não permitido'], 405);
        }
    }

    // Gerenciar autenticação
    private function handleAuth() {
        switch ($this->method) {
            case 'POST':
                if (isset($this->params[0])) {
                    switch ($this->params[0]) {
                        case 'login':
                            return $this->login();
                        case 'register':
                            return $this->register();
                        case 'logout':
                            return $this->logout();
                        default:
                            return $this->response(['error' => 'Ação de autenticação não encontrada'], 404);
                    }
                }
                return $this->response(['error' => 'Ação requerida'], 400);
                
            default:
                return $this->response(['error' => 'Método não permitido'], 405);
        }
    }

    // Teste de conexão
    private function handleTest() {
        try {
            $this->db->getConnection();
            return $this->response([
                'status' => 'success',
                'message' => 'Conexão com banco de dados estabelecida',
                'timestamp' => date('Y-m-d H:i:s'),
                'database' => DB_NAME
            ]);
        } catch (Exception $e) {
            return $this->response([
                'status' => 'error',
                'message' => 'Falha na conexão com banco de dados',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Métodos de usuários
    private function getAllUsers() {
        $users = $this->db->fetchAll("SELECT id, nome, sobrenome, email, xp_total, nivel_atual, titulo_nivel, data_criacao FROM usuarios WHERE ativo = 1");
        return $this->response(['users' => $users]);
    }

    private function getUserById($id) {
        $user = $this->db->fetchOne("SELECT id, nome, sobrenome, email, xp_total, nivel_atual, titulo_nivel, data_criacao FROM usuarios WHERE id = :id AND ativo = 1", [':id' => $id]);
        if ($user) {
            return $this->response(['user' => $user]);
        }
        return $this->response(['error' => 'Usuário não encontrado'], 404);
    }

    private function createUser() {
        $data = $this->getRequestData();
        
        if (!isset($data['nome']) || !isset($data['email']) || !isset($data['senha'])) {
            return $this->response(['error' => 'Dados obrigatórios: nome, email, senha'], 400);
        }

        // Verificar se email já existe
        $existing = $this->db->fetchOne("SELECT id FROM usuarios WHERE email = :email", [':email' => $data['email']]);
        if ($existing) {
            return $this->response(['error' => 'Email já cadastrado'], 409);
        }

        $userId = $this->db->insert(
            "INSERT INTO usuarios (nome, sobrenome, email, senha_hash) VALUES (:nome, :sobrenome, :email, :senha_hash)",
            [
                ':nome' => $data['nome'],
                ':sobrenome' => $data['sobrenome'] ?? '',
                ':email' => $data['email'],
                ':senha_hash' => password_hash($data['senha'], PASSWORD_DEFAULT)
            ]
        );

        return $this->response(['message' => 'Usuário criado com sucesso', 'user_id' => $userId], 201);
    }

    // Métodos de produtos
    private function getAllProducts() {
        $products = $this->db->fetchAll("
            SELECT p.*, c.nome as categoria_nome 
            FROM produtos p 
            LEFT JOIN categorias c ON p.categoria_id = c.id 
            WHERE p.ativo = 1 
            ORDER BY p.data_criacao DESC
        ");
        return $this->response(['products' => $products]);
    }

    private function getProductById($id) {
        $product = $this->db->fetchOne("
            SELECT p.*, c.nome as categoria_nome 
            FROM produtos p 
            LEFT JOIN categorias c ON p.categoria_id = c.id 
            WHERE p.id = :id AND p.ativo = 1
        ", [':id' => $id]);
        
        if ($product) {
            return $this->response(['product' => $product]);
        }
        return $this->response(['error' => 'Produto não encontrado'], 404);
    }

    // Métodos de categorias
    private function getAllCategories() {
        $categories = $this->db->fetchAll("SELECT * FROM categorias WHERE ativo = 1 ORDER BY ordem, nome");
        return $this->response(['categories' => $categories]);
    }

    // Métodos de autenticação
    private function login() {
        $data = $this->getRequestData();
        
        if (!isset($data['email']) || !isset($data['senha'])) {
            return $this->response(['error' => 'Email e senha são obrigatórios'], 400);
        }

        $user = $this->db->fetchOne("SELECT * FROM usuarios WHERE email = :email AND ativo = 1", [':email' => $data['email']]);
        
        if ($user && password_verify($data['senha'], $user['senha_hash'])) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_email'] = $user['email'];
            $_SESSION['user_nome'] = $user['nome'];
            
            return $this->response([
                'message' => 'Login realizado com sucesso',
                'user' => [
                    'id' => $user['id'],
                    'nome' => $user['nome'],
                    'sobrenome' => $user['sobrenome'],
                    'email' => $user['email'],
                    'xp_total' => $user['xp_total'],
                    'nivel_atual' => $user['nivel_atual'],
                    'titulo_nivel' => $user['titulo_nivel']
                ]
            ]);
        }
        
        return $this->response(['error' => 'Email ou senha inválidos'], 401);
    }

    private function register() {
        return $this->createUser();
    }

    private function logout() {
        session_destroy();
        return $this->response(['message' => 'Logout realizado com sucesso']);
    }

    // Métodos auxiliares
    private function getRequestData() {
        $input = file_get_contents('php://input');
        return json_decode($input, true) ?? [];
    }

    private function response($data, $status = 200) {
        http_response_code($status);
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit;
    }
}

// Executar API
$api = new RooxyceAPI();
$api->processRequest();
?>

