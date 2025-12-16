import { describe, expect, it } from 'vitest';
import { parseHealthReport } from '@shared/utils/reportParser';

describe('parseHealthReport (shared)', () => {
  it('detects risk level across languages (English + French)', () => {
    const highMarkdown = `
### 1. Executive Summary
Overall risk is High based on the symptoms described.

### 2. Detailed Analysis
* **Text:** Cough and fever

### 3. Reasoning
N/A

### 4. Recommendations
- Rest

### 5. Red Flags
- None

### 6. Care Advice
Hydrate

### 7. Doctor Summary
Bring symptom timeline.
`;

    expect(parseHealthReport(highMarkdown).riskLevel).toBe('High');

    const lowMarkdown = `
### 1. Résumé Exécutif
Le risque est faible dans ce cas.

### 2. Analyse détaillée
* **Texte :** Douleur légère

### 3. Raisonnement
N/A

### 4. Recommandations
- Surveiller les symptômes

### 5. Signaux d'alerte
- Aucun

### 6. Conseils
Repos

### 7. Résumé médecin
RAS
`;

    expect(parseHealthReport(lowMarkdown).riskLevel).toBe('Low');

    const unknownMarkdown = `
### 1. Executive Summary
Risk is indeterminate.

### 2. Detailed Analysis
* **Text:** Not provided

### 3. Reasoning
N/A

### 4. Recommendations
- Follow up if symptoms persist

### 5. Red Flags
- No urgent warning signs

### 6. Care Advice
N/A

### 7. Doctor Summary
N/A
`;

    expect(parseHealthReport(unknownMarkdown).riskLevel).toBe('Medium');
  });

  it('extracts sections and parses recommendations from bullet lists', () => {
    const markdown = `
### 1. Executive Summary
Summary line 1.
Summary line 2.

### 2. Detailed Analysis
* **Image:** No image provided.
* **Text :** Reported sore throat.

### 3. Reasoning
Some reasoning.

### 4. Recommendations
* Drink water
- Rest

### 5. Red Flags
- No urgent warning signs

### 6. Care Advice
Stay home if you have a fever.

### 7. Doctor Summary
ENT evaluation if worsening.
`;

    const parsed = parseHealthReport(markdown);

    expect(parsed.executiveSummary).toContain('Summary line 1.');
    expect(parsed.detailedAnalysis.text).toBe('Reported sore throat.');

    expect(parsed.recommendations).toEqual(['Drink water', 'Rest']);

    expect(parsed.careAdvice).toContain('Stay home');
    expect(parsed.doctorSummary).toContain('ENT evaluation');
  });
});
