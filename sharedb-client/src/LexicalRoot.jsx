import React from 'react';
import { createRoot } from 'react-dom/client';
import LexicalEditor from 'lexical-playground/src/App';

const renderLexicalEditor = (container) => {
  const root = createRoot(container);
  root.render(<LexicalEditor />);
};

export default renderLexicalEditor;
