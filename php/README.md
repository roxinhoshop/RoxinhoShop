# ROOXYCE Store - Backend PHP

Este diretório contém os arquivos PHP para o backend da ROOXYCE Store, incluindo conexão com banco de dados, API REST e scripts de instalação.

## 📁 Estrutura dos Arquivos

### `config.php`
- **Função:** Configurações gerais do sistema
- **Conteúdo:** Credenciais do banco, configurações de segurança, CORS
- **Uso:** Incluído em todos os outros arquivos PHP

### `database.php`
- **Função:** Classe para conexão e operações com banco de dados
- **Recursos:** PDO, transações, queries preparadas
- **Uso:** Base para todas as operações de banco

### `install.php`
- **Função:** Script de instalação do banco de dados
- **Recursos:** Criação de tabelas, dados iniciais, verificações
- **Uso:** Execute uma vez para configurar o banco

### `api.php`
- **Função:** API REST para comunicação frontend-backend
- **Endpoints:** /usuarios, /produtos, /categorias, /pedidos, /auth
- **Uso:** Interface principal entre JavaScript e PHP

### `test-connection.php`
- **Função:** Página de teste e diagnóstico
- **Recursos:** Verificação de conexão, status das tabelas
- **Uso:** Diagnóstico e troubleshooting

## 🚀 Instalação e Configuração

### 1. Configurar Banco de Dados

Edite o arquivo `config.php` com suas credenciais:

```php
define('DB_HOST', 'localhost');     // Host do MySQL
define('DB_PORT', '3306');          // Porta do MySQL
define('DB_NAME', 'rooxyce_store'); // Nome do banco
define('DB_USER', 'root');          // Usuário do MySQL
define('DB_PASS', '');              // Senha do MySQL
```

### 2. Executar Instalação

Acesse no navegador ou execute via linha de comando:

```bash
# Via navegador
http://localhost/php/install.php

# Via linha de comando
php install.php
```

### 3. Testar Conexão

Acesse a página de teste:

```bash
http://localhost/php/test-connection.php
```

## 🔌 Endpoints da API

### Autenticação
- `POST /php/api.php/auth/login` - Login de usuário
- `POST /php/api.php/auth/register` - Registro de usuário
- `POST /php/api.php/auth/logout` - Logout de usuário

### Usuários
- `GET /php/api.php/usuarios` - Listar usuários
- `GET /php/api.php/usuarios/{id}` - Obter usuário por ID
- `POST /php/api.php/usuarios` - Criar usuário
- `PUT /php/api.php/usuarios/{id}` - Atualizar usuário
- `DELETE /php/api.php/usuarios/{id}` - Deletar usuário

### Produtos
- `GET /php/api.php/produtos` - Listar produtos
- `GET /php/api.php/produtos/{id}` - Obter produto por ID
- `POST /php/api.php/produtos` - Criar produto

### Categorias
- `GET /php/api.php/categorias` - Listar categorias

### Teste
- `GET /php/api.php/test` - Testar conexão da API

## 📊 Estrutura do Banco de Dados

### Tabelas Principais

1. **usuarios** - Dados dos usuários e sistema de XP
2. **enderecos** - Endereços de entrega dos usuários
3. **categorias** - Categorias de produtos
4. **produtos** - Catálogo de produtos
5. **pedidos** - Pedidos realizados
6. **itens_pedido** - Itens de cada pedido
7. **historico_xp** - Histórico de pontos XP
8. **lista_desejos** - Lista de desejos dos usuários
9. **carrinho** - Carrinho de compras (opcional)

### Dados Iniciais

Após a instalação, o sistema inclui:
- **Categorias:** Hardware, Periféricos, Computadores, Games
- **Usuário Admin:** admin@rooxyce.com / admin123
- **Produtos de Exemplo:** RTX 4060, Teclado Mecânico RGB

## 🔧 Integração com Frontend

### JavaScript - Exemplo de Uso

```javascript
// Teste de conexão
fetch('/php/api.php/test')
  .then(response => response.json())
  .then(data => console.log(data));

// Login
fetch('/php/api.php/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@rooxyce.com',
    senha: 'admin123'
  })
})
.then(response => response.json())
.then(data => console.log(data));

// Listar produtos
fetch('/php/api.php/produtos')
  .then(response => response.json())
  .then(data => console.log(data.products));
```

## 🛡️ Segurança

### Recursos Implementados
- **Senhas:** Hash com `password_hash()`
- **SQL Injection:** Queries preparadas (PDO)
- **CORS:** Configurado para desenvolvimento
- **Sessões:** Configuração segura de cookies
- **Validação:** Verificação de dados de entrada

### Para Produção
- Configure HTTPS (`session.cookie_secure = 1`)
- Use senhas fortes no banco de dados
- Configure firewall e limite de conexões
- Implemente rate limiting na API
- Configure logs de auditoria

## 🐛 Troubleshooting

### Erro de Conexão
1. Verificar se MySQL está rodando
2. Conferir credenciais em `config.php`
3. Verificar permissões do usuário MySQL
4. Testar conexão manual: `mysql -u root -p`

### Tabelas Não Encontradas
1. Executar `install.php`
2. Verificar permissões de criação de tabelas
3. Conferir se o banco de dados existe

### API Não Responde
1. Verificar se PHP está configurado
2. Conferir logs de erro do servidor
3. Testar endpoint `/php/api.php/test`
4. Verificar configurações de CORS

## 📞 Suporte

Para dúvidas ou problemas:
1. Consulte os logs de erro do PHP
2. Execute `test-connection.php` para diagnóstico
3. Verifique a documentação do MySQL/PHP
4. Contate o desenvolvedor: Gabriel (gabwvr)

---

**Desenvolvido por Gabriel (gabwvr) para ROOXYCE Store**

