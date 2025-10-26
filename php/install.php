<?php
// ===== ROOXYCE STORE - SCRIPT DE INSTALAÇÃO DO BANCO DE DADOS =====
// Desenvolvido por Gabriel (gabwvr)
// Script para criar tabelas e inserir dados iniciais

require_once 'database.php';

class DatabaseInstaller {
    private $db;

    public function __construct() {
        $this->db = getDatabase();
    }

    // Executar instalação completa
    public function install() {
        try {
            echo "🚀 Iniciando instalação do banco de dados ROOXYCE Store...\n";
            
            // Criar banco de dados
            $this->db->createDatabase();
            echo "✅ Banco de dados criado/verificado\n";
            
            // Criar tabelas
            $this->createTables();
            echo "✅ Tabelas criadas\n";
            
            // Inserir dados iniciais
            $this->insertInitialData();
            echo "✅ Dados iniciais inseridos\n";
            
            echo "🎉 Instalação concluída com sucesso!\n";
            return true;
            
        } catch (Exception $e) {
            echo "❌ Erro na instalação: " . $e->getMessage() . "\n";
            return false;
        }
    }

    // Criar todas as tabelas
    private function createTables() {
        $tables = [
            'usuarios' => $this->getUsersTableSQL(),
            'enderecos' => $this->getAddressesTableSQL(),
            'categorias' => $this->getCategoriesTableSQL(),
            'produtos' => $this->getProductsTableSQL(),
            'pedidos' => $this->getOrdersTableSQL(),
            'itens_pedido' => $this->getOrderItemsTableSQL(),
            'historico_xp' => $this->getXPHistoryTableSQL(),
            'lista_desejos' => $this->getWishlistTableSQL(),
            'carrinho' => $this->getCartTableSQL()
        ];

        foreach ($tables as $tableName => $sql) {
            if (!$this->db->tableExists($tableName)) {
                $this->db->query($sql);
                echo "📋 Tabela '$tableName' criada\n";
            } else {
                echo "📋 Tabela '$tableName' já existe\n";
            }
        }
    }

    // SQL para tabela de usuários
    private function getUsersTableSQL() {
        return "
            CREATE TABLE usuarios (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nome VARCHAR(100) NOT NULL,
                sobrenome VARCHAR(100) NOT NULL,
                email VARCHAR(150) UNIQUE NOT NULL,
                senha_hash VARCHAR(255) NOT NULL,
                telefone VARCHAR(20),
                data_nascimento DATE,
                cpf VARCHAR(14),
                email_verificado BOOLEAN DEFAULT FALSE,
                ativo BOOLEAN DEFAULT TRUE,
                data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                xp_total INT DEFAULT 0,
                nivel_atual INT DEFAULT 1,
                titulo_nivel VARCHAR(50) DEFAULT 'Novato'
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ";
    }

    // SQL para tabela de endereços
    private function getAddressesTableSQL() {
        return "
            CREATE TABLE enderecos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                usuario_id INT NOT NULL,
                nome VARCHAR(100) NOT NULL,
                cep VARCHAR(10) NOT NULL,
                rua VARCHAR(200) NOT NULL,
                numero VARCHAR(20) NOT NULL,
                complemento VARCHAR(100),
                bairro VARCHAR(100) NOT NULL,
                cidade VARCHAR(100) NOT NULL,
                estado VARCHAR(2) NOT NULL,
                principal BOOLEAN DEFAULT FALSE,
                data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ";
    }

    // SQL para tabela de categorias
    private function getCategoriesTableSQL() {
        return "
            CREATE TABLE categorias (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nome VARCHAR(100) NOT NULL,
                slug VARCHAR(100) UNIQUE NOT NULL,
                descricao TEXT,
                icone VARCHAR(50),
                categoria_pai_id INT,
                ativo BOOLEAN DEFAULT TRUE,
                ordem INT DEFAULT 0,
                data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (categoria_pai_id) REFERENCES categorias(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ";
    }

    // SQL para tabela de produtos
    private function getProductsTableSQL() {
        return "
            CREATE TABLE produtos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nome VARCHAR(200) NOT NULL,
                slug VARCHAR(200) UNIQUE NOT NULL,
                descricao TEXT,
                descricao_curta VARCHAR(500),
                categoria_id INT NOT NULL,
                marca VARCHAR(100),
                modelo VARCHAR(100),
                sku VARCHAR(50) UNIQUE,
                preco DECIMAL(10,2) NOT NULL,
                preco_promocional DECIMAL(10,2),
                estoque INT DEFAULT 0,
                peso DECIMAL(8,3),
                dimensoes VARCHAR(100),
                imagem_principal VARCHAR(255),
                galeria_imagens JSON,
                especificacoes JSON,
                ativo BOOLEAN DEFAULT TRUE,
                destaque BOOLEAN DEFAULT FALSE,
                data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (categoria_id) REFERENCES categorias(id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ";
    }

    // SQL para tabela de pedidos
    private function getOrdersTableSQL() {
        return "
            CREATE TABLE pedidos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                numero_pedido VARCHAR(50) UNIQUE NOT NULL,
                usuario_id INT NOT NULL,
                status ENUM('pendente', 'confirmado', 'processando', 'enviado', 'entregue', 'cancelado') DEFAULT 'pendente',
                subtotal DECIMAL(10,2) NOT NULL,
                desconto DECIMAL(10,2) DEFAULT 0,
                frete DECIMAL(10,2) DEFAULT 0,
                total DECIMAL(10,2) NOT NULL,
                endereco_entrega JSON NOT NULL,
                forma_pagamento VARCHAR(50) NOT NULL,
                status_pagamento ENUM('pendente', 'aprovado', 'rejeitado', 'cancelado') DEFAULT 'pendente',
                xp_ganho INT DEFAULT 0,
                data_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                data_confirmacao TIMESTAMP NULL,
                data_envio TIMESTAMP NULL,
                data_entrega TIMESTAMP NULL,
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ";
    }

    // SQL para tabela de itens do pedido
    private function getOrderItemsTableSQL() {
        return "
            CREATE TABLE itens_pedido (
                id INT AUTO_INCREMENT PRIMARY KEY,
                pedido_id INT NOT NULL,
                produto_id INT NOT NULL,
                quantidade INT NOT NULL,
                preco_unitario DECIMAL(10,2) NOT NULL,
                preco_total DECIMAL(10,2) NOT NULL,
                FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
                FOREIGN KEY (produto_id) REFERENCES produtos(id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ";
    }

    // SQL para tabela de histórico de XP
    private function getXPHistoryTableSQL() {
        return "
            CREATE TABLE historico_xp (
                id INT AUTO_INCREMENT PRIMARY KEY,
                usuario_id INT NOT NULL,
                acao VARCHAR(50) NOT NULL,
                xp_ganho INT NOT NULL,
                descricao VARCHAR(200) NOT NULL,
                pedido_id INT,
                valor_compra DECIMAL(10,2),
                detalhes JSON,
                data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
                FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ";
    }

    // SQL para tabela de lista de desejos
    private function getWishlistTableSQL() {
        return "
            CREATE TABLE lista_desejos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                usuario_id INT NOT NULL,
                produto_id INT NOT NULL,
                data_adicao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
                FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
                UNIQUE KEY unique_wishlist (usuario_id, produto_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ";
    }

    // SQL para tabela de carrinho
    private function getCartTableSQL() {
        return "
            CREATE TABLE carrinho (
                id INT AUTO_INCREMENT PRIMARY KEY,
                usuario_id INT,
                sessao_id VARCHAR(100),
                produto_id INT NOT NULL,
                quantidade INT NOT NULL,
                data_adicao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
                FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ";
    }

    // Inserir dados iniciais
    private function insertInitialData() {
        // Inserir categorias
        $this->insertCategories();
        
        // Inserir usuário administrador
        $this->insertAdminUser();
        
        // Inserir produtos de exemplo
        $this->insertSampleProducts();
    }

    // Inserir categorias iniciais
    private function insertCategories() {
        $categories = [
            ['nome' => 'Hardware', 'slug' => 'hardware', 'descricao' => 'Componentes para computadores', 'icone' => 'fas fa-microchip', 'ordem' => 1],
            ['nome' => 'Periféricos', 'slug' => 'perifericos', 'descricao' => 'Acessórios e periféricos', 'icone' => 'fas fa-keyboard', 'ordem' => 2],
            ['nome' => 'Computadores', 'slug' => 'computadores', 'descricao' => 'Computadores completos', 'icone' => 'fas fa-desktop', 'ordem' => 3],
            ['nome' => 'Games', 'slug' => 'games', 'descricao' => 'Jogos e acessórios para games', 'icone' => 'fas fa-gamepad', 'ordem' => 4]
        ];

        foreach ($categories as $category) {
            $existing = $this->db->fetchOne("SELECT id FROM categorias WHERE slug = :slug", [':slug' => $category['slug']]);
            if (!$existing) {
                $this->db->insert(
                    "INSERT INTO categorias (nome, slug, descricao, icone, ordem) VALUES (:nome, :slug, :descricao, :icone, :ordem)",
                    [
                        ':nome' => $category['nome'],
                        ':slug' => $category['slug'],
                        ':descricao' => $category['descricao'],
                        ':icone' => $category['icone'],
                        ':ordem' => $category['ordem']
                    ]
                );
                echo "📂 Categoria '{$category['nome']}' inserida\n";
            }
        }
    }

    // Inserir usuário administrador
    private function insertAdminUser() {
        $existing = $this->db->fetchOne("SELECT id FROM usuarios WHERE email = 'admin@rooxyce.com'");
        if (!$existing) {
            $this->db->insert(
                "INSERT INTO usuarios (nome, sobrenome, email, senha_hash, email_verificado, xp_total, nivel_atual, titulo_nivel) VALUES (:nome, :sobrenome, :email, :senha_hash, :email_verificado, :xp_total, :nivel_atual, :titulo_nivel)",
                [
                    ':nome' => 'Administrador',
                    ':sobrenome' => 'ROOXYCE',
                    ':email' => 'admin@rooxyce.com',
                    ':senha_hash' => password_hash('admin123', PASSWORD_DEFAULT),
                    ':email_verificado' => 1,
                    ':xp_total' => 10000,
                    ':nivel_atual' => 10,
                    ':titulo_nivel' => 'ROOXYCE VIP'
                ]
            );
            echo "👤 Usuário administrador criado (email: admin@rooxyce.com, senha: admin123)\n";
        }
    }

    // Inserir produtos de exemplo
    private function insertSampleProducts() {
        $products = [
            [
                'nome' => 'Placa de Vídeo RTX 4060',
                'slug' => 'placa-video-rtx-4060',
                'descricao' => 'Placa de vídeo NVIDIA GeForce RTX 4060 com 8GB GDDR6',
                'descricao_curta' => 'RTX 4060 8GB - Performance excepcional para jogos',
                'categoria_id' => 1,
                'marca' => 'NVIDIA',
                'modelo' => 'RTX 4060',
                'sku' => 'RTX4060-8GB',
                'preco' => 1899.99,
                'estoque' => 10,
                'imagem_principal' => 'imagens/thumbs/produto1.webp'
            ],
            [
                'nome' => 'Teclado Mecânico RGB',
                'slug' => 'teclado-mecanico-rgb',
                'descricao' => 'Teclado mecânico com switches blue e iluminação RGB',
                'descricao_curta' => 'Teclado mecânico com RGB e switches blue',
                'categoria_id' => 2,
                'marca' => 'ROOXYCE',
                'modelo' => 'KB-RGB-001',
                'sku' => 'KB-RGB-001',
                'preco' => 299.99,
                'estoque' => 25,
                'imagem_principal' => 'imagens/thumbs/produto2.webp'
            ]
        ];

        foreach ($products as $product) {
            $existing = $this->db->fetchOne("SELECT id FROM produtos WHERE slug = :slug", [':slug' => $product['slug']]);
            if (!$existing) {
                $this->db->insert(
                    "INSERT INTO produtos (nome, slug, descricao, descricao_curta, categoria_id, marca, modelo, sku, preco, estoque, imagem_principal) VALUES (:nome, :slug, :descricao, :descricao_curta, :categoria_id, :marca, :modelo, :sku, :preco, :estoque, :imagem_principal)",
                    [
                        ':nome' => $product['nome'],
                        ':slug' => $product['slug'],
                        ':descricao' => $product['descricao'],
                        ':descricao_curta' => $product['descricao_curta'],
                        ':categoria_id' => $product['categoria_id'],
                        ':marca' => $product['marca'],
                        ':modelo' => $product['modelo'],
                        ':sku' => $product['sku'],
                        ':preco' => $product['preco'],
                        ':estoque' => $product['estoque'],
                        ':imagem_principal' => $product['imagem_principal']
                    ]
                );
                echo "🛍️ Produto '{$product['nome']}' inserido\n";
            }
        }
    }
}

// Executar instalação se chamado diretamente
if (basename(__FILE__) == basename($_SERVER['SCRIPT_NAME'])) {
    $installer = new DatabaseInstaller();
    $installer->install();
}
?>

