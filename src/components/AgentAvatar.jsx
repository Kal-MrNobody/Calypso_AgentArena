import React from 'react';
import { categoryColors } from '../data/agents';

/**
 * AgentAvatar — renders a glowing emoji-based avatar for each agent.
 * size: 'sm' | 'md' | 'lg'
 */
export default function AgentAvatar({ agent, size = 'md' }) {
  const color = categoryColors[agent.category] || '#00D4FF';
  const emoji = agent.avatar || '🤖';

  const dims = {
    sm: { outer: 'w-12 h-12', text: 'text-2xl' },
    md: { outer: 'w-16 h-16', text: 'text-3xl' },
    lg: { outer: 'w-24 h-24', text: 'text-5xl' },
  };

  const { outer, text } = dims[size] || dims.md;

  return (
    <div
      className={`${outer} rounded-2xl flex items-center justify-center shrink-0 relative`}
      style={{
        background: `radial-gradient(circle at 30% 30%, ${color}30, ${color}08)`,
        border: `1.5px solid ${color}40`,
        boxShadow: `0 0 18px ${color}25, inset 0 0 12px ${color}10`,
      }}
    >
      <span className={`${text} select-none`} role="img" aria-label={agent.name}>
        {emoji}
      </span>
    </div>
  );
}
