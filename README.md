Documentação do Projeto: Calculadora de Salário Líquido
Autor: João Murat
Versão: 1.0
Data: 27 de Agosto de 2025

1. Visão Geral do Projeto
Este projeto consiste em uma calculadora de salário líquido interativa, desenvolvida como uma aplicação web single-page. A ferramenta permite que funcionários simulem seus ganhos mensais com base em uma variedade de vencimentos e descontos, seguindo as regras da CLT e permitindo a customização de diversas variáveis para se adaptar a diferentes contratos de trabalho.

O objetivo principal é oferecer uma ferramenta transparente, educativa e flexível para o cálculo de holerites.

2. Estrutura dos Arquivos
O projeto é composto por três arquivos principais, separando estrutura, estilo e lógica, conforme as boas práticas de desenvolvimento web:

index.html: Responsável pela estrutura semântica da página. Contém todos os elementos da interface, como campos de entrada (inputs), botões e áreas de exibição de resultados.

style.css: Contém todas as regras de estilização visual da aplicação. É responsável pelo layout, cores, fontes, responsividade para dispositivos móveis e a aparência dos componentes interativos, como o modal de resumo e os tooltips.

script.js: O cérebro da aplicação. Contém toda a lógica de programação, incluindo a captura dos dados inseridos pelo usuário, a execução de todos os cálculos de vencimentos e descontos, a manipulação da interface para exibir os resultados em tempo real e a funcionalidade dos botões (gerar resumo, limpar, imprimir, etc.).

3. Funcionalidades Implementadas
A calculadora possui um conjunto robusto de funcionalidades para garantir precisão e flexibilidade:

Seleção de Carga Horária: O usuário pode escolher entre as jornadas de trabalho mais comuns (44h, 40h, 36h, etc.), e o sistema ajusta automaticamente o divisor de horas para o cálculo correto do valor/hora.

Percentual de Hora Extra Customizável: Permite ao usuário definir o percentual exato de hora extra (mínimo de 50%) utilizado pela sua empresa, refletindo o cálculo em todas as verbas dependentes.

Cálculo de Adicional Noturno: Inclui campos para horas noturnas e horas extras noturnas, com percentual customizável (padrão 20%), calculando corretamente o valor adicional sobre a hora extra.

Cálculo de Bonificação: Uma seção dedicada para o cálculo de bônus (baseado no exemplo de treinamento), que é somado ao salário bruto mas, por ser uma verba indenizatória, não incide no cálculo do DSR.

Descontos Dinâmicos: Além dos descontos fixos, o usuário pode adicionar múltiplos "Outros Descontos", especificando a descrição e o valor de cada um.

Cálculo de DSR Detalhado: O sistema calcula o Descanso Semanal Remunerado com base em todas as verbas variáveis (horas extras e adicional noturno), exigindo que o usuário informe os dias úteis e de descanso do mês para precisão.

Resumo Detalhado (Holerite): Gera um relatório completo em um modal, detalhando todos os vencimentos, descontos, bases de cálculo e informações sobre as faixas de impostos.

Impressão e PDF: O resumo gerado pode ser facilmente impresso ou salvo como PDF através da funcionalidade nativa do navegador.

Limpeza de Campos: Um botão permite resetar todos os campos do formulário para uma nova simulação sem a necessidade de recarregar a página.

Tooltips Informativos: Ícones de informação (i) acompanham os campos mais complexos, oferecendo explicações sobre os conceitos e a lógica de cálculo ao passar o mouse.

Otimização Mobile: A interface é totalmente responsiva e os campos numéricos ativam o teclado numérico em dispositivos móveis para melhor usabilidade.

4. Regras de Negócio e Lógica dos Cálculos
Esta seção detalha as fórmulas e tabelas utilizadas no script.js para chegar ao resultado final.

4.1. Valor da Hora Normal
É a base para quase todos os outros cálculos.

Fórmula: Valor Hora = Salário Base / Divisor da Carga Horária

Exemplo (Jornada de 200h): R$ 3000,00 / 200 = R$ 15,00 por hora

4.2. Horas Extras e Adicional Noturno
Valor da Hora Extra Diurna: Valor Hora Normal * (1 + Percentual HE / 100)

Valor do Adicional Noturno (sobre horas normais): Qtd Horas Noturnas * Valor Hora Normal * (Percentual Ad. Noturno / 100)

Valor da Hora Extra Noturna: A lógica combina os dois adicionais. Primeiro, calcula-se o valor da hora noturna e, sobre este, aplica-se o percentual da hora extra.

Valor Hora Noturna = Valor Hora Normal * (1 + Percentual Ad. Noturno / 100)

Valor HE Noturna = Valor Hora Noturna * (1 + Percentual HE / 100)

4.3. Bonificação (Ex-Comissão)
Calculada com base no exemplo de treinamento, sem incidir no DSR.

Fórmula: (Valor Total Treinamento / Duração Total) * 10% * Suas Horas de Treinamento

Exemplo: (R$ 2000 / 4h) * 0.10 * 2h = R$ 100,00

4.4. DSR sobre Verbas Variáveis
Base de Cálculo: Soma de (Valor HE Diurna + Valor Ad. Noturno + Valor HE Noturna)

Fórmula: (Base de Cálculo DSR / Dias Úteis no Mês) * (Domingos e Feriados no Mês)

4.5. Salário Bruto (Total de Vencimentos)
É a soma de todas as verbas, salariais e indenizatórias.

Fórmula: Salário Base + Todas as HE + Ad. Noturno + Bonificação + DSR

4.6. Desconto de INSS
Calculado sobre o Salário Bruto, usando a tabela progressiva com parcela a deduzir.
Tabela de Referência (2025):
| Salário Bruto (R$)      | Alíquota | Parcela a Deduzir (R$) |
| ----------------------- | -------- | ---------------------- |
| Até 1.518,00            | 7,5%     | -                      |
| De 1.518,01 a 2.793,88  | 9%       | 22,77                  |
| De 2.793,89 a 4.190,83  | 12%      | 106,59                 |
| De 4.190,84 a 8.157,41  | 14%      | 190,40                 |
| Acima de 8.157,41       | Teto     | R$ 951,62 (fixo)       |

4.7. Desconto de IRRF
Calculado sobre a Base de Cálculo do IRRF, que é Salário Bruto - Desconto do INSS.
Tabela de Referência (2025):
| Base de Cálculo IRRF (R$) | Alíquota | Parcela a Deduzir (R$) |
| ------------------------- | -------- | ---------------------- |
| Até 2.428,80              | Isento   | -                      |
| De 2.428,81 a 2.826,65    | 7,5%     | 182,16                 |
| De 2.826,66 a 3.751,05    | 15%      | 394,16                 |
| De 3.751,06 a 4.664,68    | 22,5%    | 675,49                 |
| Acima de 4.664,68         | 27,5%    | 908,73                 |

5. Publicação (Deploy)
A aplicação foi projetada para ser hospedada gratuitamente na plataforma Vercel. O processo de publicação e atualização é contínuo e automatizado através da integração com um repositório GitHub.

Publicação Inicial: Os arquivos do projeto são enviados para um repositório no GitHub, que é então importado pela Vercel para o deploy inicial.

Atualizações: Qualquer alteração nos arquivos (commit) enviada para a branch principal do repositório no GitHub aciona um novo deploy automático na Vercel, atualizando o site em produção em poucos minutos.
