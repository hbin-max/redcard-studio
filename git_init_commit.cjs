const { execSync } = require('child_process');

try {
  execSync('git config user.name "Developer"');
  execSync('git config user.email "dev@local.com"');
  console.log('Staging files...');
  execSync('git add .');
  console.log('Committing files...');
  const out = execSync('git commit -m "feat: initial release with Android APK and Desktop build pipelines"').toString();
  console.log(out);
  console.log('Git branch:');
  console.log(execSync('git branch').toString());
} catch (e) {
  console.error('Git error:', e.stdout ? e.stdout.toString() : e.message);
}
