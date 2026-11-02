# Roteiro manual de testes — GymNotes

Este roteiro foi preparado para testar o site pelo navegador, sem ferramentas de programação.

## Antes de começar

- Site: <https://gymnotes-gg.vercel.app>
- Faça os testes em computador e, se possível, repita a parte de navegação em um celular.
- Use uma conta **exclusiva para teste**. Não use senha de outros serviços nem compartilhe sua senha ou tokens.
- **Atenção:** cadastro, treinos, refeições, curtidas e comentários podem ficar gravados na produção. O roteiro não apaga os dados ao final. Faça esses testes somente se estiver de acordo com isso.
- Separe papel ou use a tabela de resultados no fim para marcar **PASSOU**, **FALHOU** ou **NÃO CONSEGUI TESTAR**.
- Se alguma tela demorar, aguarde até 45 segundos antes de concluir que falhou.

## 1. Acesso e cadastro

1. Abra o endereço do site em uma janela anônima/privada.
2. Confirme que aparece a tela do GymNotes, e não uma tela de login da Vercel.
3. Na tela de login, tente entrar com um e-mail de teste inexistente e uma senha qualquer.
   - Esperado: o acesso é recusado com uma mensagem compreensível; o site continua funcionando.
4. Se estiver disposto a criar uma conta de teste, escolha **Cadastrar**.
5. Informe um nome de teste, um e-mail que você controle e uma senha de teste com pelo menos 6 caracteres. Envie uma vez.
   - Esperado: a conta é criada e você entra na área de treinos.
6. Abra diretamente `https://gymnotes-gg.vercel.app/workouts` em outra janela privada sem entrar.
   - Esperado: a área protegida não fica acessível; o app pede login ou volta para a tela de acesso.

> Se não quiser criar uma conta, pare aqui após o teste de acesso público e do login inválido. Os demais passos precisam de uma conta autenticada.

## 2. Navegação e uso em telas diferentes

1. Entre na conta de teste.
2. Use a navegação **Treinos**, **Nutrição** e **Feed**; confirme que cada opção abre a tela correspondente.
3. Volte à tela de treinos pelo logotipo ou pela navegação.
4. Repita em uma janela estreita ou no celular.
   - Esperado: a navegação continua acessível, os textos e botões não ficam cortados e não aparece rolagem horizontal indesejada.
5. Use Tab e Shift+Tab para percorrer os controles visíveis. Confira se o foco aparece e se os campos têm rótulos compreensíveis.

## 3. Treino, ficha e histórico

Esses passos salvam uma ficha e uma sessão na conta de teste.

1. Em **Treinos**, procure um exercício comum, por exemplo `agachamento`. Confirme que aparecem resultados.
2. Tente uma busca sem resultados. Confirme que o app informa que não encontrou exercícios e continua respondendo.
3. Selecione um exercício encontrado.
4. Em **Nome do treino**, informe `Teste GymNotes - [data de hoje]`.
5. Opcional: selecione **Criar ficha**, digite `Ficha teste - [data de hoje]` e salve. Confirme que a ficha pode ser selecionada.
6. Adicione uma série. Informe uma carga e repetições plausíveis para você; marque a série como concluída.
7. Adicione uma segunda série com valores diferentes e marque-a como concluída.
8. Teste o controle de descanso: inicie e pare o timer.
9. Se quiser que o treino apareça no Feed, marque **Compartilhar este treino no feed**.
10. Pressione **Finalizar sessão de treino** uma única vez.
    - Esperado: aparece confirmação de sessão salva; o botão não cria uma segunda sessão quando clicado novamente.
11. Confira **Histórico de treinos**. O treino recém-salvo deve aparecer com título, data, exercício e quantidade de séries.
12. Recarregue a página e confira se o treino continua no histórico.

## 4. Nutrição e refeição

Este passo registra uma refeição na conta de teste.

1. Abra **Nutrição** e anote o total de calorias mostrado antes do teste.
2. Pressione **Refeição**.
3. Busque um alimento conhecido, por exemplo `banana`; selecione um resultado e confira os dados nutricionais exibidos por 100 g.
4. Escolha um tipo de refeição e informe `100` gramas.
5. Pressione **Salvar refeição** uma vez.
   - Esperado: aparece a confirmação de refeição adicionada e o total diário é atualizado.
6. Compare o acréscimo de calorias com o valor por 100 g mostrado para o alimento. Pequenas diferenças de arredondamento são aceitáveis.
7. Abra o formulário de novo, informe menos de 1 g ou deixe o alimento sem selecionar.
   - Esperado: não é possível salvar uma refeição inválida. Cancele o formulário sem enviar.
8. Recarregue a página e confirme que o resumo continua atualizado.

## 5. Feed, curtida, comentário e compartilhamento

Os testes de interação podem gravar curtidas e comentários. Comentários publicados não devem ser considerados removíveis pelo roteiro.

1. Abra **Feed**. Se não houver atividades, volte a **Treinos** e salve uma sessão com **Compartilhar este treino no feed** marcado.
2. Volte ao Feed e confirme que a atividade compartilhada aparece com autor, data e tipo.
3. Pressione a curtida uma vez.
   - Esperado: o estado ou contador da curtida muda.
4. Pressione novamente para desfazer a curtida.
   - Esperado: o estado volta ao anterior.
5. Abra os comentários da atividade e envie um comentário curto, por exemplo `Comentário de teste [data]`.
   - Esperado: o comentário aparece na lista e o contador é atualizado.
6. Use o botão de compartilhar, se disponível no navegador.
   - Esperado: o app informa que compartilhou ou copia o link; se o navegador bloquear a ação, anote isso como resultado, sem repetir várias vezes.
7. Atualize o Feed e verifique se a atividade e o comentário continuam visíveis.

## 6. PWA e recursos públicos

1. Abra `https://gymnotes-gg.vercel.app/manifest.json`.
   - Esperado: o navegador mostra um documento JSON do GymNotes, não uma página HTML de erro.
2. Abra `https://gymnotes-gg.vercel.app/icons/icon-192x192.png` e `https://gymnotes-gg.vercel.app/icons/icon-512x512.png`.
   - Esperado: cada endereço mostra/baixa uma imagem, não uma página de erro.
3. Se o navegador oferecer **Instalar app** ou **Adicionar à tela inicial**, instale somente se quiser e abra o atalho.
   - Anote se o app abre corretamente. Se um atalho levar a uma página não encontrada, registre o endereço e marque como falha.

## 7. Sair e sessão

O roteiro técnico anterior não identificou um botão de sair na interface. Verifique se há essa opção no site. Se não houver, marque **NÃO CONSEGUI TESTAR — não encontrei opção Sair**; não limpe dados do navegador se não souber como restaurar o acesso.

Se encontrar a opção:

1. Saia da conta.
2. Tente abrir `/workouts`.
   - Esperado: o conteúdo protegido não aparece e o app pede autenticação.
3. Entre novamente com a conta de teste.

## 8. Funcionalidades sem fluxo visível no site

Não é necessário tentar criar requisições técnicas manualmente. Os pontos abaixo não têm fluxo de interface identificado no roteiro anterior; marque como **NÃO DISPONÍVEL NA INTERFACE** se não encontrar os controles:

- editar perfil, foto, biografia e metas;
- cadastrar novos alimentos;
- enviar/aceitar solicitações de amizade ou listar amigos;
- renovar sessão expirada;
- consumir notificações em tempo real.

Não use URLs de API nem altere dados pelo navegador para contornar a ausência de tela.

## Como registrar o resultado

Para cada item, anote **PASSOU**, **FALHOU** ou **NÃO CONSEGUI TESTAR**, além do resultado observado. Se falhar, registre:

- ID do teste;
- dispositivo e navegador;
- horário aproximado;
- endereço da página;
- o que você esperava e o que aconteceu;
- captura de tela sem mostrar senha, e-mail pessoal, tokens ou informações privadas.

| ID | Teste | Resultado | Observação |
|---|---|---|---|
| 1 | Acesso público e login inválido |  |  |
| 2 | Cadastro e proteção de páginas |  |  |
| 3 | Navegação desktop/celular |  |  |
| 4 | Busca de exercícios |  |  |
| 5 | Ficha e sessão de treino |  |  |
| 6 | Histórico após recarregar |  |  |
| 7 | Buscar e registrar refeição |  |  |
| 8 | Resumo nutricional após recarregar |  |  |
| 9 | Atividade no Feed |  |  |
| 10 | Curtir e desfazer curtida |  |  |
| 11 | Comentar e atualizar Feed |  |  |
| 12 | Manifest e ícones PWA |  |  |
| 13 | Instalação/atalho PWA, se disponível |  |  |
| 14 | Sair e proteção após logout, se disponível |  |  |
