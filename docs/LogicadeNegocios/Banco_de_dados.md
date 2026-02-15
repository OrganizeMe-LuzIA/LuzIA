#  LuzIA – Banco de dados

## Visão Geral

O banco de dados da **LuzIA** é um sistema que organiza informações de **empresas, pessoas e questionários**, com o objetivo de **coletar respostas, analisar resultados e gerar relatórios claros**.

##  Conceitos Básicos

Antes de entender o sistema, é importante conhecer alguns termos:

#### Collection (Coleção);
Uma coleção é como uma **gaveta** ou uma **planilha** que guarda informações do mesmo tipo.

#### Documento
Um documento é um **registro individual** dentro de uma coleção.  
Exemplo: uma empresa, uma pessoa ou uma resposta.

#### ID / Identificador
Código único usado para identificar algo e ligar informações entre si.

#### Relacionamento
Ligação entre informações.  
Exemplo: um usuário pertence a uma organização.

#### Anonimização
Processo que protege a identidade da pessoa usando códigos em vez de nomes.


##  Estrutura do Banco de Dados

O banco de dados do LuzIA é dividido em **coleções**, cada uma responsável por um tipo de informação, sendo elas:


###  Organizações

 **O que é?**  
Empresas ou instituições que utilizam o sistema.

 **Para que serve?**  
É a base de todo o sistema. Todas as outras informações se relacionam a uma organização.

 **Principais dados:**
- Nome da organização
- CNPJ (identificador único)

 
###  Setores

 **O que é?**  
Departamentos dentro de uma organização.

 **Exemplos:**  
RH, Financeiro, Operações.

 **Para que serve?**  
Permite analisar informações por área da empresa.

 **Regra importante:**  
Todo setor pertence a uma organização.


###  Usuários

 **O que é?**  
Pessoas que respondem os questionários.

 **Para que serve?**  
Registrar quem participou, sem expor a identidade real.

 **Principais dados:**
- Telefone
- Organização
- Setor (opcional)
- Status (ativo, inativo, aguardando confirmação)
- AnonId (identificador anônimo)
- Data de cadastro
- Indicador se já respondeu

 **Importante:**  
O sistema **não usa o nome da pessoa nos resultados**, apenas um código anônimo.


###  Questionários

 **O que é?**  
Conjunto de perguntas aplicadas aos usuários.

 **Para que serve?**  
Avaliar riscos, percepções ou outros aspectos definidos pela organização.

 **Principais dados:**
- Nome
- Versão
- Descrição
- Domínios (grandes temas)
- Escala de respostas
- Total de perguntas
- Status (ativo ou não)



### Perguntas

 **O que é?**  
Cada pergunta individual dentro de um questionário.

 **Para que serve?**  
Coletar uma resposta específica do usuário.

 **Principais dados:**
- Texto da pergunta
- Tipo
- Domínio e dimensão
- Sinal (risco ou proteção)
- Escala de resposta
- Item invertido (quando a lógica da resposta é inversa)

 **Regra importante:**  
Toda pergunta pertence a um questionário.



###  Respostas

 **O que é?**  
As respostas dadas por um usuário a um questionário.

 **Para que serve?**  
Registrar o que foi respondido, quando e para qual pergunta.

 **Como funciona?**
- Cada resposta está ligada a um usuário (anonId)
- Contém várias respostas de perguntas
- Cada resposta tem um valor numérico



###  Diagnósticos

 **O que é?**  
O resultado da análise das respostas.

 **Para que serve?**  
Transformar respostas em conclusões compreensíveis.

 **Pode conter:**
- Resultado global
- Avaliação por dimensões
- Nível de risco
- Data da análise


###  Relatórios

 **O que é?**  
A consolidação final das informações para leitura humana.

 **Tipos de relatório:**
- Organizacional
- Setorial
- Individual (anônimo)

 **Pode conter:**
- Métricas gerais
- Médias de risco
- Índices de proteção
- Total de respondentes
- Recomendações
- Observações finais

 **Importante:**  
Relatórios **não coletam dados**, eles **resumem e explicam**.



##  Fluxo de Funcionamento

1. Cadastra-se uma organização;
2. Criam-se setores;
3. Cadastram-se usuários;
4. O Bot aplica o questionário;
5. Usuários respondem;
6. O Bot envia as respostas para o banco de dados;
7. O banco armazena as informações anonimamente e gera diagnósticos;
8. Relatórios são produzidos;



##  Resumo em uma frase

> O Banco de dados da LuzIA organiza respostas de questionários para gerar diagnósticos e relatórios claros, mantendo a privacidade das pessoas e permitindo análises em vários níveis.

