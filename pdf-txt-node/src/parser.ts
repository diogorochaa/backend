import fs from "fs";
import pdf from "pdf-parse";

const INPUT = "./input.pdf";
const OUTPUT = "./saida.txt";

type TipoLancamento = "C" | "D";

interface Lancamento {
  fornecedor: string;
  conta: number;
  plano: number;
  valor: number;
  tipo: TipoLancamento;
}

function normalizeValor(valor: string): number {
  return Number(valor.replace(/\./g, "").replace(",", "."));
}

function extrairFornecedor(linhas: string[], index: number): string {
  const atual = linhas[index] || "";
  const partes = atual.split(/\bde\b/i);
  let fornecedor = (partes.slice(1).join("de") || atual).trim();

  let i = index + 1;
  while (i < linhas.length) {
    const linha = linhas[i].trim();
    if (
      /^([JD]?)[A-Z0-9-]*\d{3}\s*-\s*/.test(linha) ||
      /^\d{2}\/\d{2}\/\d{4}/.test(linha)
    ) {
      break;
    }
    fornecedor += ` ${linha}`;
    i++;
  }

  return fornecedor.replace(/\s+/g, " ").trim();
}

function detectarTipo(prefixo: string, plano: number): TipoLancamento {
  if (prefixo === "D") return "D";
  if (prefixo === "J") return "C";

  if (plano === 227) return "D";
  if (plano === 222) return "D";

  return "C";
}

function parsePDFText(text: string): Lancamento[] {
  const linhas = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  let fornecedorAtual = "";
  const lancamentos: Lancamento[] = [];

  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i];

    if (linha.includes("REC.") && linha.includes("de")) {
      fornecedorAtual = extrairFornecedor(linhas, i);
      continue;
    }

    const match = linha.match(/^([JD]?)([A-Z0-9-]+?)(\d{3})\s*-\s*(.+)$/);

    if (!match) continue;

    const [, prefixo, contaRaw, planoStr, restoInicial] = match;
    const contaStr = contaRaw.replace(/\D/g, "") || "0";
    let descricao = restoInicial;
    let valorStr = "";

    const valorNaMesmaLinha = descricao.match(/(-?\d[\d.,]*)$/);
    if (valorNaMesmaLinha) {
      valorStr = valorNaMesmaLinha[1];
      descricao = descricao.slice(0, descricao.length - valorStr.length).trim();
    } else {
      let j = i + 1;
      while (j < linhas.length) {
        const prox = linhas[j].trim();
        if (/^-?\d[\d.,]*$/.test(prox)) {
          valorStr = prox;
          i = j;
          break;
        }
        if (
          /^([JD]?)[A-Z0-9-]*\d{3}\s*-\s*/.test(prox) ||
          prox.includes("REC.") ||
          /^\d{2}\/\d{2}\/\d{4}/.test(prox)
        ) {
          break;
        }
        descricao += ` ${prox}`;
        i = j;
        j++;
      }
    }

    if (!valorStr) continue;

    const conta = Number(contaStr);
    const plano = Number(planoStr);
    const valor = normalizeValor(valorStr);
    const tipo = detectarTipo(prefixo, plano);

    lancamentos.push({
      fornecedor: fornecedorAtual,
      conta,
      plano,
      valor,
      tipo,
    });
  }

  return lancamentos;
}

function gerarLinha(
  id: number,
  tipo: TipoLancamento,
  conta: number,
  valor: number,
  historico: string,
): string {
  return `00;;;01062025;${id};${tipo};${conta};;${valor.toFixed(
    2,
  )};0;2;1;${historico};;;;;;;`;
}

function gerarTXT(lancamentos: Lancamento[]): string {
  let id = 900000;
  const linhas: string[] = [];

  for (const l of lancamentos) {
    linhas.push(gerarLinha(id--, "D", l.plano, l.valor, l.fornecedor));

    linhas.push(gerarLinha(id--, "C", 250, l.valor, l.fornecedor));
  }

  return linhas.join("\n");
}

async function main() {
  const buffer = fs.readFileSync(INPUT);
  const data = await pdf(buffer);

  const lancamentos = parsePDFText(data.text);

  console.log("Lançamentos encontrados:", lancamentos.length);

  const txt = gerarTXT(lancamentos);

  fs.writeFileSync(OUTPUT, txt);

  console.log("Arquivo gerado:", OUTPUT);
}

main().catch(console.error);
