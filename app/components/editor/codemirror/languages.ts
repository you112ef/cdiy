import { LanguageDescription } from '@codemirror/language';

export const supportedLanguages = [
  // Web Technologies
  LanguageDescription.of({
    name: 'VUE',
    extensions: ['vue'],
    async load() {
      try {
        return import('@codemirror/lang-vue').then((module) => module.vue());
      } catch (error) {
        console.warn('Failed to load Vue language support:', error);
        return undefined;
      }
    },
  }),
  LanguageDescription.of({
    name: 'TypeScript',
    extensions: ['ts'],
    async load() {
      try {
        return import('@codemirror/lang-javascript').then((module) => module.javascript({ typescript: true }));
      } catch (error) {
        console.warn('Failed to load TypeScript language support:', error);
        return undefined;
      }
    },
  }),
  LanguageDescription.of({
    name: 'JavaScript',
    extensions: ['js', 'mjs', 'cjs'],
    async load() {
      try {
        return import('@codemirror/lang-javascript').then((module) => module.javascript());
      } catch (error) {
        console.warn('Failed to load JavaScript language support:', error);
        return undefined;
      }
    },
  }),
  LanguageDescription.of({
    name: 'TSX',
    extensions: ['tsx'],
    async load() {
      try {
        return import('@codemirror/lang-javascript').then((module) =>
          module.javascript({ jsx: true, typescript: true }),
        );
      } catch (error) {
        console.warn('Failed to load TSX language support:', error);
        return undefined;
      }
    },
  }),
  LanguageDescription.of({
    name: 'JSX',
    extensions: ['jsx'],
    async load() {
      try {
        return import('@codemirror/lang-javascript').then((module) => module.javascript({ jsx: true }));
      } catch (error) {
        console.warn('Failed to load JSX language support:', error);
        return undefined;
      }
    },
  }),
  LanguageDescription.of({
    name: 'HTML',
    extensions: ['html', 'htm'],
    async load() {
      try {
        return import('@codemirror/lang-html').then((module) => module.html());
      } catch (error) {
        console.warn('Failed to load HTML language support:', error);
        return undefined;
      }
    },
  }),
  LanguageDescription.of({
    name: 'CSS',
    extensions: ['css'],
    async load() {
      try {
        return import('@codemirror/lang-css').then((module) => module.css());
      } catch (error) {
        console.warn('Failed to load CSS language support:', error);
        return undefined;
      }
    },
  }),
  LanguageDescription.of({
    name: 'SASS',
    extensions: ['sass'],
    async load() {
      try {
        return import('@codemirror/lang-sass').then((module) => module.sass({ indented: true }));
      } catch (error) {
        console.warn('Failed to load SASS language support:', error);
        return undefined;
      }
    },
  }),
  LanguageDescription.of({
    name: 'SCSS',
    extensions: ['scss'],
    async load() {
      try {
        return import('@codemirror/lang-sass').then((module) => module.sass({ indented: false }));
      } catch (error) {
        console.warn('Failed to load SCSS language support:', error);
        return undefined;
      }
    },
  }),

  // Data & Config
  LanguageDescription.of({
    name: 'JSON',
    extensions: ['json', 'jsonc'],
    async load() {
      try {
        return import('@codemirror/lang-json').then((module) => module.json());
      } catch (error) {
        console.warn('Failed to load JSON language support:', error);
        return undefined;
      }
    },
  }),

  // Documentation
  LanguageDescription.of({
    name: 'Markdown',
    extensions: ['md', 'markdown', 'mdx'],
    async load() {
      try {
        return import('@codemirror/lang-markdown').then((module) => module.markdown());
      } catch (error) {
        console.warn('Failed to load Markdown language support:', error);
        return undefined;
      }
    },
  }),

  // Programming Languages
  LanguageDescription.of({
    name: 'Python',
    extensions: ['py', 'pyw', 'pyi'],
    async load() {
      try {
        return import('@codemirror/lang-python').then((module) => module.python());
      } catch (error) {
        console.warn('Failed to load Python language support:', error);
        return undefined;
      }
    },
  }),
  LanguageDescription.of({
    name: 'C++',
    extensions: ['cpp', 'cxx', 'cc', 'c'],
    async load() {
      try {
        return import('@codemirror/lang-cpp').then((module) => module.cpp());
      } catch (error) {
        console.warn('Failed to load C++ language support:', error);
        return undefined;
      }
    },
  }),

  // WebAssembly
  LanguageDescription.of({
    name: 'WebAssembly',
    extensions: ['wat', 'wast'],
    async load() {
      try {
        return import('@codemirror/lang-wast').then((module) => module.wast());
      } catch (error) {
        console.warn('Failed to load WebAssembly language support:', error);
        return undefined;
      }
    },
  }),
];

export async function getLanguage(fileName: string) {
  const languageDescription = LanguageDescription.matchFilename(supportedLanguages, fileName);

  if (languageDescription) {
    try {
      const language = await languageDescription.load();
      return language;
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
  return supportedLanguages.flatMap((lang) => lang.extensions || []);
}
