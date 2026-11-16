import type { AiInput, AiOutput, AiProvider } from './ai-provider.ts';

function findIncomeDifferences(input: AiInput): AiOutput['findings'] {
  const findings: AiOutput['findings'] = [];
  if (input.declaredIncome !== input.documentIncome) {
    findings.push({
      note: 'ప్రకటించిన ఆదాయం మరియు పత్రంలోని ఆదాయం సరిపోలడం లేదు.',
      evidence: 'documentIncome',
    });
  }
  if (input.fieldReport && input.fieldReport.annualIncome !== input.declaredIncome) {
    findings.push({
      note: 'క్షేత్ర నివేదిక ఆదాయం మరియు ప్రకటించిన ఆదాయం మధ్య తేడా ఉంది.',
      evidence: 'fieldReport.annualIncome',
    });
  }
  return findings;
}

// Explicit demo adapter. These are deterministic examples, not generated AI results.
export const mockProvider: AiProvider = {
  name: 'mock',
  async generate(input) {
    if (input.feature === 'report') {
      return {
        summary: 'నమూనా ముసాయిదా మాత్రమే. ఆదాయం, కుటుంబ వివరాలను స్వయంగా నిర్ధారించండి.',
        findings: [{ note: 'మీ గమనికలు నివేదికలో చేర్చబడ్డాయి.', evidence: 'officerNotes' }],
        report: {
          annualIncome: input.declaredIncome,
          familyMembers: 1,
          occupation: 'నిర్ధారించాలి',
          notes: input.officerNotes || 'క్షేత్ర విచారణ వివరాలు నమోదు చేయాలి.',
        },
      };
    }
    return {
      summary:
        input.feature === 'brief'
          ? 'ప్రకటించిన ఆదాయం ₹' +
            input.declaredIncome +
            '. పత్రంలోని ఆదాయం ₹' +
            input.documentIncome +
            '. క్షేత్ర నివేదిక ఆదాయం ₹' +
            (input.fieldReport?.annualIncome ?? 'నమోదు కాలేదు') +
            '. ఆధారాలు పరిశీలించి నిర్ణయం తీసుకోండి.'
          : 'ఆదాయ వివరాల పోలిక పూర్తయింది. సూచించిన తేడాలను ఆధారాలతో నిర్ధారించండి.',
      findings: findIncomeDifferences(input),
      report: null,
    };
  },
};
