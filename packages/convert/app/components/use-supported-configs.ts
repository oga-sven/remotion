import {LogLevel, TracksField} from '@remotion/media-parser';
import {ConvertMediaContainer} from '@remotion/webcodecs';
import {useEffect, useState} from 'react';
import {getSupportedConfigs, SupportedConfigs} from './get-supported-configs';

export const useSupportedConfigs = ({
	container,
	tracks,
	logLevel,
}: {
	container: ConvertMediaContainer;
	tracks: TracksField | null;
	logLevel: LogLevel;
}) => {
	const [state, setState] = useState<
		Record<ConvertMediaContainer, SupportedConfigs | null>
	>({mp4: null, webm: null, wav: null});

	useEffect(() => {
		if (!tracks) {
			return;
		}

		getSupportedConfigs({
			tracks,
			container,
			bitrate: 128000,
			logLevel,
		}).then((supportedConfigs) => {
			setState((prev) => ({
				...prev,
				[container]: supportedConfigs,
			}));
		});
	}, [container, logLevel, tracks]);

	return state[container];
};
