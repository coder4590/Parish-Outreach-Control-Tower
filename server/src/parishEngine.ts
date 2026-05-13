import { GoogleGenAI } from '@google/genai';

type GroundingSource = { title: string; uri: string };

export type DiscoveredLead = {
  orgName: string;
  websiteUrl: string;
  city?: string;
  state?: string;
  groundingSources?: GroundingSource[];
};

export type ResearchResult = {
  email: string;
  socials: { ig?: string; fb?: string; yt?: string };
  evidence: string;
  primaryNeed:
    | 'needs_rebuild'
    | 'sermons_no_clips'
    | 'needs_audit'
    | 'inactive_social'
    | 'speaker_opportunity';
  groundingSources?: GroundingSource[];
};

export type DraftResult = { subject: string; body: string };

function parseJSON(text: string | undefined): any {
  if (!text) return null;
  const cleaned = text.replace(/```json|```/gi, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        return JSON.parse(arrayMatch[0]);
      } catch {}
    }
    const objectMatch = cleaned.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      try {
        return JSON.parse(objectMatch[0]);
      } catch {}
    }
    return null;
  }
}

function getGroundingSources(response: any): GroundingSource[] {
  const chunks = response?.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  return chunks
    .map((chunk: any) => ({
      title: chunk.web?.title || 'Source',
      uri: chunk.web?.uri || '',
    }))
    .filter((s: any) => s.uri);
}

export function createParishEngine(geminiApiKey: string) {
  if (!geminiApiKey) throw new Error('Missing GEMINI_API_KEY');
  const ai = new GoogleGenAI({ apiKey: geminiApiKey });

  return {
    async discoverLeads(location?: string): Promise<DiscoveredLead[]> {
      const geoHint = location?.trim() ? ` in ${location.trim()}` : ' in the USA';
      const prompt = `Search for 10 Catholic parishes${geoHint} with active websites that need digital modernizing.
Return ONLY a valid JSON array of objects. Format: [{ "orgName": "string", "websiteUrl": "string", "city": "string", "state": "string" }]`;

      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] },
      });

      const data = parseJSON(response.text);
      if (!data || !Array.isArray(data)) throw new Error('Invalid discovery payload received.');

      const sources = getGroundingSources(response);
      return data.map((d: any) => ({
        orgName: String(d.orgName || ''),
        websiteUrl: String(d.websiteUrl || ''),
        city: d.city ? String(d.city) : undefined,
        state: d.state ? String(d.state) : undefined,
        groundingSources: sources,
      }));
    },

    async researchLead(orgName: string, websiteUrl: string): Promise<ResearchResult> {
      const prompt = `Perform a digital audit for ${orgName} at ${websiteUrl}.
Find: 1. Contact email (crucial), 2. Social media links (IG, FB, YT), 3. Tech gaps (e.g., site speed, no sermon clips, old mobile UI).
Return ONLY JSON: { "email": "string", "socials": { "ig": "string", "fb": "string", "yt": "string" }, "evidence": "string", "primaryNeed": "needs_rebuild"|"sermons_no_clips"|"needs_audit"|"inactive_social"|"speaker_opportunity" }`;

      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt,
        config: { tools: [{ googleSearch: {} }] },
      });

      const result = parseJSON(response.text);
      if (!result) throw new Error('Neural research returned invalid matrix data.');

      return {
        email: String(result.email || ''),
        socials: (result.socials && typeof result.socials === 'object' ? result.socials : {}) as any,
        evidence: String(result.evidence || ''),
        primaryNeed: result.primaryNeed,
        groundingSources: getGroundingSources(response),
      };
    },

    async generateDraft(orgName: string, need: string, evidence: string): Promise<DraftResult> {
      const prompt = `Write a respectful, concise email to ${orgName} proposing a solution for their ${need}.
Reference this evidence: ${evidence}. Sound like a helpful neighbor, not a salesman.
Return ONLY JSON: { "subject": "string", "body": "string" }`;

      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });

      const parsed = parseJSON(response.text);
      if (!parsed) throw new Error('Invalid draft payload received.');

      return {
        subject: String(parsed.subject || ''),
        body: String(parsed.body || ''),
      };
    },
  };
}