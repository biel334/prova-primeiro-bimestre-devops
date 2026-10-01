# Relatório do Processo — Prova do Primeiro Bimestre (DevOps)

**Aluno:** Gabriel de Souza Oliveira
**RA:** 6325262
**Ferramentas de IA utilizadas:** Kiro nas Fases 1 a 3 (Git, Dockerfile e Docker Compose) e Claude (Anthropic), em conversa de chat, nas Fases 4 a 6 (Terraform, depuração e relatório).

---

## Questão 1 — A Jornada Completa (Aulas 01 a 07)

Segui a ordem do enunciado porque cada etapa depende da anterior e porque erros ficam mais caros quanto mais longe da máquina local eles aparecem. Comecei pela aplicação e pelo Git (Aula 01): criei o repositório, fiz o commit inicial e a estrutura da API de Reservas (Node.js/Express com CRUD completo gravando em PostgreSQL). Usei Conventional Commits e uma feature branch por etapa (`feat/docker`, `feat/compose`, `feat/terraform`, `docs/evidencias`, `docs/relatorio`, `docs/relatorio-ia`), cada uma integrada com `merge --no-ff`, o que deixou um histórico legível de 14 commits (contando os merges) em que dá para ver a evolução do projeto.

Depois containerizei a API (Aula 01): Dockerfile multi-stage a partir de `node:20-alpine`, com `.dockerignore` e usuário não-root (`appuser`), de modo que a imagem final carrega só as dependências de produção. Em seguida veio o Docker Compose (Aula 02): API e Postgres 16, volume nomeado `db-data`, rede bridge customizada `reservas-net`, healthcheck do banco com `pg_isready`, `depends_on` com `condition: service_healthy` e variáveis em `.env` (ignorado pelo Git), com `.env.example` versionado. Só com o ambiente local provado, com a API respondendo `/health` e gravando no banco, fui para a nuvem, porque um erro de aplicação é barato de achar em localhost e caro de achar dentro de uma EC2.

Na AWS (Aulas 03 a 06) a primeira decisão foi criar o backend de estado remoto antes de tudo, já que o bloco `backend "s3"` do projeto principal precisa de bucket e tabela existentes para o `terraform init`. Depois escrevi o projeto principal modularizado (Aula 06): o módulo `vpc` (VPC 10.0.0.0/16, duas subnets públicas e duas privadas em duas AZs, internet gateway e tabelas de rota), o `security-group`, o `rds` e o `ec2`. A composição acontece no `main.tf` da raiz: os outputs da VPC alimentam os security groups, o RDS e a EC2, e o endereço do RDS alimenta o `user_data` da EC2, o que também define a ordem correta de criação (o banco sobe antes da instância que depende dele). Fechei com `fmt`, `validate` e `plan`, depois `apply`, testes do CRUD na nuvem e `terraform destroy`. A Aula 07 (IA como copiloto) atravessou o processo inteiro: o que aprendi nas aulas anteriores foi o que me permitiu ler, questionar e corrigir o que a IA gerou.

Resumo de onde cada aula apareceu: Aula 01 no Git, nas branches e no Dockerfile; Aula 02 no Compose; Aulas 03 a 05 nos recursos de rede, EC2, RDS e no remote state (S3 + DynamoDB); Aula 06 na modularização; Aula 07 no uso crítico da IA e neste relatório.

---

## Questão 2 — O Processo com IA como Copiloto

Usei o Claude (Anthropic) em uma conversa de chat. Colei o enunciado completo da prova e pedi que avançássemos fase por fase. Para a infraestrutura recebi o código completo em um único script bash que criava todos os arquivos do `infra/`, e a partir daí o fluxo foi um ciclo: a IA propõe, eu executo no terminal do Codespace, colo a saída (inclusive os erros) e ela corrige. O ambiente (AWS Academy Learner Lab, `us-east-1`, `LabRole`/`LabInstanceProfile`, sem criar IAM) estava no próprio enunciado que forneci. Com o Claude trabalhei em fluxo conversacional, sem as etapas formais de requisitos, design e tarefas do Kiro Spec. Nas Fases 1 a 3 (Git, Dockerfile e Docker Compose) usei o kiro  como apoio, antes de levar o projeto para o Claude na parte de infraestrutura. A o kiro gerou bem o [Dockerfile / docker-compose / estrutura da API]. E quando fiquei com duvida pedi po kiro tipo o erro do healthcheck, a porta, uma variável do .env ai aprendir como fuciona  e corigir esse erro 

A IA foi muito boa no trabalho de estrutura e repetição: os quatro módulos Terraform e a composição entre eles (18 recursos), o `user_data` da EC2 (instala Docker, clona o repositório, builda a imagem e sobe o container com as variáveis do RDS), os scripts de evidência e, principalmente, o diagnóstico da falha do Compose no Codespace, em que ela me guiou por `ping` entre containers, leitura das chains do `iptables` e separação entre erro de código e limitação do ambiente. O que precisei corrigir ou contornar: (1) o bucket S3 do remote state declarado como recurso Terraform falhou porque uma política da organização do Learner Lab (SCP) nega `s3:GetBucketObjectLockConfiguration`, então o bucket passou a ser criado por script com AWS CLI e o Terraform ficou só com o DynamoDB; (2) o primeiro script de evidência do CRUD usava `id` fixo e gerou só respostas 404, tive que refazê-lo capturando o `id` devolvido pela API; (3) um comando de depuração usava um output (`instance_id`) que não existia; (4) o parâmetro `dynamodb_table` do backend gera aviso de depreciação, mantido porque o enunciado exige DynamoDB para lock; (5) scripts longos colados no terminal sofreram com paginador do Git e formatação, exigindo reexecução.

Comparando com fazer manualmente: a IA economizou muito tempo no boilerplate, que seria horas de consulta à documentação de cada recurso, e na depuração de rede. Atrapalhou quando afirmou algo que parecia padrão mas não valia no Learner Lab (o recurso S3 do provider), e quando gerou scripts que eu só descobri que estavam errados ao executar. A conclusão prática é que a IA acelera, mas cada saída precisa ser lida, e foi a leitura dos erros reais do terminal que resolveu os problemas.

---

## Questão 3 — Infraestrutura, Segurança e o Learner Lab

A arquitetura provisionada, na região `us-east-1`, é a seguinte:

```text
Internet
   |
[Internet Gateway]
   |
VPC 10.0.0.0/16
 ├── Subnets públicas  (us-east-1a / us-east-1b)  10.0.1.0/24, 10.0.2.0/24
 │      └── EC2 t2.micro (API em Docker, porta 3000)  [SG: 22, 3000]
 └── Subnets privadas  (us-east-1a / us-east-1b)  10.0.11.0/24, 10.0.12.0/24
        └── RDS PostgreSQL db.t3.micro  [SG: 5432 somente do SG da EC2]

Remote state: S3 (versionado + AES256) + DynamoDB (lock)
```

A EC2 fica na subnet pública porque precisa receber tráfego da internet na porta 3000 e baixar o código e as imagens durante o boot; por isso tem rota para o internet gateway e IP público. O RDS fica nas subnets privadas porque o banco nunca deve ser exposto: as subnets privadas não têm rota para a internet, o RDS tem `publicly_accessible = false` e o security group dele só aceita a porta 5432 vindo do security group da EC2 (a regra referencia o SG, não um CIDR). Assim, o único caminho até os dados passa pela aplicação. Além disso o banco tem `storage_encrypted = true`, e o RDS está em um DB subnet group com duas AZs, como o serviço exige.

Sobre o Learner Lab: não criei nenhum usuário, grupo ou role de IAM. A EC2 usa o `LabInstanceProfile` já existente, que fornece as permissões de serviço de que a instância precisaria sem eu criar nada. Em relação ao que foi ensinado, o Lab exigiu ajustes: as credenciais são temporárias e vêm com Session Token, precisando ser coladas em `~/.aws/credentials` a cada sessão, e expiram (o erro típico é `ExpiredToken`); a região é fixa em `us-east-1`; e há políticas de organização (SCP) que bloqueiam algumas ações de API. Foi uma delas que quebrou o bucket S3 declarado em Terraform, e a solução foi criar o bucket por AWS CLI com versionamento, criptografia AES256 e bloqueio de acesso público, mantendo o DynamoDB no Terraform. Também precisei lembrar de executar `terraform destroy` ao final para não gastar créditos, o que fiz e registrei em `evidencias/terraform-destroy.txt`.

Um ajuste de segurança consciente: o grupo de parâmetros do RDS define `rds.force_ssl = 0`, porque o Postgres 16 na AWS exige SSL por padrão e a API não está configurada para usar SSL na conexão. É uma troca entre funcionar e proteger o tráfego, aceitável aqui porque a comunicação ocorre dentro da VPC, mas em produção o correto seria habilitar SSL na aplicação e manter a exigência do banco.

---

## Questão 4 — Validação e Responsabilidade

Antes do `terraform apply` apliquei este checklist ao código gerado pela IA:

- `terraform fmt` e `terraform validate` sem erros.
- Leitura completa do `terraform plan` (salvo em `evidencias/terraform-plan.txt`), conferindo que eram 18 recursos a criar, nenhum a destruir e nenhum recurso de IAM.
- Conferência dos pontos de segurança no plano: `publicly_accessible = false`, `storage_encrypted = true`, regra 5432 do RDS apontando para o SG da EC2, `LabInstanceProfile`, região `us-east-1` e tags em todos os recursos.
- Senha do banco como variável `sensitive`, em `terraform.tfvars` ignorado pelo Git, sem nenhum valor real no repositório.
- Verificação do que ia para o commit: `.gitignore` com `.terraform/`, `*.tfstate`, `*.tfvars`, `*.pem` e `.env`, e uma trava no comando de commit que aborta se encontrar senha, chaves ou arquivos de estado.
- Backend criado antes e conferido por AWS CLI (versionamento e criptografia) antes de apontar o projeto para ele.

Depois do `apply` validei a infraestrutura de forma objetiva: `curl` no `/health` mostrando `"database":"connected"`, o CRUD completo contra a API na nuvem (incluindo 404 após o DELETE e 400 na validação), e uma consulta ao RDS pela AWS CLI mostrando `PubliclyAccessible = False` e `StorageEncrypted = True`. Esse trabalho também me mostrou fragilidades que eu deixaria de corrigir sem a revisão: a porta 22 está aberta para `0.0.0.0/0` (em produção eu restringiria ao meu IP ou usaria SSM), e a senha do banco é injetada pelo `user_data`, o que a deixa visível nos metadados da instância (o correto seria um Secrets Manager ou Parameter Store).

Se eu tivesse aceitado o código da IA sem revisar, o primeiro erro seria o bucket S3, que travou o remote state; um segundo seria o `rds.force_ssl` padrão, que faria a API subir sem conseguir conectar ao banco; e um terceiro, mais grave, seria deixar credenciais, `tfstate` ou `.env` irem para o repositório público, ou esquecer o `destroy` e consumir os créditos do Lab. A evolução Git, Docker, Terraform e Módulos me preparou porque cada camada me deu um critério de verificação: o Git me deu histórico e reversão, o Docker e o Compose me deram a certeza de que a aplicação funciona antes de ir para a nuvem, e o Terraform me deu o `plan` como ponto de revisão antes de qualquer mudança real. Usar IA com responsabilidade, para mim, é tratar a saída dela como um rascunho de um colega rápido: ela escreve mais depressa do que eu, mas quem responde pelo resultado sou eu.

### Aprendizado extra: falha de rede do Compose no Codespace

Ao regenerar a evidência do Compose, a API ficou esperando o banco sem logar nada. O diagnóstico mostrou que dois containers em rede customizada não se alcançavam (100% de perda no `ping`), enquanto na bridge padrão funcionavam. A causa era a chain `FORWARD` com policy `DROP` no `iptables-legacy` do Codespace, sem regras para as bridges `br-*`. Liberei o encaminhamento com `iptables-legacy -I FORWARD -i br+ -j ACCEPT` e `-o br+ -j ACCEPT` (regra temporária, fora do repositório), e o Compose passou a funcionar sem nenhuma alteração no `docker-compose.yml`. A lição foi separar erro de código de limitação do ambiente antes de mexer no que estava certo.
