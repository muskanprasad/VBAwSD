// server/utils/similarity.js

export default function similarity(a, b) {
    if (!a || !b || a.length !== b.length) return 0;

    let dot = 0, normA = 0, normB = 0;

    for (let i = 0; i < a.length; i++) {
        const x = Number(a[i]) || 0;
        const y = Number(b[i]) || 0;
        dot += x * y;
        normA += x * x;
        normB += y * y;
    }

    if (normA === 0 || normB === 0) return 0;

    const sim = dot / (Math.sqrt(normA) * Math.sqrt(normB));

    if (isNaN(sim)) return 0;
    return Math.max(0, Math.min(1, sim)); // clamp 0..1
}
