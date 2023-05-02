const { cpSync } = require('fs-extra');

cpSync('npm', 'dist', { recursive: true });
cpSync('LICENSE', 'dist/LICENSE');
cpSync('README.md', 'dist/README.md');
