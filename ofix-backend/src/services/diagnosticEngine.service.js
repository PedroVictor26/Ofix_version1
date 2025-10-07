// Simple heuristic diagnostic engine
const COMMON_ISSUES = [
  { id: 'brake_pads_worn', title: 'Desgaste nas pastilhas de freio', symptoms: ['barulho', 'chiado', 'freio', 'rangido'], procedures: ['Verificar espessura das pastilhas', 'Inspecionar disco por ranhuras'], category: 'freios' },
  { id: 'engine_oil_change', title: 'Necessidade de troca de óleo', symptoms: ['óleo', 'oleo', 'luz do óleo', 'manutenção'], procedures: ['Verificar nível e cor do óleo', 'Checar quilometragem desde a última troca'], category: 'motor' },
  { id: 'alignment_needed', title: 'Alinhamento necessário', symptoms: ['pneu', 'desgaste irregular', 'puxa'], procedures: ['Verificar geometria da suspensão', 'Checar pressão dos pneus'], category: 'rodas' }
];

class DiagnosticEngine {
  scoreBySymptoms(inputSymptoms = []) {
    const norm = (s) => String(s || '').toLowerCase();
    const tokens = inputSymptoms.map(norm);
    const results = COMMON_ISSUES.map(issue => {
      const matches = issue.symptoms.filter(trig => tokens.some(t => t.includes(trig))).length;
      const score = Math.min(1, matches / Math.max(1, issue.symptoms.length));
      return { id: issue.id, title: issue.title, score, procedures: issue.procedures, category: issue.category };
    }).filter(r => r.score > 0);
    return results.sort((a, b) => b.score - a.score).slice(0, 5);
  }

  similarSolutionsHistory(inputSymptoms = [], vehicle = {}) {
    const scored = this.scoreBySymptoms(inputSymptoms);
    return scored.map((r, i) => ({
      id: `case_${i + 1}`,
      problema: r.title,
      procedimentosAplicados: r.procedures,
      sucesso: 0.85 - i * 0.1,
      veiculo: vehicle?.model || 'n/d',
      data: new Date(Date.now() - (i + 1) * 86400000).toISOString()
    }));
  }
}

const diagnosticEngine = new DiagnosticEngine();
export default diagnosticEngine;
