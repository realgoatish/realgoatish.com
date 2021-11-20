import imagemin from 'imagemin';
import imageminSvgo from 'imagemin-svgo';

(async () => {
	await imagemin(['static/svg/*.svg'], {
		destination: 'temp/svg',
		plugins: [
			imageminSvgo({
				plugins: [
					{ name: 'cleanupIDs', params: { remove: false } },
					{ name: 'cleanupNumericValues', params: { floatPrecision: 2 } },
					{ name: 'removeStyleElement' },
					{ name: 'removeTitle' },
          { name: 'convertShapeToPath' },
          { name: 'mergePaths' }
				],
				multipass: true
			})
		]
	});
	console.log('SVG-Icons were successfully optimized');
})();
