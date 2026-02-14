import { randInt, shuffle } from '../../utils/seededRng.js';

/**
 * Binary Logic — logic gate circuits.
 * Player figures out unknown input/output values given a gate network.
 */

const GATE_TYPES = ['AND', 'OR', 'XOR', 'NOT'];

function evalGate(type, a, b) {
    switch (type) {
        case 'AND': return a & b;
        case 'OR': return a | b;
        case 'XOR': return a ^ b;
        case 'NOT': return a === 1 ? 0 : 1;
        default: return 0;
    }
}

function buildCircuit(rng, depth) {
    const gates = [];
    const inputs = [];
    const numInputs = depth <= 1 ? 3 : 4;

    // Generate random input values
    for (let i = 0; i < numInputs; i++) {
        inputs.push({ id: `in_${i}`, value: randInt(0, 1, rng), label: String.fromCharCode(65 + i) });
    }

    // Build gates layer by layer
    let prevOutputs = inputs.map(inp => inp.id);

    for (let layer = 0; layer < depth; layer++) {
        const layerGates = [];
        const newOutputs = [];

        for (let g = 0; g < Math.max(1, prevOutputs.length - 1); g++) {
            const gateType = GATE_TYPES[randInt(0, GATE_TYPES.length - 1, rng)];
            const gate = {
                id: `gate_${layer}_${g}`,
                type: gateType,
                inputs: gateType === 'NOT'
                    ? [prevOutputs[g % prevOutputs.length]]
                    : [prevOutputs[g % prevOutputs.length], prevOutputs[(g + 1) % prevOutputs.length]],
                output: null,
            };

            // Compute output
            const inVals = gate.inputs.map(id => {
                const inp = inputs.find(i => i.id === id);
                if (inp) return inp.value;
                const prevGate = gates.flat().find(pg => pg.id === id);
                return prevGate ? prevGate.output : 0;
            });

            gate.output = gateType === 'NOT' ? evalGate(gateType, inVals[0]) : evalGate(gateType, inVals[0], inVals[1]);
            layerGates.push(gate);
            newOutputs.push(gate.id);
        }

        gates.push(layerGates);
        prevOutputs = newOutputs;
    }

    return { inputs, gates, finalOutputs: prevOutputs };
}

export function generate(rng, difficulty = 1) {
    const depth = Math.min(1 + Math.floor(difficulty * 0.5), 3);
    const numQuestions = Math.min(2 + Math.floor(difficulty), 5);
    const { inputs, gates, finalOutputs } = buildCircuit(rng, depth);

    // Decide which values to hide (these are the questions)
    const allGates = gates.flat();
    const questions = [];

    // Hide some gate outputs
    const hideable = [...allGates];
    shuffle(hideable, rng);

    for (let i = 0; i < Math.min(numQuestions, hideable.length); i++) {
        questions.push({
            gateId: hideable[i].id,
            answer: hideable[i].output,
        });
    }

    return {
        type: 'binaryLogic',
        inputs: inputs.map(inp => ({ ...inp })),
        gates: gates.map(layer => layer.map(g => ({
            id: g.id,
            type: g.type,
            inputs: g.inputs,
            output: questions.find(q => q.gateId === g.id) ? null : g.output,
        }))),
        questions,
        solution: questions.reduce((acc, q) => { acc[q.gateId] = q.answer; return acc; }, {}),
    };
}

export function validate(userAnswers, puzzleData) {
    return puzzleData.questions.every(q => parseInt(userAnswers[q.gateId]) === q.answer);
}

export function getHint(puzzleData) {
    const unanswered = puzzleData.questions.filter(q => q.answer !== undefined);
    if (unanswered.length === 0) return null;
    const hint = unanswered[0];
    return { gateId: hint.gateId, answer: hint.answer };
}
