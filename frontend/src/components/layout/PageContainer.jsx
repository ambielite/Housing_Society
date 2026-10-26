import { cloneElement, isValidElement } from 'react';
import { Plus } from 'lucide-react';

const CREATION_ACTION = /\b(add|new|create|upload|register|raise|book|invite|generate|publish|issue|log|schedule|assign|link)\b/i;

function readButtonText(children) {
  if (typeof children === 'string' || typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(readButtonText).join(' ');
  return isValidElement(children) ? readButtonText(children.props.children) : '';
}

function containsPlus(children) {
  if (typeof children === 'string') return children.trim().startsWith('+');
  if (Array.isArray(children)) return children.some(containsPlus);
  if (!isValidElement(children)) return false;
  return children.type === Plus || containsPlus(children.props.children);
}

function addCreationIcons(node) {
  if (Array.isArray(node)) return node.map(addCreationIcons);
  if (!isValidElement(node)) return node;

  const children = node.props.children;
  if (node.type === 'button' || typeof node.props.to === 'string') {
    const label = readButtonText(children).trim();
    if (CREATION_ACTION.test(label) && !containsPlus(children)) {
      return cloneElement(node, {}, <><Plus size={16} aria-hidden="true" /> {children}</>);
    }
  }

  return cloneElement(node, {}, addCreationIcons(children));
}

export default function PageContainer({ title, subtitle, eyebrow, actions, children, hideHeader = false, className = '', moduleShell = true }) {
  return (
    <section className={`page ${moduleShell ? 'module-shell-page' : ''} ${className}`.trim()}>
      {!hideHeader && <header className="page-header">
        <div>
          {eyebrow && <div className="society-eyebrow"><span className="society-eyebrow-dot" /> {eyebrow}</div>}
          <h1>{title}</h1>
          {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="page-actions">{addCreationIcons(actions)}</div>}
      </header>}
      {children}
    </section>
  );
}
