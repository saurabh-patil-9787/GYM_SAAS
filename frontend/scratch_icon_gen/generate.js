const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const svgPath = path.resolve(__dirname, '../public/logo.svg');
const svgData = fs.readFileSync(svgPath, 'utf8');

// Transform SVG:
// Remove background rect
let transformedSvg = svgData.replace(/<rect[^>]+fill="#0f0f1a"[^>]*\/>/, '');
// Change purple to white
transformedSvg = transformedSvg.replace(/#a855f7/g, '#ffffff');

// Also explicitly set width and height to 100% for sharp scaling
// Actually sharp works best if width and height are removed or set to the target size.
transformedSvg = transformedSvg.replace(/width="512"/, 'width="100%"');
transformedSvg = transformedSvg.replace(/height="512"/, 'height="100%"');

const svgBuffer = Buffer.from(transformedSvg);

const sizes = [
    { dir: 'drawable-mdpi', size: 24 },
    { dir: 'drawable-hdpi', size: 36 },
    { dir: 'drawable-xhdpi', size: 48 },
    { dir: 'drawable-xxhdpi', size: 72 },
    { dir: 'drawable-xxxhdpi', size: 96 },
];

const basePath = path.resolve(__dirname, '../android/app/src/main/res');

async function generateIcons() {
    for (const item of sizes) {
        const outDir = path.join(basePath, item.dir);
        if (!fs.existsSync(outDir)) {
            fs.mkdirSync(outDir, { recursive: true });
        }
        
        const outFile = path.join(outDir, 'ic_stat_trackon.png');
        
        await sharp(svgBuffer)
            .resize(item.size, item.size)
            .png({ force: true })
            .toFile(outFile);
            
        console.log(`Created: ${outFile} (${item.size}x${item.size})`);
    }
}

generateIcons().catch(err => {
    console.error('Error generating icons:', err);
    process.exit(1);
});
