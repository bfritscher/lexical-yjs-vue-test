function escapeLatex(text: string|null) {
  if (!text) {
    return '';
  }
  text = text.replace(/&nbsp;/g, ' ');
  // escape latex code
  const escapeChars = {
    '\\r\\n': ' ',
    '\\n': ' ',
    '&lt;': '<',
    '&gt;': '>',
    '\\\\': '\\textbackslash ',
    '&': '\\&',
    '%': '\\%',
    '\\$': '\\$',
    '\\#': '\\#',
    _: '\\_',
    '\\{': '\\{',
    '\\}': '\\}',
    '~': '\\textasciitilde ',
    '\\^': '\\textasciicircum ',
  } as { [key: string]: string };
  for (const char in escapeChars) {
    if (escapeChars.hasOwnProperty(char)) {
      const regex = new RegExp(char, 'g');
      text = text.replace(regex, escapeChars[char]);
    }
  }

  return text;
}

function numberToAlpha(n: number) {
  if (n <= 0) throw Error('numberToAlpha: n must be positive and non-zero');
  n = n - 1;
  let result = '';
  while (n >= 0) {
    result = String.fromCharCode(n % 26 + 65) + result;
    n = Math.floor(n / 26) - 1;
  }
  return result;
};

export function html2Latex(content: string, isAnswer = false) {
  const div = document.createElement('div');
  div.innerHTML = content;

  function nodeHasAnyChildOfType(node:HTMLElement, type:string) {
    const childs = node.childNodes;
    for (let i = 0; i < childs.length; i++) {
      if (childs[i].nodeName === type.toUpperCase()) {
        return true;
      }
    }
    return false;
  }


  function handleCenter(node: HTMLElement, callback: () => string) {
    let out = '';
    if (node.classList.contains('wysiwyg-text-align-center') || node.style.textAlign === 'center') {
      out += '\\begin{center}\n';
      out += callback() + '\n';
      out += '\\end{center}\n';
    } else {
      out += callback();
    }
    return out;
  }

  function handleNode(node: HTMLElement, level:number) {
    if (node.hasChildNodes()) {
      const childs = node.childNodes;
      let out = '';

      for (let i = 0; i < childs.length; i++) {
        const child = childs[i] as HTMLElement;

        switch (child.nodeName) {
          case '#text':
            out += escapeLatex(child.textContent);
            break;
          case 'SPAN':
            out += handleNode(child, level + 1);
            break;
          case 'MARK':
          // suport legacy editor
          case 'VAR':
            out += ' ' + child.textContent + ' '; //check if too much is left out of textContent
            break;

          case 'B':
            out += '\\textbf{' + handleNode(child, level + 1) + '}';
            break;
          // skip use B
          case 'STRONG':
            out += handleNode(child, level + 1);
            break;

          case 'I':
            out += '\\emph{' + handleNode(child, level + 1) + '}';
            break;
          case 'EM':
            out += handleNode(child, level + 1);
            break;
          case 'U':
            out += '\\underline{' + handleNode(child, level + 1) + '}';
            break;
          // suport legacy editor
          case 'TT':
            out += '\\texttt{' + handleNode(child, level + 1) + '}';
            break;

          case 'SUB':
              out += '\\textsubscript{' + handleNode(child, level + 1) + '}';
              break;

          case 'SUP':
            out += '\\textsuperscript{' + handleNode(child, level + 1) + '}';
            break;

          case 'S':
            out += '\\st{' + handleNode(child, level + 1) + '}';
            break;

          case 'IMG':
            out += imgNode2Latex(child, isAnswer);
            break;

          case 'CODE':
            // suport legacy editor
            if (child.hasAttribute('id') && !child.hasAttribute('data-border')) {
              out += codeNode2Latex(child);
            } else if (child.hasAttribute('id') && child.hasAttribute('data-border')) {
              out += lexcialCodeNode2Latex(child);
            } else {
              out += '\\texttt{' + handleNode(child, level + 1) + '}';
            }
            break;
          case 'PRE':
            out += lexcialCodeNode2Latex(child);
            break;
          case 'P':
            out += handleCenter(child, () => handleNode(child, level + 1))
            if (node.childNodes.length > 1) {
              out += '\n\n';
            }

            break;

          case 'OL':
            // LaTeX does not support empty itemize sections
            if (nodeHasAnyChildOfType(child, 'LI')) {
              out +=
                '\\begin{enumerate}\n' +
                handleNode(child, level + 1) +
                '\\end{enumerate}\n';
            }
            break;

          case 'UL':
            // LaTeX does not support empty itemize sections
            if (nodeHasAnyChildOfType(child, 'LI')) {
              out +=
                '\\begin{itemize}\n' +
                handleNode(child, level + 1) +
                '\\end{itemize}\n';
            }
            break;

          case 'LI':
            if (nodeHasAnyChildOfType(child, 'OL') || nodeHasAnyChildOfType(child, 'UL')) {
              out += handleNode(child, level + 1) + '\n';
            } else {
              out += '\\item ' +  handleCenter(child, () => handleNode(child, level + 1)) + '\n';
            }
            break;

          case 'BOX':
            out +=
              '\\fbox{\\parbox{\\textwidth}{\n' +
              handleNode(child, level + 1) +
              '}}\\newline\n';
            break;

          case 'HR':
            out += '\\vspace{1em}\n\\hrule\n\\vspace{1em}\n';
            break;

          case 'H1':
            out += '\\section*{' + handleCenter(child, () => handleNode(child, level + 1)) + '}\n';
            break;

          case 'H2':
            out += '\\subsection*{' +  handleCenter(child, () => handleNode(child, level + 1)) + '}\n';
            break;

          case 'H3':
            out += '\\subsubsection*{' +  handleCenter(child, () => handleNode(child, level + 1)) + '}\n';
            break;

          case 'FIGURE':
            if (child.hasAttribute('type') && child.getAttribute('type') === 'page-break') {
              out += '\\newpage\n';
            }
            break;

          case 'TABLE':
            // get number of td in first tr
            const firstTr = child.querySelector('tr');
            if (!firstTr) {
              break;
            }
            const tdCount = firstTr.querySelectorAll('td').length;
            out += '\\begin{tabular}{|' + 'l|'.repeat(tdCount) + '}\n';
            out += '\\hline\n';
            // for each tr
            const trs = child.querySelectorAll('tr');
            for (let i = 0; i < trs.length; i++) {
              const tr = trs[i];
              const tds = tr.querySelectorAll('td');
              for (let j = 0; j < tds.length; j++) {
                out += handleNode(tds[j], level + 1);
                if (j < tds.length - 1) {
                  out += ' & ';
                }
              }
              out += ' \\\\ \\hline\n';
            }
            out += handleNode(child, level + 1);
            out += '\\end{tabular}\n';
            break;

          default:
            break;
        }
      }
      return out;
    } else {
      return node.textContent || '';
    }
  }
  return handleNode(div, 0);
}

const modeToLanguage = {
  'text/html': 'html',
  'text/css': 'html',
  'text/javascript': 'JavaScript',
  'text/x-sql': 'SQL',
  'text/x-java': 'java',
  'text/x-python': 'Python',
} as { [key: string]: string };

function lexcialCodeNode2Latex(node: HTMLElement) {
    // TODO  mode mapping
    node.innerHTML = node.innerHTML.replaceAll('<br>', '\n')
    const code = {
      id: node.getAttribute('id') || '',
      content: node.innerText || '',
      border: node.getAttribute('data-border') === 'true',
      numbers: node.getAttribute('data-numbers') === 'true',
      mode: node.getAttribute('data-highlight-language') || '',
    };
    let out = '\\lstinputlisting[';
    const options = [];
    if (code.border) {
      options.push('frame=single');
    }
    if (!code.numbers) {
      options.push('numbers=none');
    }
    if (code.mode && modeToLanguage.hasOwnProperty(code.mode)) {
      options.push('language=' + modeToLanguage[code.mode]);
    }
    out += options.join(',') + ']{src/codes/' + code.id + '}';
    return out;
}

function codeNode2Latex(node: HTMLElement) {
  const code = undefined //editor.getCode(node.getAttribute('id'));
  if (code) {
    let out = '\\lstinputlisting[';
    const options = [];
    if (code.border) {
      options.push('frame=single');
    }
    if (!code.numbers) {
      options.push('numbers=none');
    }
    if (code.mode && modeToLanguage.hasOwnProperty(code.mode)) {
      options.push('language=' + modeToLanguage[code.mode]);
    }
    out += options.join(',') + ']{src/codes/' + code.id + '}';
    return out;
  }
  return 'CODE\\_NOT\\_FOUND';
}

function imgNode2Latex(node: HTMLElement, vcenter: boolean) {
  const img = undefined; //editor.getGraphics(node.getAttribute('id'));
  if (img) {
    let options = 'width=' + img.width.toFixed(2) + '\\textwidth';
    if (img.options) {
      options = img.options;
    }
    let out = '\\includegraphics[' + options + ']{src/graphics/' + img.id + '}';
    if (img.border) {
      out = '\\fbox{' + out + '}';
    }
    if (vcenter) {
      out = '$\\vcenter{\\hbox{' + out + '}}$';
    }
    return out;
  }

  return 'IMG\\_NOT\\_FOUND';
}
