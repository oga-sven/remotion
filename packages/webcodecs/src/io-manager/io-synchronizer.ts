import type {ProgressTracker} from '@remotion/media-parser';
import {MediaParserInternals} from '@remotion/media-parser';
import type {LogLevel} from '../log';
import {Log} from '../log';

export const makeIoSynchronizer = ({
	logLevel,
	label,
	progress,
}: {
	logLevel: LogLevel;
	label: string;
	progress: ProgressTracker;
}) => {
	const eventEmitter = new MediaParserInternals.IoEventEmitter();

	let lastInput = 0;
	let lastInputKeyframe = 0;
	let lastOutput = 0;
	let inputsSinceLastOutput = 0;
	let inputs: number[] = [];
	let keyframes: number[] = [];

	// Once WebCodecs emits items, the user has to handle them
	// Let's keep count of how many items are unprocessed
	let unprocessed = 0;

	const getUnprocessed = () => unprocessed;

	const getUnemittedItems = () => {
		inputs = inputs.filter(
			(input) => Math.floor(input) > Math.floor(lastOutput),
		);
		return inputs.length;
	};

	const getUnemittedKeyframes = () => {
		keyframes = keyframes.filter(
			(keyframe) => Math.floor(keyframe) > Math.floor(lastOutput),
		);
		return keyframes.length;
	};

	const printState = (prefix: string) => {
		Log.trace(
			logLevel,
			`[${label}] ${prefix}, state: Last input = ${lastInput} Last input keyframe = ${lastInputKeyframe} Last output = ${lastOutput} Inputs since last output = ${inputsSinceLastOutput}, Queue = ${getUnemittedItems()} (${getUnemittedKeyframes()} keyframes), Unprocessed = ${getUnprocessed()}`,
		);
	};

	const inputItem = (timestamp: number, keyFrame: boolean) => {
		lastInput = timestamp;
		if (keyFrame) {
			lastInputKeyframe = timestamp;
			keyframes.push(timestamp);
		}

		inputsSinceLastOutput++;
		inputs.push(timestamp);

		eventEmitter.dispatchEvent('input', {
			timestamp,
			keyFrame,
		});
		printState('Input item');
	};

	const onOutput = (timestamp: number) => {
		lastOutput = timestamp;
		inputsSinceLastOutput = 0;
		eventEmitter.dispatchEvent('output', {
			timestamp,
		});
		unprocessed++;
		printState('Got output');
	};

	const waitForOutput = () => {
		const {promise, resolve} = MediaParserInternals.withResolvers<void>();
		const on = () => {
			eventEmitter.removeEventListener('output', on);
			resolve();
		};

		eventEmitter.addEventListener('output', on);
		return promise;
	};

	const waitForProcessed = () => {
		const {promise, resolve} = MediaParserInternals.withResolvers<void>();
		const on = () => {
			eventEmitter.removeEventListener('processed', on);
			resolve();
		};

		eventEmitter.addEventListener('processed', on);
		return promise;
	};

	const waitFor = async ({
		_unprocessed,
		unemitted,
		minimumProgress,
	}: {
		unemitted: number;
		_unprocessed: number;
		minimumProgress: number | null;
	}) => {
		await Promise.all([
			(async () => {
				while (getUnemittedItems() > unemitted) {
					await waitForOutput();
				}
			})(),
			(async () => {
				while (getUnprocessed() > _unprocessed) {
					await waitForProcessed();
				}
			})(),
			minimumProgress === null
				? Promise.resolve()
				: (async () => {
						while (progress.getSmallestProgress() < minimumProgress) {
							await progress.waitForProgress();
						}
					})(),
		]);
	};

	const waitForFinish = async () => {
		await waitFor({_unprocessed: 0, unemitted: 0, minimumProgress: null});
	};

	const onProcessed = () => {
		eventEmitter.dispatchEvent('processed', {});
		unprocessed--;
	};

	return {
		inputItem,
		onOutput,
		waitFor,
		waitForFinish,
		onProcessed,
		getUnprocessed,
	};
};
