
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

export const parseHealthReport = (markdown: string): ParsedReport => {
  // Regex updated to be language agnostic. 
  // It looks for "### 1." followed by any text until a newline, then captures everything until "### 2"
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
  // Detect risk level based on keywords in multiple languages (English/French)
  // Default to 'Medium' (Precautionary principle) if parsing fails, instead of Unknown.
  let riskLevel: ParsedReport['riskLevel'] = 'Medium';
  const lowerSummary = summaryRaw.toLowerCase();
  
  if (lowerSummary.includes('high') || lowerSummary.includes('élevé')) riskLevel = 'High';
  else if (lowerSummary.includes('low') || lowerSummary.includes('faible') || lowerSummary.includes('bas')) riskLevel = 'Low';
  // Note: if it contains 'moderate', 'modéré' or 'medium', it stays default 'Medium'
  // If it contains 'unknown' or 'indeterminate', it stays 'Medium' as per new requirement

  // 2. Extract Detailed Analysis (Sub-parsing)
  // Note: The AI might output "* **Image:**" or "* **Image :**" depending on spacing rules
  const detailsRaw = extract(sections.details);
  const detailedAnalysis: ParsedReport['detailedAnalysis'] = {};
  
  // Generic regex for bullets like "* **Key:** Value"
  const extractDetail = (key: string) => {
    // Matches "* **Key:**" or "* **Key :**" (French style)
    const regex = new RegExp(`\\*\\s*\\*\\*${key}\\s*:?\\*\\*\\s*([\\s\\S]*?)(?=\\*\\s*\\*\\*|$)`, 'i');
    const match = detailsRaw.match(regex);
    return match ? match[1].trim() : undefined;
  };
  
  detailedAnalysis.image = extractDetail('Image');
  detailedAnalysis.audio = extractDetail('Audio');
  detailedAnalysis.text = extractDetail('Text') || extractDetail('Texte'); // Handle French
  detailedAnalysis.document = extractDetail('Document');

  // 3. Reasoning
  const reasoningRaw = extract(sections.reasoning);
  const reasoning = {
    observations: extractDetail('Observations') || reasoningRaw.match(/\*\s*\*\*Observations\s*:?\*\*\s*([\s\S]*?)(?=\*\s*\*\*|$)/i)?.[1].trim() || '',
    possibilities: extractDetail('Possibilities') || extractDetail('Possibilités') || reasoningRaw.match(/\*\s*\*\*Possibilities\s*:?\*\*\s*([\s\S]*?)(?=\*\s*\*\*|$)/i)?.[1].trim() || '',
    limitations: extractDetail('Limitations') || reasoningRaw.match(/\*\s*\*\*Limitations\s*:?\*\*\s*([\s\S]*?)(?=\*\s*\*\*|$)/i)?.[1].trim() || '',
  };

  // 4. Recommendations (List parsing)
  const recsRaw = extract(sections.recommendations);
  const recommendations = recsRaw
    .split('\n')
    .map(line => line.replace(/^[\*\-]\s*/, '').trim())
    .filter(line => line.length > 0);

  // 5. Red Flags
  const flagsRaw = extract(sections.redFlags);
  const redFlags = flagsRaw
    .split('\n')
    .filter(line => !line.toLowerCase().includes('no urgent warning') && !line.toLowerCase().includes('aucune')) // Simple filter
    .map(line => line.replace(/^[\*\-]\s*/, '').trim())
    .filter(line => line.length > 0 && !line.match(/No urgent warning signs/i) && !line.match(/Aucun signe/i));

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