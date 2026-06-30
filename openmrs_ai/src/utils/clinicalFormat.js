export function formatFallback(text) {

    if (!text) return "";

    const lines = text.split("\n");

    const result = [];

    for (let line of lines) {

        let trimmed = line.trim();

        if (!trimmed) continue;

        // nível 2 (heurística simples)
        const isChild =
            trimmed.startsWith("  -") ||
            trimmed.startsWith("- ") && trimmed.includes(":") === false && trimmed.length < 40;

        if (trimmed.startsWith("- ")) {
            result.push(trimmed);
        } else if (isChild) {
            result.push(`  ${trimmed}`);
        } else {
            result.push(`- ${trimmed}`);
        }
    }

    return result.join("\n");
}