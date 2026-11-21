import { useState } from 'react';
import { diagnose, EMPTY_DIAGNOSIS, PC_FAULTS, type FaultCase } from './hardware-practice.ts';
import './fault-practice.css';

export default function FaultPractice({ scenario, onVerified }: { scenario: FaultCase; onVerified?: () => void }) {
  const [state, setState] = useState(EMPTY_DIAGNOSIS);
  const act = (action: 'test' | 'fix' | 'verify', correct: boolean) => {
    const next = diagnose(state, action, correct, scenario);
    setState(next);
    if (next.verified) onVerified?.();
  };
  const choices = (field: 'test' | 'fix') => {
    const alternatives = PC_FAULTS.filter(item => item[field] !== scenario[field]).slice(0, 2).map(item => ({ text:item[field], correct:false }));
    const items = [{ text:scenario[field], correct:true }, ...alternatives];
    const offset = scenario.id.split('').reduce((sum, character) => sum + character.charCodeAt(0), 0) % items.length;
    return [...items.slice(offset), ...items.slice(0, offset)];
  };
  return <section className="fault-practice" aria-label="Test fix and verify">
    <small>SIMULATED CASE · TEST → FIX → VERIFY</small>
    <h3>{scenario.title}</h3><p>{scenario.symptom}</p>
    <fieldset disabled={state.verified}><legend>1. Choose a test</legend>
      {choices('test').map(choice => <button key={choice.text} onClick={() => act('test', choice.correct)}>{choice.text}</button>)}
    </fieldset>
    {state.inspected && <p className="fault-evidence"><strong>Evidence:</strong> {scenario.evidence}</p>}
    <fieldset disabled={!state.inspected || state.verified}><legend>2. Match the fix to the evidence</legend>
      {choices('fix').map(choice => <button key={choice.text} onClick={() => act('fix', choice.correct)}>{choice.text}</button>)}
    </fieldset>
    <button disabled={!state.fixed || state.verified} onClick={() => act('verify', true)}>3. Run the check again</button>
    <output>{state.feedback}</output>
    {state.verified && <strong>Verified: the simulated fault is resolved.</strong>}
    <p>Evidence matters. A similar symptom on a real computer may have another cause.</p>
  </section>;
}
