# Sistema de Scraping para Coleta de Informações no Marketplace Kabum
Video apresentando o projeto em funcionamento: https://youtu.be/z28H-0dkfAc

Este projeto demonstra a implementação de um sistema de web scraping utilizando Puppeteer e JavaScript para coletar informações de produtos no marketplace Kabum. O objetivo principal é extrair dados como nome do produto, preço, descrição, avaliações, imagens, e realizar screenshots das páginas de produtos, armazenando-os de forma estruturada para análise posterior.

## Tecnologias Utilizadas

- **JavaScript**
- **Node.js**
- **Puppeteer**
- **Prisma**: ORM para Node.js, usado para interação com o banco de dados.
- **MySQL**: Sistema de gerenciamento de banco de dados, onde os dados coletados são armazenados.

## Funcionalidades

- Navegação automatizada até a página de busca do Kabum e realização de pesquisa por produtos.
- Extração de informações detalhadas dos produtos, incluindo título, preço, descrição, avaliações, link de imagens, e screenshots das páginas.
- Armazenamento dos dados coletados em um banco de dados MySQL para análises futuras.
- Verificação e tratamento de erros.

## Como Usar

### Pré-requisitos
Antes de iniciar, é necessário ter o Node.js instalado em sua máquina, além do MySQL para armazenamento dos dados.

1. Navegue até o diretório do projeto e instale as dependências:
   `npm install`

### Conectar com o Banco de dados
1. Configure o acesso ao banco de dados editando o arquivo .env na raiz do projeto, inserindo as credenciais do seu banco de dados MySQL.
2. Execute as migrações do Prisma para criar as tabelas no banco de dados:
    `npx prisma migrate dev`

### Exeecutando o Script de Scraping
1. Para iniciar o processo de coleta de dados, execute:
    `node index.js` 

## Estrutura do Projeto
1.  index.js: Arquivo principal que executa o script de scraping.
2.  api/addProduct.js: Módulo responsável pela inserção dos dados coletados no banco de dados.
3.  schema.prisma: Define o modelo de dados utilizado pelo Prisma.
4.  .env: Armazena variáveis de ambiente, incluindo as credenciais do banco de dados.
