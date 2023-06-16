import * as vscode from 'vscode'

interface Dojo {
	participants: string[]
	roundTime: number
}

export function activate(context: vscode.ExtensionContext) {

	console.log('Activating extension DOJO')

	let dojo: Dojo | undefined
	let accumulatedTime = 0
	let startTime: number | undefined
	let timerDisposable: NodeJS.Timer | undefined
	let statusBar: vscode.StatusBarItem | undefined

	setInterval(() => {
		if (statusBar) {
			if (!startTime) {
				if (typeof statusBar.backgroundColor === 'undefined') {
					statusBar.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground')
				} else {
					statusBar.backgroundColor = undefined
				}
			} else {
				statusBar.backgroundColor = undefined
			}
		}
	}, 500)

	function startTimer() {
		startTime = Date.now()
		timerDisposable = setInterval(updateStatusBar, 1000)

		if (statusBar) {
			statusBar.command = 'coding-dojo.stop-timer'
		}
	}

	function stopTimer() {
		accumulatedTime += getElapsedTime()
		startTime = undefined

		if (timerDisposable) {
			clearInterval(timerDisposable)
		}

		if (statusBar) {
			statusBar.command = 'coding-dojo.start-timer'
		}

		updateStatusBar()
	}

	function updateStatusBar() {
		if (statusBar) {
			statusBar.text = getStatusText()
		}
	}

	function getElapsedTime() {
		if (!startTime) { return accumulatedTime }

		return Math.floor((Date.now() - startTime)) + accumulatedTime
	}

	function getStatusText() {
		if (!dojo) { return '' }

		const timer = dojo.roundTime - getElapsedTime()
		return `[ Dojo :: ${dojo.participants[0]} and ${dojo.participants[1]} :: ${formatTimer(timer)} ]`
	}

	let startDojoCommand = vscode.commands.registerCommand('coding-dojo.start-coding-dojo', async () => {
		try {
			dojo = await startDojo()
		} catch (e) {
			if (e instanceof Error) {
				vscode.window.showWarningMessage(e.message)
			} else {
				vscode.window.showWarningMessage('There was an error starting the extension.')
			}
			return
		}

		statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left)
		statusBar.show()
		statusBar.command = 'coding-dojo.start-timer'
		updateStatusBar()

		vscode.window.showInformationMessage('Starting the coding dojo.\nClick the status bar to start and stop the stopwatch.\nUse the command "Dojo: rotate" to rotate the participants')
	})

	let startTimerCommand = vscode.commands.registerCommand('coding-dojo.start-timer', () => {
		if (!dojo) {
			vscode.window.showErrorMessage('No coding dojo session active. Use the command "Dojo: Start coding dojo".')
			return
		}

		startTimer()
	})

	let stopTimerCommand = vscode.commands.registerCommand('coding-dojo.stop-timer', () => {
		if (!dojo) {
			vscode.window.showErrorMessage('No coding dojo session active. Use the command "Dojo: Start coding dojo".')
			return
		}
		stopTimer()
	})

	context.subscriptions.push(startDojoCommand, startTimerCommand, stopTimerCommand)
}

export function deactivate() { }

async function startDojo(): Promise<Dojo> {
	const rawParticipant = await vscode.window.showInputBox({
		prompt: "Enter participant names separated by commas.",
		placeHolder: "Example: Luke, Leia, Han"
	})

	if (!rawParticipant) {
		throw new Error('No participant informed.')
	}

	const participants = rawParticipant
		.split(',')
		.map(a => a.trim())
		.sort(() => Math.random() - 0.5)

	if (participants.length < 2) {
		throw new Error('At least 2 participants are required.')
	}

	const rawRoundTime = await vscode.window.showInputBox({
		prompt: "Enter the duration of the round in minutes.",
		placeHolder: "Example: 5"
	})

	const roundTime = parseInt(rawRoundTime ?? '0')
	if (isNaN(roundTime) || roundTime < 1 || roundTime > 60) {
		throw new Error('Invalid round time. Must be between 1 and 60.')
	}

	return { participants, roundTime: roundTime * 1000 * 60 }
}

function formatTimer(ms: number): string {
	const sTotal = Math.trunc(ms / 1000)
	const minutes = Math.trunc(sTotal / 60)
	const seconds = sTotal % 60
	return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} `
}