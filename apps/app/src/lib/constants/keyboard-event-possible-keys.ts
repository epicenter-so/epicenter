/**
 * Comprehensive list of all possible values that can be returned by `e.key.toLowerCase()`
 * This includes printable characters, special keys, navigation keys, function keys, etc.
 * Used for validation and type safety in keyboard event handling.
 */
const KEYBOARD_EVENT_POSSIBLE_KEYS = [
	// Letters (lowercase)
	'a',
	'b',
	'c',
	'd',
	'e',
	'f',
	'g',
	'h',
	'i',
	'j',
	'k',
	'l',
	'm',
	'n',
	'o',
	'p',
	'q',
	'r',
	's',
	't',
	'u',
	'v',
	'w',
	'x',
	'y',
	'z',

	// Numbers
	'0',
	'1',
	'2',
	'3',
	'4',
	'5',
	'6',
	'7',
	'8',
	'9',

	// Symbols and punctuation (these remain the same with toLowerCase())
	'`',
	'~',
	'!',
	'@',
	'#',
	'$',
	'%',
	'^',
	'&',
	'*',
	'(',
	')',
	'-',
	'_',
	'=',
	'+',
	'[',
	'{',
	']',
	'}',
	'\\',
	'|',
	';',
	':',
	"'",
	'"',
	',',
	'<',
	'.',
	'>',
	'/',
	'?',

	// Whitespace
	' ', // Space
	'enter',
	'tab',

	// Navigation keys (lowercase)
	'arrowleft',
	'arrowright',
	'arrowup',
	'arrowdown',
	'home',
	'end',
	'pageup',
	'pagedown',

	// Editing keys (lowercase)
	'backspace',
	'delete',
	'insert',
	'clear',
	'copy',
	'cut',
	'paste',
	'redo',
	'undo',

	// Function keys (lowercase)
	'f1',
	'f2',
	'f3',
	'f4',
	'f5',
	'f6',
	'f7',
	'f8',
	'f9',
	'f10',
	'f11',
	'f12',
	'f13',
	'f14',
	'f15',
	'f16',
	'f17',
	'f18',
	'f19',
	'f20',
	'f21',
	'f22',
	'f23',
	'f24',

	// Modifier keys (lowercase)
	'control',
	'shift',
	'alt',
	'meta', // meta is Command on Mac, Windows key on PC
	'altgraph',
	'capslock',
	'numlock',
	'scrolllock',
	'fn',
	'fnlock',
	'hyper',
	'super',
	'symbol',
	'symbollock',

	// Special keys (lowercase)
	'escape',
	'contextmenu',
	'pause',
	'break',
	'printscreen',
	'help',
	'browserback',
	'browserforward',
	'browserhome',
	'browserrefresh',
	'browsersearch',
	'browserstop',
	'browserfavorites',

	// Media keys (lowercase)
	'mediaplaypause',
	'mediaplay',
	'mediapause',
	'mediastop',
	'mediatracknext',
	'mediatrackprevious',
	'volumeup',
	'volumedown',
	'volumemute',

	// Other special values
	'dead', // Dead keys for creating accented characters
	'unidentified', // When the key cannot be identified
	'process', // IME processing
	'compose', // Compose key
	'accept',
	'again',
	'attn',
	'cancel',
	'execute',
	'find',
	'finish',
	'props',
	'select',
	'zoomout',
	'zoomin',

	// Soft keys (mobile/special keyboards)
	'soft1',
	'soft2',
	'soft3',
	'soft4',

	// Additional editing keys
	'crsel',
	'exsel',
	'eraseof',

	// Audio/launch keys
	'launchapplication1',
	'launchapplication2',
	'launchmail',
	'launchmediacenter',

	// Asian language input keys
	'alphanumeric',
	'codeinput',
	'convert',
	'finalmode',
	'groupfirst',
	'grouplast',
	'groupnext',
	'groupprevious',
	'modechange',
	'nextcandidate',
	'nonconvert',
	'previouscandidate',
	'singlecandidate',

	// Additional keys
	'allcandidates',
	'hankaku',
	'hiragana',
	'hiraganakatakana',
	'junja',
	'kanamode',
	'kanjimode',
	'katakana',
	'romaji',
	'zenkaku',
	'zenkakuhankaku',
] as const;

/**
 * Union type representing all possible keyboard key values that can be
 * returned by `KeyboardEvent.key.toLowerCase()`. This comprehensive type
 * includes all standard keyboard keys across different platforms and layouts:
 * - Printable characters (letters, numbers, symbols)
 * - Navigation and editing keys
 * - Function and modifier keys
 * - Media control and special system keys
 * - International/IME keys for various languages
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values MDN Keyboard Event Key Values}
 */
export type KeyboardEventPossibleKey =
	(typeof KEYBOARD_EVENT_POSSIBLE_KEYS)[number];
