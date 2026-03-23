🏢 JB Pessoa Imóveis 

Sistema web completo para gestão imobiliária, desenvolvido com foco em cadastro de clientes, proprietários, imóveis e documentos. 

 

📌 Objetivo 

O sistema JB Pessoa Imóveis foi desenvolvido para facilitar o gerenciamento de informações imobiliárias, permitindo: 

Cadastro de clientes compradores 

Cadastro de proprietários 

Cadastro de imóveis 

Upload e gerenciamento de documentos 

Organização de dados em um ambiente digital moderno 

 

🛠 Tecnologias Utilizadas 

Frontend 

React 

JavaScript 

CSS (estilização customizada) 

Axios 

Backend 

Node.js 

Express 

Prisma ORM 

Banco de Dados 

PostgreSQL 

Ferramentas 

Docker 

pgAdmin 

Insomnia 

VS Code 

 

🚀 Como rodar o projeto 

1. Clonar o projeto 

git clone <URL_DO_SEU_PROJETO> 
cd jb-pessoa-imoveis 
 

 

2. Subir o banco com Docker 

docker-compose up -d 
 

Ou manualmente: 

docker run --name jb_pessoa_postgres -e POSTGRES_PASSWORD=123456 -p 5432:5432 -d postgres 
 

 

3. Configurar o backend 

Entre na pasta: 

cd backend 
 

Instale as dependências: 

npm install 
 

Crie o arquivo .env: 

DATABASE_URL="postgresql://postgres:123456@localhost:5432/jb_pessoa_imoveis" 
JWT_SECRET="sua_chave_secreta" 
PORT=3001 
 

Rodar migração: 

npx prisma migrate dev 
 

Iniciar backend: 

npm run dev 
 

 

4. Rodar o frontend 

Abra outro terminal: 

cd frontend 
npm install 
npm run dev 
 

 

🔐 Autenticação 

Criar usuário (Insomnia) 

POST: 

http://localhost:3001/auth/register 
{ 
  "name": "Administrador", 
  "email": "admin@jbpessoa.com", 
  "password": "123456", 
  "role": "GERENTE" 
} 
 

Login 

POST: 

http://localhost:3001/auth/login 
 

Copiar o token gerado. 

 

📋 Funcionalidades 

👤 Clientes 

Cadastro 

Edição 

Exclusão 

Busca 

Dados pessoais completos 

🧑‍💼 Proprietários 

Cadastro completo 

Edição 

Exclusão 

Vinculação com imóveis 

🏠 Imóveis 

Cadastro completo 

Associação com proprietário 

Edição 

Exclusão 

Informações detalhadas (preço, área, endereço, etc.) 

📄 Documentos 

Upload de arquivos (PDF/imagem) 

Vinculação com cliente ou imóvel 

Visualização de documentos 

 

📊 Estrutura do Projeto 

jb-pessoa-imoveis/ 
│ 
├── backend/ 
│   ├── src/ 
│   ├── prisma/ 
│   └── server.js 
│ 
├── frontend/ 
│   ├── src/ 
│   └── public/ 
│ 
└── README.md 
 

 

🧪 Testes 

Os testes foram realizados utilizando: 

Insomnia (requisições HTTP) 

Testes manuais no frontend 

 

📦 Principais Endpoints 

Auth 

POST /auth/register 

POST /auth/login 

Pessoas 

GET /persons 

POST /persons 

PUT /persons/:id 

DELETE /persons/:id 

Imóveis 

GET /properties 

POST /properties 

PUT /properties/:id 

DELETE /properties/:id 

Documentos 

POST /documents 

GET /documents 

 

👥 Autores 

Projeto desenvolvido por: 

Tamires Sousa Pessoa 

 

🎯 Considerações Finais 

O sistema JB Pessoa Imóveis oferece uma solução completa para gestão imobiliária, com: 

Interface moderna 

Backend robusto 

Integração com banco de dados 

Upload de documentos 

Estrutura escalável 

 

📌 Melhorias Futuras 

Dashboard com métricas 

Relatórios 

Filtros avançados 

Integração com APIs externas 

Controle de permissões por usuário 

 

🏁 Status do Projeto 

✅ Funcional 

✅ Testado 

✅ Pronto para apresentação 

 
