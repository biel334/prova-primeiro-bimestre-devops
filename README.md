# API de Reservas — TechNova

**Aluno:** Gabriel de Souza Oliveira
**RA:** 6325262
**Disciplina:** DevOps — Prova do 1º Bimestre (Aulas 01 a 07)

## Descrição do Projeto

API REST para gerenciamento de reservas da TechNova, construída como desafio final
do bimestre: aplica versionamento (Git), containerização (Docker), orquestração local
(Docker Compose) e infraestrutura como código na AWS (Terraform modularizado, com
estado remoto), rodando no AWS Academy Learner Lab.

A API expõe o CRUD completo do recurso `reservas` (campos: `id`, `cliente`, `data`,
`status`), persistindo os dados em um banco PostgreSQL — tanto localmente (via Docker
Compose) quanto na nuvem (RDS).

## Rotas

| Método | Rota            | Ação                          |
|--------|-----------------|--------------------------------|
| POST   | /reservas       | Cria uma nova reserva          |
| GET    | /reservas       | Lista todas as reservas        |
| GET    | /reservas/:id   | Busca uma reserva pelo id      |
| PUT    | /reservas/:id   | Atualiza uma reserva existente |
| DELETE | /reservas/:id   | Remove uma reserva             |
| GET    | /health         | Healthcheck (API + banco)      |

## Como rodar localmente

```bash
docker compose up --build
```

A API sobe em `http://localhost:3000` e o Postgres em `localhost:5432`.

## Estrutura do Repositório

## Infraestrutura AWS

Provisionada via Terraform modularizado (`infra/`) no AWS Academy Learner Lab, região
`us-east-1`, usando `LabRole`/`LabInstanceProfile` (sem criação de IAM próprio):
VPC com sub-redes públicas e privadas em 2 AZs, Security Groups de menor privilégio,
EC2 t2.micro rodando a API e RDS PostgreSQL em sub-rede privada. Estado remoto em
S3 (versionado e criptografado) com lock via DynamoDB.

Detalhes da arquitetura, decisões de segurança e o processo de uso de IA como
copiloto estão documentados em [`relatorio.md`](./relatorio.md).
