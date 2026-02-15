# Documentação – Aplicação de Questionários (LuzIA)

## Visão Geral

Este documento explica, de forma simples e acessível, como funciona a aplicação de questionários no sistema LuzIA.

O objetivo é permitir que qualquer pessoa compreenda:
- Como o usuário acessa o sistema
- Como os questionários são apresentados
- Como as respostas são registradas
- O que acontece depois que um questionário é respondido


## Conceitos Básicos

API  
É o meio pelo qual sistemas se comunicam entre si. No LuzIA, a API permite que aplicativos solicitem questionários, enviem respostas e consultem resultados.

Autenticação  
Processo que confirma que a pessoa que está acessando o sistema é realmente quem ela diz ser.

Token  
Código temporário gerado após a autenticação. Ele funciona como uma credencial que permite ao usuário usar o sistema sem precisar se identificar novamente a cada ação.

Questionário  
Conjunto organizado de perguntas criado para avaliar um determinado tema ou situação.

Pergunta  
Item individual dentro de um questionário que solicita uma resposta específica do usuário.

Resposta  
Valor informado pelo usuário ao responder uma pergunta do questionário.

Diagnóstico  
Resultado da análise das respostas. Ele transforma os valores informados em conclusões compreensíveis.

Anonimização  
Processo que protege a identidade da pessoa, substituindo dados pessoais por códigos que não permitem identificação direta.


## Quem participa do processo

**Usuário**
É a pessoa que responde os questionários. Ela acessa o sistema por meio do telefone, responde às perguntas e recebe seus resultados de forma anônima.

**Administrador**  
É responsável por gerenciar organizações e gerar relatórios consolidados com base nas respostas coletadas.

**Sistema LuzIA**  
É o responsável por disponibilizar questionários, registrar respostas, calcular diagnósticos e gerar relatórios.


## Fluxo geral da aplicação de questionários

O funcionamento básico do sistema segue este fluxo:

1. O usuário solicita acesso ao sistema  
2. O sistema valida o acesso por meio de um código  
3. O usuário é autenticado  
4. Os questionários disponíveis são apresentados  
5. O usuário responde ao questionário  
6. As respostas são registradas  
7. Um diagnóstico é calculado automaticamente  
8. Os dados ficam disponíveis para análise e relatórios  


## Solicitação de acesso ao sistema

Para acessar o sistema, o usuário informa seu número de telefone.

O sistema envia um código temporário para esse número. Esse código garante que somente a pessoa dona do telefone consiga acessar o sistema.

Esse método substitui o uso de senhas tradicionais e aumenta a segurança.


## Autenticação do usuário

Após receber o código, o usuário informa:
- Seu número de telefone
- O código recebido

Se as informações estiverem corretas, o sistema libera o acesso e gera um token de autenticação.

Esse token permite que o usuário navegue pelo sistema e responda questionários sem precisar se autenticar novamente a cada ação.


## Disponibilização dos questionários

Depois de autenticado, o usuário passa a ter acesso aos questionários disponíveis.

O sistema garante que:
- Apenas questionários ativos sejam exibidos
- O usuário veja somente o que está autorizado

Cada questionário contém informações básicas e suas respectivas perguntas.


## Resposta ao questionário

O usuário responde às perguntas selecionando valores dentro de uma escala definida.

As respostas representam percepções ou avaliações pessoais e não exigem textos longos ou justificativas.

Durante esse processo, a identidade real do usuário não é armazenada junto às respostas.


## Envio das respostas

Quando o usuário finaliza o questionário:
- Todas as respostas são enviadas juntas
- Cada resposta é associada à pergunta correspondente
- O sistema registra a data e o questionário respondido

Esse envio marca a conclusão do questionário.


## Processamento após o envio

Assim que as respostas são recebidas, o sistema inicia automaticamente a análise dos dados.

Esse processo inclui:
- Avaliação dos valores informados
- Cálculo de indicadores
- Identificação de padrões de risco ou proteção

O resultado dessa análise é chamado de diagnóstico.


## Resultados e análises

Após o diagnóstico:
- O usuário pode consultar seus próprios resultados
- Administradores podem gerar relatórios consolidados
- As análises podem ser feitas por organização, setor ou de forma geral

Esses relatórios servem como base para tomada de decisão e acompanhamento de resultados.


## Privacidade e confidencialidade

Em todo o processo:
- O nome do usuário não é exibido
- O telefone não aparece em relatórios
- Nenhuma informação permite identificar diretamente a pessoa

O sistema foi projetado para garantir confidencialidade e uso responsável dos dados.


Fim da documentação.
