import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

type Question = {
    q: string;
    tool: 'search_components' | 'get_component_docs' | 'get_component_props' | 'list_examples';
    input: Record<string, unknown>;
    expect: { includesName?: string; namePresent?: string; nonNull?: boolean; nonEmpty?: boolean };
};

async function callTool(tool: string, input: Record<string, unknown>, baseUrl: string): Promise<unknown> {
    const res = await fetch(`${baseUrl}/mcp`, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            accept: 'application/json, text/event-stream',
        },
        body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'tools/call',
            params: { name: tool, arguments: input },
        }),
    });
    if (!res.ok) throw new Error(`MCP call failed: ${res.status} ${await res.text()}`);
    const json = (await res.json()) as { result?: { content?: Array<{ text: string }> } };
    const text = json.result?.content?.[0]?.text;
    return text ? JSON.parse(text) : null;
}

function grade(question: Question, result: unknown): boolean {
    const e = question.expect;
    if (e.includesName) {
        const arr = Array.isArray(result) ? result : [];
        return arr.some((x) => (x as { name?: string }).name === e.includesName);
    }
    if (e.namePresent) {
        return result !== null && typeof result === 'object' && (result as { name?: string }).name === e.namePresent;
    }
    if (e.nonNull) return result !== null && result !== undefined;
    if (e.nonEmpty) return Array.isArray(result) && result.length > 0;
    return false;
}

async function main() {
    const baseUrl = process.env.MCP_BASE_URL ?? 'http://localhost:3000';
    const here = path.dirname(fileURLToPath(import.meta.url));
    const questionsPath = path.resolve(here, 'questions.json');
    const { questions } = JSON.parse(readFileSync(questionsPath, 'utf8')) as { questions: Question[] };

    let passed = 0;
    for (const question of questions) {
        try {
            const result = await callTool(question.tool, question.input, baseUrl);
            const ok = grade(question, result);
            if (ok) passed++;
            // biome-ignore lint/suspicious/noConsole: eval harness writes to stdout
            console.log(`${ok ? 'PASS' : 'FAIL'}: ${question.q}`);
        } catch (err) {
            // biome-ignore lint/suspicious/noConsole: eval harness writes to stdout
            console.log(`ERROR: ${question.q} — ${(err as Error).message}`);
        }
    }

    const rate = passed / questions.length;
    // biome-ignore lint/suspicious/noConsole: eval harness writes to stdout
    console.log(`\nPassed ${passed}/${questions.length} (${(rate * 100).toFixed(1)}%)`);
    if (rate < 0.95) {
        // biome-ignore lint/suspicious/noConsole: signalling failure to CI
        console.error('::error::MCP eval below 95% — see failures above');
        process.exit(1);
    }
}

main();
