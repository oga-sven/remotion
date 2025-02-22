import {convertMedia} from '@remotion/webcodecs';
import {
	addTestWatcher,
	allowSafariAudioDrop,
	makeProgressReporter,
	TestStructure,
} from './test-structure';

export const basicMp4ToWebM = (): TestStructure => {
	const src =
		'https://remotion-assets.s3.eu-central-1.amazonaws.com/example-videos/bigbuckbunny.mp4';

	return addTestWatcher({
		name: 'Basic MP4 to WebM',
		src,
		async execute(onUpdate) {
			await convertMedia({
				src,
				container: 'webm',
				onAudioTrack: allowSafariAudioDrop,
				onProgress: makeProgressReporter(onUpdate),
			});
		},
	});
};

export const av1WebmToMp4 = (): TestStructure => {
	const src =
		'https://remotion-assets.s3.eu-central-1.amazonaws.com/example-videos/av1-bbb.webm';

	return addTestWatcher({
		name: 'AV1 WebM to MP4',
		src,
		async execute(onUpdate) {
			await convertMedia({
				src,
				container: 'mp4',
				onAudioTrack: allowSafariAudioDrop,
				onProgress: makeProgressReporter(onUpdate),
			});
		},
	});
};

export const weirdMp4aConfig = (): TestStructure => {
	const src =
		'https://remotion-assets.s3.eu-central-1.amazonaws.com/example-videos/riverside.mp4';

	return addTestWatcher({
		name: 'weird mp4a config',
		src,
		async execute(onUpdate) {
			await convertMedia({
				src,
				container: 'webm',
				audioCodec: 'opus',
				videoCodec: 'vp8',
				onAudioTrack: allowSafariAudioDrop,
				onProgress: makeProgressReporter(onUpdate),
			});
		},
	});
};

export const convertToWav = (): TestStructure => {
	const src =
		'https://remotion-assets.s3.eu-central-1.amazonaws.com/example-videos/riverside.mp4';

	return addTestWatcher({
		name: 'convert to wav',
		src,
		async execute(onUpdate) {
			await convertMedia({
				src,
				container: 'wav',
				onProgress: makeProgressReporter(onUpdate),
			});
		},
	});
};

export const lpcmLivePhoto = (): TestStructure => {
	const src =
		'https://remotion-assets.s3.eu-central-1.amazonaws.com/example-videos/livephoto-lpcm-audio.mov';
	return addTestWatcher({
		name: 'HEVC Live Photo + LPCM audio codec',
		src,
		async execute(onUpdate) {
			await convertMedia({
				src,
				container: 'webm',
				onAudioTrack: allowSafariAudioDrop,
				onProgress: makeProgressReporter(onUpdate),
			});
		},
	});
};

export const aviToMp4 = (): TestStructure => {
	const src =
		'https://remotion-assets.s3.eu-central-1.amazonaws.com/example-videos/example.avi';
	return addTestWatcher({
		name: 'AVI to MP4',
		src,
		async execute(onUpdate) {
			await convertMedia({
				src,
				container: 'mp4',
				onProgress: makeProgressReporter(onUpdate),
			});
		},
	});
};

export const testList: TestStructure[] = [
	basicMp4ToWebM(),
	av1WebmToMp4(),
	aviToMp4(),
	convertToWav(),
	weirdMp4aConfig(),
	lpcmLivePhoto(),
];
