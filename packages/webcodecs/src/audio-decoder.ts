import type {
	AudioOrVideoSample,
	AudioTrack,
	LogLevel,
	ProgressTracker,
} from '@remotion/media-parser';
import {getWaveAudioDecoder} from './get-wave-audio-decoder';
import {makeIoSynchronizer} from './io-manager/io-synchronizer';

export type WebCodecsAudioDecoder = {
	processSample: (audioSample: AudioOrVideoSample) => Promise<void>;
	waitForFinish: () => Promise<void>;
	close: () => void;
	flush: () => Promise<void>;
};

export type CreateAudioDecoderInit = {
	onFrame: (frame: AudioData) => Promise<void>;
	onError: (error: DOMException) => void;
	signal: AbortSignal;
	config: AudioDecoderConfig;
	logLevel: LogLevel;
	track: AudioTrack;
	progressTracker: ProgressTracker;
};

export const createAudioDecoder = ({
	onFrame,
	onError,
	signal,
	config,
	logLevel,
	track,
	progressTracker,
}: CreateAudioDecoderInit): WebCodecsAudioDecoder => {
	if (signal.aborted) {
		throw new Error('Not creating audio decoder, already aborted');
	}

	if (config.codec === 'pcm-s16') {
		return getWaveAudioDecoder({onFrame, track});
	}

	const ioSynchronizer = makeIoSynchronizer({
		logLevel,
		label: 'Audio decoder',
		progress: progressTracker,
	});

	let outputQueue = Promise.resolve();

	const audioDecoder = new AudioDecoder({
		output(inputFrame) {
			ioSynchronizer.onOutput(inputFrame.timestamp);
			const abortHandler = () => {
				inputFrame.close();
			};

			signal.addEventListener('abort', abortHandler, {once: true});
			outputQueue = outputQueue
				.then(() => {
					if (signal.aborted) {
						return;
					}

					return onFrame(inputFrame);
				})
				.then(() => {
					ioSynchronizer.onProcessed();
					signal.removeEventListener('abort', abortHandler);
					return Promise.resolve();
				})
				.catch((err) => {
					inputFrame.close();
					onError(err);
				});
		},
		error(error) {
			onError(error);
		},
	});

	const close = () => {
		// eslint-disable-next-line @typescript-eslint/no-use-before-define
		signal.removeEventListener('abort', onAbort);

		if (audioDecoder.state === 'closed') {
			return;
		}

		audioDecoder.close();
	};

	const onAbort = () => {
		close();
	};

	signal.addEventListener('abort', onAbort);

	audioDecoder.configure(config);

	const processSample = async (audioSample: AudioOrVideoSample) => {
		if (audioDecoder.state === 'closed') {
			return;
		}

		await ioSynchronizer.waitFor({
			unemitted: 10,
			_unprocessed: 2,
			minimumProgress: audioSample.timestamp - 5_000_000,
		});

		// Don't flush, it messes up the audio

		const chunk = new EncodedAudioChunk(audioSample);
		audioDecoder.decode(chunk);
		ioSynchronizer.inputItem(chunk.timestamp, audioSample.type === 'key');
	};

	let queue = Promise.resolve();

	return {
		processSample: (sample: AudioOrVideoSample) => {
			// In example.avi, we have samples with 0 data
			// Chrome fails on these
			if (sample.data.length === 0) {
				return queue;
			}

			queue = queue.then(() => processSample(sample));
			return queue;
		},
		waitForFinish: async () => {
			// Firefox might throw "Needs to be configured first"
			try {
				await audioDecoder.flush();
			} catch {}

			await queue;
			await ioSynchronizer.waitForFinish();
			await outputQueue;
		},
		close,
		flush: async () => {
			await audioDecoder.flush();
		},
	};
};
