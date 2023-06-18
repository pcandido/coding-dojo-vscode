import * as vscode from 'vscode'
import { Dojo } from './dojo'

export function activate(context: vscode.ExtensionContext) {

	console.log('Activating extension "DOJO"')

	const session = new Dojo()

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

	const editCommand = vscode.commands.registerCommand('coding-dojo.edit', async () => {
		if (!session.wasSetup()) {
			vscode.window.showErrorMessage('No coding dojo session active. Use the command "Dojo: Start coding dojo".')
			return
		}

		await session.edit()
	})

	context.subscriptions.push(startDojoCommand, startTimerCommand, stopTimerCommand, rotateCommand, editCommand)
}

export function deactivate() { }
