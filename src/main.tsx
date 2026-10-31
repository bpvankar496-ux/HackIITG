import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Google Translate rewrites text nodes, which can make React crash with
// "removeChild" / "insertBefore" errors. These guards prevent that.
if (typeof Node === 'function' && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild as any;
  (Node.prototype as any).removeChild = function (this: Node, child: Node) {
    if (child.parentNode !== this) return child;
    return originalRemoveChild.call(this, child);
  };
  const originalInsertBefore = Node.prototype.insertBefore as any;
  (Node.prototype as any).insertBefore = function (this: Node, newNode: Node, referenceNode: Node | null) {
    if (referenceNode && referenceNode.parentNode !== this) return newNode;
    return originalInsertBefore.call(this, newNode, referenceNode);
  };
}

createRoot(document.getElementById('root')!).render(<App />);