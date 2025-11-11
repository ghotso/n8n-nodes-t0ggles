const fs = require('fs');
const path = require('path');

const projectRoot = path.join(__dirname, '..');

const assets = [
	path.join(projectRoot, 'nodes', 'T0ggles', 't0ggles.png'),
];

for (const assetPath of assets) {
	if (!fs.existsSync(assetPath)) continue;

	const relative = path.relative(path.join(projectRoot, 'nodes'), assetPath);
	const destination = path.join(projectRoot, 'dist', 'nodes', relative);

	fs.mkdirSync(path.dirname(destination), { recursive: true });
	fs.copyFileSync(assetPath, destination);
}

