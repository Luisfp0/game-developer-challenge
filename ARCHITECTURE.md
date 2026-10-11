# Arquitetura
## Mapa

| Pasta | Responsabilidade |
| --- | --- |
| `src/App.tsx` | Troca a fase da interface e publica o resultado da partida |
| `src/pages` | Telas: menu, opções, partida e o diário (ranking e histórico) |
| `src/components` | Peças de interface e o canvas do PixiJS |
| `src/game` | Regras puras: simulação, colisão, tiro lateral, spawn, opções, registros e fila pendente |
| `src/api/matches.ts` | Cliente HTTP. Axios, base `/api`, timeout de 3 segundos |
| `src/mocks` | Service worker, cenários de rede, registros confirmados e jogadores de exemplo |
| `src/hooks` | Teclado e toque. |

## React e PixiJS

O React é a casca. `App` guarda uma fase: `menu`, `options`, `ranking`, `history`, `playing` ou `result`. Só uma tela fica montada. Pontuação e tempo restante também ficam no React, porque o HUD é HTML.

A arena é o `GameCanvas`. Ele cria um `Application` do PixiJS, carrega as imagens e desenha água, ilhas, navios, tiros, barra de vida, chamas e explosões. A posição de cada sprite sai do retrato da simulação. O React não guarda essa posição.

O retrato sobe para o React por `onSnapshot`. A simulação só avisa quando muda a fase, a pontuação, a vida ou o segundo inteiro que ainda falta. Um quadro em que o navio apenas andou não redesenha o React. O HUD mostra o segundo arredondado para cima, então o número não pisca a cada fração.

Quando a fase do retrato vira `result` e há um motivo (`time` ou `destroyed`), o `App` publica o registro uma vez e troca para a tela de resultado. O canvas sai da árvore e o efeito de limpeza destrói o `Application`.

O PixiJS usa coordenadas lógicas de 1024×768. A resolução do canvas é `devicePixelRatio`, com `autoDensity`. O CSS encaixa esse retângulo na janela sem cortar e sem esticar: se a janela é mais larga que a arena, sobra faixa nas laterais; se é mais alta, sobra em cima e embaixo. Um `ResizeObserver` refaz esse encaixe. A simulação continua em 1024×768.

## Ciclo da simulação

`createMatch` monta o estado e devolve `snapshot`, `update` e `subscribe`. O estado fica fechado dentro da função. Quem está de fora só vê o retrato.

Cada quadro do Pixi faz o seguinte:

1. Mede quantos segundos passaram desde o quadro anterior.
2. Se a partida está pausada, ou se a aba está oculta, esse intervalo vira zero e o quadro acaba.
3. `update` recebe o intervalo e os controles segurados naquele momento.
4. O desenho lê o retrato novo e move os sprites.

Pausar, apertar `Esc`, perder o foco da janela ou esconder a aba ligam a pausa. Os controles são soltos. **Resume** continua do mesmo ponto. **Main menu** desmonta a partida e não publica registro.

Dentro de `update`, se a fase já não é `playing`, nada muda. Enquanto é `playing`:

1. O relógio da partida desconta o intervalo inteiro. Se chegou a zero, a partida acaba por `time` e o quadro para.
2. Movimento e rotação usam no máximo 0,05 segundo desse intervalo. Um quadro muito longo atrasa o navio em relação ao relógio.
3. O jogador gira, anda para a frente e, se a arma está livre, dispara.
4. Cada inimigo vivo aponta para o jogador. Perseguidor sempre anda. Atirador anda só quando está fora do alcance. Dentro do alcance, espera o intervalo e dispara um tiro.
5. Os tiros andam. Quem sai da arena, bate na areia ou acerta um casco é removido.
6. Se a vida do jogador chega a zero, a partida acaba por `destroyed`.
7. Um perseguidor que encosta no jogador causa dano de abalroamento e ele mesmo afunda.
8. O relógio de spawn acumula o intervalo inteiro. Cada vez que passa do intervalo configurado, nasce um inimigo, alternando atirador e perseguidor.

A partida já começa com um perseguidor. Os seguintes só entram se houver um ponto de spawn longe do jogador, longe dos outros navios e fora das ilhas. Se nenhum ponto serve naquele instante, o nascimento daquele ciclo é pulado.

Os controles do teclado e do toque são um objeto de booleanos: frente, esquerda, direita, tiro frontal, tiro esquerdo e tiro direito. Os dois conjuntos são unidos com OU. Segurar movimento e tiro ao mesmo tempo vale. O teclado só escuta eventos enquanto a página da partida está montada.

Rotação zero aponta para cima. A frente é `(sin(rotação), -cos(rotação))`.

## Colisões

Navio e tiro são círculos. O raio do navio é 28. O do tiro é 6.

A arena segura o centro do navio entre o raio e a borda. Ele não atravessa para fora dos 1024×768.

Cada ilha é um retângulo de cantos arredondados. O raio do canto é um tile, 64 pixels. Um círculo encosta na ilha quando a distância até o miolo arredondado é menor ou igual ao raio do canto mais o raio do círculo.

Andar contra a areia não zera a velocidade. O passo tenta a posição nova. Se ela está dentro da areia, o navio é empurrado para fora pelo caminho mais curto e o movimento continua no eixo que ainda está livre. O mesmo vale para o inimigo, que ainda guarda de que lado contornou o obstáculo para não ficar oscilando na quina.

Tiro do jogador só fere inimigo que já estava vivo no começo daquele quadro. Assim dois tiros no mesmo quadro não contam duas mortes no mesmo casco. A pontuação sobe 1 quando a vida de um inimigo passa de positiva para zero por tiro do jogador. O abalroamento afunda o perseguidor sem dar ponto.

Tiro inimigo só fere o jogador. Tiro não fere tiro.

## Armas

| Arma | Tiros | Direção |
| --- | ---: | --- |
| Frontal | 1 | Para a frente do navio |
| Esquerda | 3 | Perpendiculares, espaçados de 16 pixels ao longo do casco |
| Direita | 3 | O outro bordo |

Uma arma só dispara de novo quando o cooldown de 0,45 segundo acabou e não resta nenhum tiro dela no ar. O tiro lateral, portanto, espera os três projéteis sumirem. O cano fica 8 pixels à frente do raio do casco. A velocidade do tiro é 320 pixels por segundo. Não há um timer separado de alcance: o tiro vive até sair da arena, bater na areia ou acertar um casco.

O atirador inimigo usa um cooldown próprio de 1,2 segundo e um único tiro, na direção em que está olhando.

## Recursos

O canvas só começa a simular depois que as imagens carregam. O carregamento mostra `loaded of total`. Se uma imagem falha, a partida volta ao menu com o erro. Se o componente desmonta no meio do carregamento, a bandeira `alive` impede desenhar ou avisar uma tela que já saiu.

As URLs das imagens são estáticas, com `new URL(..., import.meta.url)`, para o Vite incluí-las no build.

Ao desmontar, o efeito desliga o `ResizeObserver`, tira o quadro do ticker, cancela o atraso da explosão final e chama `app.destroy` removendo a view e os filhos. A partida seguinte cria outro `Application`. A chave `matchKey` sobe a cada **Play**, então um canvas antigo não é reaproveitado.

Barra de vida, chamas e explosão são desenho. A barra usa o recorte opaco do navio para não medir a caixa transparente da textura. A explosão do fim, quando a morte é por destruição, segura o retrato por uma fração de segundo antes de entregar o resultado ao React, para o sprite de explosão aparecer.

## Persistência local

Tudo fica no `localStorage` deste navegador. Não há conta nem servidor próprio.

| Chave | Conteúdo |
| --- | --- |
| `pirate-battle-player` | `{ id, name: "You" }`. O id nasce com `crypto.randomUUID` na primeira visita. |
| `pirate-battle-options` | Segundos da sessão e do spawn. Padrão 60 e 10. |
| `pirate-battle-network` | Cenário do mock: `success`, `empty`, `slow`, `timeout` ou `error`. |
| `pirate-battle-confirmed-matches` | Registros que o mock já aceitou. |
| `pirate-battle-pending-matches` | Registros cujo envio ainda não foi confirmado. |
| `pirate-battle-history-migrated` | `"1"` depois que o histórico antigo foi copiado uma vez. |
| `pirate-battle-last-match` | Formato anterior, de uma partida só. Continua no código por causa da migração. |

Opções aceitam sessão inteira de 60 a 180, de 10 em 10 pelos botões, e spawn inteiro de 5 a 30, de 1 em 1. O campo também aceita número digitado. **Save** só grava se os dois valores passam na validação, e então volta ao menu. **Back** descarta o que não foi salvo. A próxima partida e o ranking leem o que está gravado.

Na primeira abertura, se ainda existir histórico no formato antigo, cada entrada vira um registro confirmado com um `matchId` novo, o jogador local e o nome **You**. A cópia roda uma vez.

JSON inválido nessas chaves vira lista vazia ou, no jogador, um id novo. Uma falha de `setItem` não derruba a tela.

## Contrato do ranking e do histórico

O cliente fala com quatro rotas. No desenvolvimento e no build publicado quem responde é o MSW, no service worker de `public/mockServiceWorker.js`. O aplicativo pinta primeiro e só então inicia o worker. Se o worker falha, o erro vai para o console e o menu continua no ar. Pedidos que o mock não reconhece seguem para a rede (`bypass`).

| Método e rota | Papel |
| --- | --- |
| `GET /api/ranking` | Página do ranking da configuração pedida. |
| `GET /api/history` | Página do histórico de um jogador. |
| `POST /api/matches` | Confirma um registro. O mesmo `matchId` não cria outro. |
| `POST /api/reset` | Apaga os registros confirmados. Responde 204. |

Consulta de ranking:

```
GET /api/ranking?matchSeconds=60&spawnIntervalSeconds=10&page=1
```

Consulta de histórico:

```
GET /api/history?playerId=<id local>&page=1
```

As duas respostas têm a mesma forma:

```json
{
  "items": [],
  "page": 1,
  "pageSize": 10,
  "total": 0
}
```

Cada item é um registro:

| Campo | Tipo | Regra |
| --- | --- | --- |
| `matchId` | string | Identidade da partida. Gerado no cliente antes do `POST`. |
| `playerId` | string | Jogador local, ou um id dos exemplos. |
| `playerName` | string | Neste navegador, `You`. |
| `playedAt` | string | Data ISO do fim da partida. |
| `score` | inteiro | Pontos, zero ou mais. |
| `timePlayedSeconds` | número | Tempo jogado, zero ou mais. |
| `endReason` | `time` ou `destroyed` | Acabou o tempo, ou o navio afundou. |
| `matchSeconds` | inteiro | Configuração da sessão, de 60 a 180. |
| `spawnIntervalSeconds` | inteiro | Configuração do spawn, de 5 a 30. |

Um corpo que não passa nisso recebe 400. Um `matchId` que já existe devolve o registro guardado e não grava de novo.

O ranking filtra pela configuração pedida, não por jogador. A ordem é: mais pontos, depois mais tempo jogado, depois data mais antiga, depois `matchId` crescente. Dez por página.

O histórico filtra pelo `playerId` e ignora a configuração. A ordem é a data mais recente primeiro e, no empate, `matchId`. Também dez por página.

Os exemplos Ann até Lee são partidas de 60 segundos com spawn de 10, pontos de 12 até 1. Mo é uma partida de 90 segundos com spawn de 15, então só aparece no ranking quando as opções estão nessa configuração. Exemplos e registros confirmados se somam. Se um confirmado repetir o `matchId` de um exemplo, fica o confirmado.

O cenário de rede, escolhido no menu, muda a resposta do mock:

| Cenário | Efeito |
| --- | --- |
| `success` | Responde na hora. |
| `empty` | Os dois `GET` voltam uma página vazia. O `POST` da partida continua valendo. |
| `slow` | Espera 1,5 segundo. O cliente aguarda até 3, então a consulta ainda conclui. |
| `timeout` | Espera 10 segundos. O Axios corta aos 3 e a consulta falha. |
| `error` | HTTP 500. |

`POST /api/reset` não passa por esse atraso nem por esse erro. Ele sempre limpa os confirmados. O cliente, em seguida, apaga a fila pendente.

## Cache

O TanStack Query guarda ranking e histórico na memória da aba. A chave do ranking é `['ranking', matchSeconds, spawnIntervalSeconds, page]`. A do histórico é `['history', playerId, page]`. Trocar as opções ou a página é outra entrada de cache.

Consulta tenta de novo até duas vezes e refaz ao focar a janela. O `AbortSignal` da query segue para o Axios, então sair da tela cancela o pedido antigo. Enquanto a página nova carrega, a anterior permanece na tabela (`keepPreviousData`). A aba que não está visível não busca.

Mutação não tenta de novo sozinha. Quando um registro é confirmado, ou quando o reset termina, as chaves `ranking` e `history` são invalidadas e as duas listas buscam de novo. Trocar o cenário de rede invalida tudo.

O cache não sobrevive a um reload. O que sobrevive é o `localStorage`.

## Partidas pendentes

Sair da pausa pelo **Main menu** não cria registro. Uma partida que chega ao fim cria um registro novo, com `matchId` novo, e faz duas coisas antes de esperar a rede: grava na fila `pirate-battle-pending-matches` e mostra **Pending.**

O `POST` então segue. Se responde, o registro sai da fila, a tela mostra **Saved.** e as duas listas são invalidadas. Se falha ou estoura o timeout, o registro continua na fila e a tela mostra **Could not be saved.** **Try again**, ainda nessa tela, reenvia o mesmo objeto, com o mesmo `matchId`.

A fila deduplica por `matchId`. Um segundo enfileiramento do mesmo id substitui o anterior em vez de repetir.

Depois de um reload, a tela de resultado não volta. A fase inicial é o menu. A fila continua no `localStorage`. Em **Match History**, os itens ainda pendentes aparecem numa tabela própria, cada um com **Try again**. Não há reenvio automático na abertura. Quando uma página do histórico já traz aquele `matchId`, ele sai da fila, porque o mock já o confirmou.

Uma falha de rede não bloqueia **Play**, opções nem o combate. O jogo segue local. O registro espera o próximo envio manual.

## Balanceamento

Os números vivem em `src/constants/gameConfig.ts`.

| Escolha | Valor | Efeito |
| --- | ---: | --- |
| Vida do jogador | 3 | Três tiros inimigos, ou um abalroamento, afundam o navio. |
| Vida do inimigo | 2 | Dois tiros do jogador. |
| Dano do tiro | 1 | |
| Dano do abalroamento | 3 | O perseguidor que encosta resolve a partida se a vida ainda estava cheia. |
| Velocidade do jogador | 140 px/s | Mais rápido que o inimigo. Dá para abrir distância se a proa já aponta para longe. |
| Velocidade do inimigo | 90 px/s | |
| Rotação | 2,2 rad/s | Uma meia-volta leva cerca de 1,4 segundo. Virar tarde demais deixa o perseguidor cortar caminho. |
| Velocidade do tiro | 320 px/s | Cruza a arena em poucos segundos. |
| Alcance do atirador | 256 px | Fora disso ele se aproxima. Dentro, para e atira. |
| Cooldown do jogador | 0,45 s | Ainda precisa do tiro anterior ter sumido. |
| Cooldown do atirador | 1,2 s | |
| Distância mínima do spawn | 384 px do jogador, 128 px de outro navio | Evita nascer em cima do jogador. |
| Sessão e spawn padrão | 60 s e 10 s | Uma partida curta, com um nascimento a cada dez segundos, mais o perseguidor inicial. |

O jogador ser mais rápido que o inimigo é o que torna uma partida de três minutos jogável: a fuga depende de já estar apontando para o lado livre, porque a rotação é lenta. O abalroamento em 3 de dano faz o contato com o perseguidor ser letal de propósito. A pontuação conta navio afundado por tiro, não tempo sobrevivido, então fugir sem atirar termina com zero.

## Limitações

- Não há áudio. Os arquivos em `assets/sounds` não entram na partida.
- Não há backend. Ranking e histórico existem enquanto o service worker deste navegador está ativo.
- A fila pendente não é reenviada sozinha depois de um reload. O reenvio é o botão na tela de resultado, na mesma visita, ou o botão em **Match History** depois.
- O relógio da partida desconta o quadro inteiro, e o movimento usa no máximo 0,05 segundo. Um travamento longo faz o tempo cair mais do que o navio anda.
- A medição de performance feita para o README usou um piloto automático e, naquela amostra, vida inicial maior que 3, para a partida cobrir os 180 segundos. A partida que o jogador abre usa os números desta página.
