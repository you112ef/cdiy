import { LanguageDescription } from '@codemirror/language';

export const supportedLanguages = [
  // Web Technologies
  LanguageDescription.of({
    name: 'VUE',
    extensions: ['vue'],
    async load() {
      return import('@codemirror/lang-vue').then((module) => module.vue());
    },
  }),
  LanguageDescription.of({
    name: 'TypeScript',
    extensions: ['ts'],
    async load() {
      return import('@codemirror/lang-javascript').then((module) => module.javascript({ typescript: true }));
    },
  }),
  LanguageDescription.of({
    name: 'JavaScript',
    extensions: ['js', 'mjs', 'cjs'],
    async load() {
      return import('@codemirror/lang-javascript').then((module) => module.javascript());
    },
  }),
  LanguageDescription.of({
    name: 'TSX',
    extensions: ['tsx'],
    async load() {
      return import('@codemirror/lang-javascript').then((module) => module.javascript({ jsx: true, typescript: true }));
    },
  }),
  LanguageDescription.of({
    name: 'JSX',
    extensions: ['jsx'],
    async load() {
      return import('@codemirror/lang-javascript').then((module) => module.javascript({ jsx: true }));
    },
  }),
  LanguageDescription.of({
    name: 'HTML',
    extensions: ['html', 'htm'],
    async load() {
      return import('@codemirror/lang-html').then((module) => module.html());
    },
  }),
  LanguageDescription.of({
    name: 'CSS',
    extensions: ['css'],
    async load() {
      return import('@codemirror/lang-css').then((module) => module.css());
    },
  }),
  LanguageDescription.of({
    name: 'SASS',
    extensions: ['sass'],
    async load() {
      return import('@codemirror/lang-sass').then((module) => module.sass({ indented: true }));
    },
  }),
  LanguageDescription.of({
    name: 'SCSS',
    extensions: ['scss'],
    async load() {
      return import('@codemirror/lang-sass').then((module) => module.sass({ indented: false }));
    },
  }),
  
  // Data & Config
  LanguageDescription.of({
    name: 'JSON',
    extensions: ['json', 'jsonc'],
    async load() {
      return import('@codemirror/lang-json').then((module) => module.json());
    },
  }),
  LanguageDescription.of({
    name: 'YAML',
    extensions: ['yaml', 'yml'],
    async load() {
      return import('@codemirror/lang-yaml').then((module) => module.yaml());
    },
  }),
  LanguageDescription.of({
    name: 'TOML',
    extensions: ['toml'],
    async load() {
      return import('@codemirror/lang-toml').then((module) => module.toml());
    },
  }),
  LanguageDescription.of({
    name: 'XML',
    extensions: ['xml', 'xsl', 'xsd'],
    async load() {
      return import('@codemirror/lang-xml').then((module) => module.xml());
    },
  }),
  
  // Documentation
  LanguageDescription.of({
    name: 'Markdown',
    extensions: ['md', 'markdown', 'mdx'],
    async load() {
      return import('@codemirror/lang-markdown').then((module) => module.markdown());
    },
  }),
  
  // Programming Languages
  LanguageDescription.of({
    name: 'Python',
    extensions: ['py', 'pyw', 'pyi'],
    async load() {
      return import('@codemirror/lang-python').then((module) => module.python());
    },
  }),
  LanguageDescription.of({
    name: 'Java',
    extensions: ['java'],
    async load() {
      return import('@codemirror/lang-java').then((module) => module.java());
    },
  }),
  LanguageDescription.of({
    name: 'C++',
    extensions: ['cpp', 'cxx', 'cc', 'c'],
    async load() {
      return import('@codemirror/lang-cpp').then((module) => module.cpp());
    },
  }),
  LanguageDescription.of({
    name: 'C#',
    extensions: ['cs'],
    async load() {
      return import('@codemirror/lang-csharp').then((module) => module.csharp());
    },
  }),
  LanguageDescription.of({
    name: 'PHP',
    extensions: ['php', 'php3', 'php4', 'php5', 'phtml'],
    async load() {
      return import('@codemirror/lang-php').then((module) => module.php());
    },
  }),
  LanguageDescription.of({
    name: 'Rust',
    extensions: ['rs'],
    async load() {
      return import('@codemirror/lang-rust').then((module) => module.rust());
    },
  }),
  LanguageDescription.of({
    name: 'Go',
    extensions: ['go'],
    async load() {
      return import('@codemirror/lang-go').then((module) => module.go());
    },
  }),
  LanguageDescription.of({
    name: 'Ruby',
    extensions: ['rb'],
    async load() {
      return import('@codemirror/lang-ruby').then((module) => module.ruby());
    },
  }),
  LanguageDescription.of({
    name: 'Swift',
    extensions: ['swift'],
    async load() {
      return import('@codemirror/lang-swift').then((module) => module.swift());
    },
  }),
  LanguageDescription.of({
    name: 'Kotlin',
    extensions: ['kt', 'kts'],
    async load() {
      return import('@codemirror/lang-kotlin').then((module) => module.kotlin());
    },
  }),
  
  // Shell & Scripts
  LanguageDescription.of({
    name: 'Shell',
    extensions: ['sh', 'bash', 'zsh', 'fish'],
    async load() {
      return import('@codemirror/lang-shell').then((module) => module.shell());
    },
  }),
  LanguageDescription.of({
    name: 'PowerShell',
    extensions: ['ps1', 'psm1', 'psd1'],
    async load() {
      return import('@codemirror/lang-powershell').then((module) => module.powershell());
    },
  }),
  
  // Database
  LanguageDescription.of({
    name: 'SQL',
    extensions: ['sql'],
    async load() {
      return import('@codemirror/lang-sql').then((module) => module.sql());
    },
  }),
  
  // Special Files
  LanguageDescription.of({
    name: 'Dockerfile',
    extensions: ['dockerfile'],
    filename: /^Dockerfile$/i,
    async load() {
      return import('@codemirror/lang-dockerfile').then((module) => module.dockerfile());
    },
  }),
  LanguageDescription.of({
    name: 'WebAssembly',
    extensions: ['wat', 'wast'],
    async load() {
      return import('@codemirror/lang-wast').then((module) => module.wast());
    },
  }),
  
  // Other Languages
  LanguageDescription.of({
    name: 'Dart',
    extensions: ['dart'],
    async load() {
      return import('@codemirror/lang-dart').then((module) => module.dart());
    },
  }),
  LanguageDescription.of({
    name: 'Scala',
    extensions: ['scala', 'sc'],
    async load() {
      return import('@codemirror/lang-scala').then((module) => module.scala());
    },
  }),
  LanguageDescription.of({
    name: 'Haskell',
    extensions: ['hs', 'lhs'],
    async load() {
      return import('@codemirror/lang-haskell').then((module) => module.haskell());
    },
  }),
];

export async function getLanguage(fileName: string) {
  const languageDescription = LanguageDescription.matchFilename(supportedLanguages, fileName);

  if (languageDescription) {
    try {
      return await languageDescription.load();
    } catch (error) {
      console.warn(`Failed to load language for ${fileName}:`, error);
      return undefined;
    }
  }

  return undefined;
}

export function getLanguageFromFileName(fileName: string): string {
  const languageDescription = LanguageDescription.matchFilename(supportedLanguages, fileName);
  return languageDescription?.name.toLowerCase() || 'text';
}

export function getSupportedExtensions(): string[] {
  return supportedLanguages.flatMap(lang => lang.extensions || []);
}
