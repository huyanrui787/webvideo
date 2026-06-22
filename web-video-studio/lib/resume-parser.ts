/**
 * Resume Parser — extract structured resume data from raw text using AI.
 */

import { db } from "@/lib/db";
import { resumes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY ?? "";
const ANTHROPIC_BASE = process.env.ANTHROPIC_BASE_URL ?? "https://qqqapi.com";

export interface ResumeData {
  basics: {
    name: string;
    label: string;
    email: string;
    phone: string;
    location: string;
    website: string;
    summary: string;
    photo: string;
  };
  experience: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    highlights: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
  }>;
  skills: Array<{ name: string; level: string; category: string }>;
  projects: Array<{
    name: string;
    description: string;
    url: string;
    highlights: string[];
  }>;
  languages: Array<{ language: string; fluency: string }>;
}

const RESUME_JSON_SCHEMA = {
  type: "object",
  properties: {
    basics: {
      type: "object",
      properties: {
        name: { type: "string" },
        label: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        location: { type: "string" },
        website: { type: "string" },
        summary: { type: "string" },
        photo: { type: "string" },
      },
      required: ["name", "label", "email", "summary"],
    },
    experience: {
      type: "array",
      items: {
        type: "object",
        properties: {
          company: { type: "string" },
          position: { type: "string" },
          startDate: { type: "string" },
          endDate: { type: "string" },
          highlights: { type: "array", items: { type: "string" } },
        },
        required: ["company", "position"],
      },
    },
    education: {
      type: "array",
      items: {
        type: "object",
        properties: {
          institution: { type: "string" },
          degree: { type: "string" },
          field: { type: "string" },
          startDate: { type: "string" },
          endDate: { type: "string" },
        },
        required: ["institution", "degree"],
      },
    },
    skills: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          level: { type: "string", enum: ["expert", "proficient", "intermediate", "beginner"] },
          category: { type: "string" },
        },
        required: ["name", "level"],
      },
    },
    projects: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          url: { type: "string" },
          highlights: { type: "array", items: { type: "string" } },
        },
        required: ["name"],
      },
    },
    languages: {
      type: "array",
      items: {
        type: "object",
        properties: {
          language: { type: "string" },
          fluency: { type: "string" },
        },
        required: ["language", "fluency"],
      },
    },
  },
  required: ["basics"],
};

const SYSTEM_PROMPT = `You are a resume parsing expert. Extract structured resume data from the provided text.

Rules:
1. Infer missing fields when possible (e.g., deduce "label" from the most recent job title).
2. For skills, assign a level: "expert" (10+ years or mastery), "proficient" (5+ years), "intermediate" (2-5 years), "beginner" (<2 years). Group skills into categories like Frontend, Backend, DevOps, Design, Management, Language, etc.
3. For experience highlights, rewrite bullet points to be action-oriented with measurable results where possible (e.g., "Built X" → "Built X, improving Y by Z%").
4. Dates should be in "YYYY-MM" format. If only a year is given, use "YYYY-01".
5. If a section has no data, return an empty array.
6. Preserve the original language (Chinese stays Chinese, English stays English).

Return ONLY valid JSON matching the schema, with no additional text or explanation.`;

/**
 * Parse raw text into structured resume data using AI.
 */
export async function parseResumeText(rawText: string): Promise<ResumeData> {
  // Truncate very long input
  const input = rawText.slice(0, 12000);

  const res = await fetch(`${ANTHROPIC_BASE}/v1/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Parse the following resume text into structured JSON:\n\n${input}`,
        },
      ],
      tools: [
        {
          name: "output_resume",
          description: "Output the parsed resume data",
          input_schema: RESUME_JSON_SCHEMA,
        },
      ],
      tool_choice: { type: "tool", name: "output_resume" },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`AI parse failed: ${res.status} ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  const toolUse = data.content?.find((c: { type: string }) => c.type === "tool_use");
  if (!toolUse) throw new Error("AI did not return structured resume data");

  return toolUse.input as ResumeData;
}

/**
 * Get or create resume data for a project.
 */
export async function getResumeData(projectId: string): Promise<ResumeData | null> {
  const [row] = await db.select().from(resumes).where(eq(resumes.projectId, projectId)).limit(1);
  if (!row) return null;
  try {
    return JSON.parse(row.data) as ResumeData;
  } catch {
    return null;
  }
}

/**
 * Save resume data for a project.
 */
export async function saveResumeData(
  projectId: string,
  data: ResumeData
): Promise<void> {
  const json = JSON.stringify(data);
  const [existing] = await db
    .select()
    .from(resumes)
    .where(eq(resumes.projectId, projectId))
    .limit(1);

  if (existing) {
    await db
      .update(resumes)
      .set({ data: json, updatedAt: Math.floor(Date.now() / 1000) })
      .where(eq(resumes.projectId, projectId));
  } else {
    await db.insert(resumes).values({
      id: nanoid(12),
      projectId,
      data: json,
      theme: "minimal",
      createdAt: Math.floor(Date.now() / 1000),
      updatedAt: Math.floor(Date.now() / 1000),
    });
  }
}
