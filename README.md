#APLICAÇÃO NA VERCEL
https://game-developer-challenge-dusky.vercel.app/

# Pirate Battle

Shooter naval 2D em visão superior. O jogador navega entre ilhas, atira nos navios inimigos e a partida termina quando o tempo acaba ou o navio é destruído. A arena é desenhada com PixiJS. A simulação da partida roda em TypeScript

Ranking e histórico usam Axios e TanStack Query contra APIs simuladas pelo MSW. O mock sobe junto com o aplicativo, no desenvolvimento e no build publicado. Não há variáveis de ambiente

## Setup

Requer Node.js 20 ou mais recente

```bash
npm install
npm run dev
```

O Vite abre em `http://localhost:5173`

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Sobe o jogo em desenvolvimento, com o mock. |
| `npm run build` | Verifica os tipos com `tsc -b` e gera `dist/`. |
| `npm run preview` | Serve o build de `dist/`. Rode `npm run build` antes. |
| `npm test` | Roda os testes de regras, colisão, registros e mocks com Vitest. |

A configuração usada pelo TypeScript é `tsconfig.app.json`.

## Controles

No teclado, durante a partida:

| Tecla | Ação |
| --- | --- |
| `W` ou seta para cima | Segue em frente |
| `A` e `D`, ou setas esquerda e direita | Gira |
| `Espaço` | Dispara para a frente |
| `Q` | Dispara três tiros para a esquerda |
| `E` | Dispara três tiros para a direita |
| `Esc` | Pausa |

Segurar o movimento e o disparo ao mesmo tempo funciona. Sair da aba ou perder o foco também pausa. Em **Resume** a partida continua. **Main menu** abandona a partida e não registra o resultado.

Em janela de até 768 px de largura, a partida mostra um analógico à esquerda e os botões **Fire**, **Left fire** e **Right fire** à direita.

## Opções de partida

Em **Options**:

| Campo | Padrão | Intervalo | Passo dos botões |
| --- | ---: | --- | ---: |
| Game session time | 60 s | 60 a 180, número inteiro | 10 |
| Enemy spawn time | 10 s | 5 a 30, número inteiro | 1 |

O valor também pode ser digitado. **Save** só grava um valor válido e volta ao menu. **Back** descarta a edição. A configuração fica em `localStorage`, e vale para a próxima partida e para o ranking.

## Cenários de rede

No menu, abaixo do painel, o campo **Network scenario** escolhe como o mock responde. A escolha fica em `pirate-battle-network`.

| Cenário | Efeito |
| --- | --- |
| Success | Ranking, histórico e registro da partida respondem na hora. |
| Empty | `GET /api/ranking` e `GET /api/history` voltam uma página vazia. O registro da partida 
  continua funcionando. |
| Slow | Essas respostas esperam 1,5 s. O cliente aguarda até 3 s, então a consulta ainda conclui. |
| Timeout | A resposta espera 10 s. O Axios encerra aos 3 s e a consulta falha. |
| Error | A resposta é HTTP 500. |

Consultas tentam de novo até duas vezes. O envio da partida não tenta de novo sozinho.

Para ver uma falha: escolha **Error** ou **Timeout**, abra **Ranking** ou **Match History** e espere a mensagem de erro. Volte para **Success** para consultar de novo.

**Reset records** chama `POST /api/reset`. Esse pedido sempre responde, limpa os registros confirmados e a fila de envios pendentes, e mostra **Records restored.**

## Ranking e histórico

**Ranking** lista partidas da configuração salva em Options, dez por página. A ordem é pontuação, tempo jogado, data e identificador da partida.

**Match History** lista as partidas deste navegador, da mais recente para a mais antiga, também dez por página. O jogador local é criado uma vez, com o nome **You**, em `pirate-battle-player`.

Uma partida concluída aparece como **Pending.** e depois **Saved.** ou **Could not be saved.** O botão **Try again** reenvia o mesmo registro. Um segundo envio com o mesmo `matchId` não duplica a partida. Se o envio falha, o registro permanece em `pirate-battle-pending-matches` e é tentado de novo ao reabrir o jogo.

Os registros confirmados ficam em `pirate-battle-confirmed-matches`.

## Performance

Medido no build de produção, com `npm run preview`, nesta máquina:

- Intel Core i5-7400, 4 núcleos, 3,0 GHz, 23 GB de RAM
- Monitor 3440×1440 a 85 Hz, `devicePixelRatio` 1
- Chrome 148, no navegador do Cursor
- Partida de 180 segundos, inimigo a cada 10 segundos

Um script pilotou o navio e atirou durante os três minutos. Para a amostra não acabar nos primeiros segundos, a vida inicial dessa medição foi 120, no lugar de 3. As outras regras ficaram as da partida normal. O tempo acabou com 79 de vida e 11 pontos. O pico já tinha aparecido bem antes do fim: 3 navios, contando o jogador e os inimigos vivos, e 9 projéteis.

| Medida | Valor |
| --- | ---: |
| Quadros | 15.015 |
| FPS médio | 84,7 |
| Intervalo médio | 11,8 ms |
| Percentil 95 | 11,9 ms |
| Percentil 99 | 11,9 ms |
| Maior intervalo | 35,4 ms |
| Quadros acima de 20 ms | 33 |

O alvo de 60 FPS é um quadro a cada 16,7 ms. O percentil 95 ficou em 11,9 ms. Os 84,7 FPS são o teto da tela de 85 Hz.

A memória foi outra sessão, com a vida normal de 3. Cinco ciclos de entrar, jogar cerca de 20 segundos e voltar ao menu. O heap foi lido depois de forçar a coleta de lixo.

| Momento | Heap JS |
| --- | ---: |
| Menu, antes de jogar | 3,8 MB |
| Depois do primeiro ciclo | 6,3 MB |
| Depois do quinto ciclo | 6,5 MB |

O primeiro ciclo sobe porque as imagens da partida ficam decodificadas. Os quatro seguintes acrescentaram cerca de 0,1 MB. Nós do DOM e listeners ficaram iguais. Não houve crescimento contínuo ao sair da partida.

A medição é de um computador só, no navegador embutido, e a vida usada nos três minutos não é a da partida normal.
