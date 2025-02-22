import {MediaParserVideoCodec} from '@remotion/media-parser';
import {VideoOperation} from '@remotion/webcodecs';
import React from 'react';
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from './ui/select';
import {VideoOperationOption} from './VideoOperationOption';

export const VideoCodecSelection: React.FC<{
	readonly videoOperations: VideoOperation[];
	readonly index: number;
	readonly setIndex: (v: number) => void;
	readonly currentVideoCodec: MediaParserVideoCodec | null;
}> = ({videoOperations, index, setIndex, currentVideoCodec}) => {
	return (
		<Select
			disabled={videoOperations.length < 2}
			value={String(index)}
			onValueChange={(v) => setIndex(Number(v))}
		>
			<SelectTrigger id="videoCodec">
				<SelectValue placeholder="Select a video codec" />
			</SelectTrigger>
			<SelectContent>
				{videoOperations.map((operation, i) => {
					return (
						<SelectGroup key={i}>
							<SelectItem
								// eslint-disable-next-line react/jsx-key
								value={String(i)}
							>
								<VideoOperationOption
									currentVideoCodec={currentVideoCodec}
									operation={operation}
								/>
							</SelectItem>
						</SelectGroup>
					);
				})}
			</SelectContent>
		</Select>
	);
};
