
export interface ParsedReport {
  executiveSummary: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  detailedAnalysis: {
    image?: string;
    audio?: string;
    text?: string;
    document?: string;
  };
  reasoning: {
    observations: string;
    possibilities: string;
    limitations: string;
  };
  recommendations: string[];
  redFlags: string[];
  careAdvice: string;
  doctorSummary: string;
}

const cleanText = (text?: string): string | undefined => {
  if (!text) return undefined;
  const t = text.trim();
  if (t.match(/^(N\/A|None|Not provided|No .* provided\.?)$/i)) return undefined;
  return t;
};

export const parseHealthReport = (markdown: string): ParsedReport => {
  // Regex updated to be language agnostic. 
  const sections = {
    summary: /###\s*1\.\s*[^\n]*\s*([\s\S]*?)(?=###\s*2|$)/i,
    details: /###\s*2\.\s*[^\n]*\s*([\s\S]*?)(?=###\s*3|$)/i,
    reasoning: /###\s*3\.\s*[^\n]*\s*([\s\S]*?)(?=###\s*4|$)/i,
    recommendations: /###\s*4\.\s*[^\n]*\s*([\s\S]*?)(?=###\s*5|$)/i,
    redFlags: /###\s*5\.\s*[^\n]*\s*([\s\S]*?)(?=###\s*6|$)/i,
    careAdvice: /###\s*6\.\s*[^\n]*\s*([\s\S]*?)(?=###\s*7|$)/i,
    doctorSummary: /###\s*7\.\s*[^\n]*\s*([\s\S]*?)(?=$)/i,
  };

  const extract = (regex: RegExp) => {
    const match = markdown.match(regex);
    return match ? match[1].trim() : '';
  };

  // 1. Extract Summary & Risk
  const summaryRaw = extract(sections.summary);
  let riskLevel: ParsedReport['riskLevel'] = 'Medium';
  const lowerSummary = summaryRaw.toLowerCase();
  
  if (lowerSummary.includes('high') || lowerSummary.includes('élevé')) riskLevel = 'High';
  else if (lowerSummary.includes('low') || lowerSummary.includes('faible') || lowerSummary.includes('bas')) riskLevel = 'Low';

  // 2. Extract Detailed Analysis (Sub-parsing)
  const detailsRaw = extract(sections.details);
  const detailedAnalysis: ParsedReport['detailedAnalysis'] = {};
  
  const extractDetail = (key: string) => {
    // Matches "* **Key:**" or "* **Key :**" or "- **Key:**"
    const regex = new RegExp(`[\\*\\-]\\s*\\*\\*${key}.*?:?\\*\\*\\s*([\\s\\S]*?)(?=[\\*\\-]\\s*\\*\\*|$)`, 'i');
    const match = detailsRaw.match(regex);
    return cleanText(match ? match[1].trim() : undefined);
  };
  
  // Updated keys based on new prompt
  detailedAnalysis.image = extractDetail('Visual Analysis') || extractDetail('Image');
  detailedAnalysis.audio = extractDetail('Audio Analysis') || extractDetail('Audio');
  detailedAnalysis.text = extractDetail('Text Analysis') || extractDetail('Text');
  detailedAnalysis.document = extractDetail('Document Insights') || extractDetail('Document');

  // 3. Reasoning
  const reasoningRaw = extract(sections.reasoning);
  const reasoning = {
    observations: extractDetail('Key Observations') || reasoningRaw.match(/\*\s*\*\*Key Observations\s*:?\*\*\s*([\s\S]*?)(?=\*\s*\*\*|$)/i)?.[1].trim() || '',
    possibilities: extractDetail('Possibilities') || reasoningRaw.match(/\*\s*\*\*Possibilities\s*:?\*\*\s*([\s\S]*?)(?=\*\s*\*\*|$)/i)?.[1].trim() || '',
    limitations: extractDetail('Limitations') || reasoningRaw.match(/\*\s*\*\*Limitations\s*:?\*\*\s*([\s\S]*?)(?=\*\s*\*\*|$)/i)?.[1].trim() || '',
  };

  // 4. Recommendations
  const recsRaw = extract(sections.recommendations);
  const recommendations = recsRaw
    .split('\n')
    .map(line => line.replace(/^[\*\-]\s*/, '').trim())
    .filter(line => line.length > 0);

  // 5. Red Flags
  const flagsRaw = extract(sections.redFlags);
  const redFlags = flagsRaw
    .split('\n')
    .filter(line => !line.toLowerCase().includes('none identified') && !line.toLowerCase().includes('aucune') && !line.toLowerCase().includes('no urgent warning')) 
    .map(line => line.replace(/^[\*\-]\s*/, '').trim())
    .filter(line => line.length > 0);

  // 6 & 7 direct extraction
  const careAdvice = extract(sections.careAdvice);
  const doctorSummary = extract(sections.doctorSummary);

  return {
    executiveSummary: summaryRaw,
    riskLevel,
    detailedAnalysis,
    reasoning,
    recommendations,
    redFlags,
    careAdvice,
    doctorSummary
  };
};
