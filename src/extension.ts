import * as vscode from 'vscode'

class Session {
	participants: string[] = []
	roundTime = 5
	timerAccumulated = 0
	timerLastStart?: number
	statusBar?: vscode.StatusBarItem

	constructor() {
		setInterval(() => {
			this.onInterval()
		}, 500)
	}

	async setup() {
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

		if (participants.length !== new Set(participants).size) {
			throw new Error('One or more participants have the same name.')
		}

		const rawRoundTime = await vscode.window.showInputBox({
			prompt: "Enter the duration of the round in minutes.",
			placeHolder: "Example: 5"
		})

		const roundTime = parseInt(rawRoundTime ?? '0')
		if (isNaN(roundTime) || roundTime < 1 || roundTime > 60) {
			throw new Error('Invalid round time. Must be between 1 and 60.')
		}

		this.participants = participants
		this.roundTime = roundTime * 1000 * 60
		this.timerAccumulated = 0
		this.timerLastStart = undefined

		if (!this.statusBar) {
			this.statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left)
			this.statusBar.show()
		}
		this.statusBar.command = 'coding-dojo.start-timer'

		this.updateStatusBar()
	}

	play() {
		this.timerLastStart = Date.now()
		if (this.statusBar) {
			this.statusBar.command = 'coding-dojo.stop-timer'
		}

		this.updateStatusBar()
	}

	pause() {
		this.timerAccumulated = this.getElapsedTime()
		this.timerLastStart = undefined

		if (this.statusBar) {
			this.statusBar.command = 'coding-dojo.start-timer'
		}

		this.updateStatusBar()
	}

	rotate() {
		const currentPilot = this.participants.shift()
		if (!currentPilot) {
			throw new Error('Unexpected empty participant list')
		}
		this.participants.push(currentPilot)

		this.pause()
		this.timerAccumulated = 0
		this.updateStatusBar()
	}

	wasSetup() {
		return !!this.statusBar
	}

	private onInterval() {
		if (this.roundTime - this.getElapsedTime() <= 0) {
			this.rotate()
			vscode.window.showInformationMessage('Time is over!')
		}

		this.updateStatusBar()
	}

	private updateStatusBar() {
		if (this.statusBar) {
			const timeLeft = this.roundTime - this.getElapsedTime()
			this.statusBar.text = `[ Dojo | ${this.participants[0]} and ${this.participants[1]} | ${this.formatTimer(timeLeft)} ]`

			if (this.isPaused()) {
				this.statusBar.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground')
			} else {
				this.statusBar.backgroundColor = undefined
			}
		}
	}

	private isPaused() {
		return typeof this.timerLastStart === 'undefined'
	}

	private getElapsedTime() {
		if (!this.timerLastStart) {
			return this.timerAccumulated
		}

		return Math.floor((Date.now() - this.timerLastStart)) + this.timerAccumulated
	}

	private formatTimer(ms: number): string {
		const sTotal = Math.trunc(ms / 1000)
		const minutes = Math.trunc(sTotal / 60)
		const seconds = sTotal % 60
		return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} `
	}
}

export function activate(context: vscode.ExtensionContext) {

	console.log('Activating extension "DOJO"')

	const session = new Session()

	const startDojoCommand = vscode.commands.registerCommand('coding-dojo.start-coding-dojo', async () => {
		try {
			await session.setup()
		} catch (e) {
			if (e instanceof Error) {
				vscode.window.showErrorMessage(e.message)
			} else {
				vscode.window.showErrorMessage('There was an error starting the extension.')
			}
			return
		}

		vscode.window.showInformationMessage('Starting the coding dojo.\nClick the status bar to start and stop the stopwatch.\nUse the command "Dojo: rotate" to rotate the participants')
	})

	const startTimerCommand = vscode.commands.registerCommand('coding-dojo.start-timer', () => {
		if (!session.wasSetup()) {
			vscode.window.showErrorMessage('No coding dojo session active. Use the command "Dojo: Start coding dojo".')
			return
		}

		session.play()
	})

	const stopTimerCommand = vscode.commands.registerCommand('coding-dojo.stop-timer', () => {
		if (!session.wasSetup()) {
			vscode.window.showErrorMessage('No coding dojo session active. Use the command "Dojo: Start coding dojo".')
			return
		}

		session.pause()
	})

	const rotateCommand = vscode.commands.registerCommand('coding-dojo.rotate', () => {
		if (!session.wasSetup()) {
			vscode.window.showErrorMessage('No coding dojo session active. Use the command "Dojo: Start coding dojo".')
			return
		}

		session.rotate()
	})

	context.subscriptions.push(startDojoCommand, startTimerCommand, stopTimerCommand, rotateCommand)
}

export function deactivate() { }
