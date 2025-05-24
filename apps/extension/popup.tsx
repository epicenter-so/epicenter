import GithubIcon from 'react:./components/icons/github.svg';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeProvider, useTheme } from '@/components/ui/theme-provider';
import { WHISPERING_RECORDINGS_PATHNAME } from '@repo/shared';
import {
	ClipboardIcon,
	ListIcon,
	Loader2Icon,
	MoonIcon,
	SlidersVerticalIcon,
	SunIcon,
} from 'lucide-react';
import { createNotification } from '~background/messages/extension/createNotification';
import { WhisperingButton } from '~components/WhisperingButton';
import { app } from '~lib/app';
import { extension } from '~lib/extension';
import { getOrCreateWhisperingTabId } from '~lib/getOrCreateWhisperingTabId';
import {
	useWhisperingRecorderState,
	useWhisperingTranscribedText,
} from '~lib/storage';
import './style.css';

function IndexPopup() {
	return (
		<div className="h-[28rem] w-96">
			<div className="relative flex min-h-screen flex-col">
				<main className="flex flex-1 justify-center p-4">
					<IndexPage />
				</main>
			</div>
		</div>
	);
}

function IndexPage() {
	const recorderState = useWhisperingRecorderState();
	const transcribedText = useWhisperingTranscribedText();

	const recorderStateAsIcon = recorderState === 'SESSION+RECORDING' ? '⏹️' : '🎙️';

	const copyToClipboardText = (() => {
		if (recorderState === 'LOADING') return '...';
		if (transcribedText) return transcribedText;
		return '';
	})();

	return (
		<ThemeProvider defaultTheme="system" storageKey="whispering-theme">
			<div className="flex h-[28rem] w-96 flex-col items-center justify-center gap-4 text-center">
				<div className="flex flex-col gap-4">
					<h1 className="scroll-m-20 font-bold text-4xl tracking-tight lg:text-5xl">
						Start recording
					</h1>
					<p className="text-muted-foreground">
						Click the <span>🎙</span> button to start. Allow access to your
						microphone.
					</p>
				</div>
				<div className="relative">
					<WhisperingButton
						tooltipContent="Toggle recording"
						className="h-full w-full transform items-center justify-center overflow-hidden duration-300 ease-in-out"
						onClick={async () => {
							const { error: toggleRecordingError } =
								await app.toggleRecording();
							if (toggleRecordingError) {
								await extension.createNotification({
									notifyOptions: toggleRecordingError,
								});
							}
						}}
						aria-label="Toggle recording"
						variant="ghost"
					>
						<span
							style={{ filter: 'drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.5))' }}
							className="text-[100px] leading-none"
						>
							{recorderStateAsIcon}
						</span>
					</WhisperingButton>
					{recorderState === 'SESSION+RECORDING' && (
						<WhisperingButton
							tooltipContent="Cancel recording"
							className="-right-14 absolute bottom-0 transform text-2xl"
							onClick={async () => {
								const { error: cancelRecordingError } =
									await app.cancelRecording();
								if (cancelRecordingError) {
									await extension.createNotification({
										notifyOptions: cancelRecordingError,
									});
								}
							}}
							aria-label="Cancel recording"
							variant="ghost"
						>
							🚫
						</WhisperingButton>
					)}
					{recorderState === 'SESSION' && (
						<WhisperingButton
							tooltipContent="End recording session"
							className="-right-14 absolute bottom-0 transform text-2xl"
							onClick={async () => {
								const {  error: closeRecordingSessionError } =
									await app.closeRecordingSessionWithToast();
								if (closeRecordingSessionError) {
									await extension.createNotification({
										notifyOptions: closeRecordingSessionError,
									});
								}
							}}
							aria-label="End recording session"
							variant="ghost"
						>
							🔴
						</WhisperingButton>
					)}
				</div>
				<div className="flex flex-col gap-2">
					<Label htmlFor="transcribed-text" className="sr-only">
						Transcribed Text
					</Label>
					<div className="flex w-full max-w-80 items-center gap-2">
						<Input
							id="transcribed-text"
							className="w-full"
							placeholder="Transcribed text will appear here..."
							readOnly
							value={copyToClipboardText}
						/>
						<WhisperingButton
							tooltipContent="Copy transcribed text"
							className="px-4 py-2 dark:bg-secondary dark:text-secondary-foreground"
							onClick={() => {
								navigator.clipboard.writeText(copyToClipboardText);
							}}
						>
							{recorderState === 'LOADING' ? (
								<Loader2Icon className="h-6 w-6 animate-spin" />
							) : (
								<ClipboardIcon className="h-6 w-6" />
							)}
						</WhisperingButton>
					</div>
				</div>
				<div className="flex flex-col items-center justify-center gap-3">
					<NavItems />
					<p className="text-foreground/75 text-sm leading-6">
						Click the microphone or press your configured global{' '}
						<WhisperingButton
							tooltipContent="Keyboard Shortcuts"
							aria-label="Keyboard Shortcuts"
							variant="link"
							className="px-0.5"
							onClick={() => {
								chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
							}}
						>
							<kbd className="relative rounded bg-muted px-[0.3rem] py-[0.15rem] font-mono font-semibold text-sm">
								shortcut
							</kbd>
						</WhisperingButton>{' '}
						to start recording.
					</p>
					<p className="font-light text-muted-foreground text-sm">
						Check out the{' '}
						<WhisperingButton
							tooltipContent="Check out the desktop app"
							variant="link"
							size="inline"
							onClick={() => {
								chrome.tabs.create({
									url: 'https://github.com/braden-w/whispering/releases',
								});
							}}
						>
							desktop app
						</WhisperingButton>{' '}
						for more integrations!
					</p>
				</div>
			</div>
		</ThemeProvider>
	);
}

function NavItems() {
	const { theme, setTheme } = useTheme();

	return (
		<nav className="flex items-center">
			<WhisperingButton
				tooltipContent="Recordings"
				onClick={async () => {
					const { data: whisperingTabId, error: getOrCreateWhisperingTabIdError } =
						await getOrCreateWhisperingTabId();
					if (getOrCreateWhisperingTabIdError) {
						createNotification(getOrCreateWhisperingTabIdError);
						return;
					}
					const tab = await chrome.tabs.get(whisperingTabId);
					if (!tab.url) {
						createNotification({
							title: 'Whispering tab has no URL',
							description: 'The Whispering tab has no URL.',
							variant: 'error',
						});
						return;
					}
					const url = new URL(tab.url);

					if (url.pathname === WHISPERING_RECORDINGS_PATHNAME) {
						return await chrome.tabs.update(whisperingTabId, {
							active: true,
						});
					}
					url.pathname = WHISPERING_RECORDINGS_PATHNAME;
					await chrome.tabs.update(whisperingTabId, {
						url: url.toString(),
						active: true,
					});
				}}
				variant="ghost"
				size="icon"
			>
				<ListIcon className="h-4 w-4" aria-hidden="true" />
			</WhisperingButton>

			<WhisperingButton
				tooltipContent="Settings"
				onClick={() => chrome.runtime.openOptionsPage()}
				variant="ghost"
				size="icon"
			>
				<SlidersVerticalIcon className="h-4 w-4" aria-hidden="true" />
			</WhisperingButton>

			<WhisperingButton
				tooltipContent="View project on GitHub"
				onClick={() => {
					chrome.tabs.create({ url: 'https://github.com/braden-w/whispering' });
				}}
				variant="ghost"
				size="icon"
			>
				<GithubIcon
					className="h-4 w-4 fill-current text-foreground"
					aria-hidden="true"
				/>
			</WhisperingButton>
			<WhisperingButton
				className="relative"
				tooltipContent="Toggle dark mode"
				onClick={() => {
					setTheme(theme === 'dark' ? 'light' : 'dark');
				}}
				variant="ghost"
				size="icon"
			>
				<SunIcon className="dark:-rotate-90 h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:scale-0" />
				<MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
			</WhisperingButton>
		</nav>
	);
}

export default IndexPopup;
