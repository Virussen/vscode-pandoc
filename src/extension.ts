import * as vscode from 'vscode'; 
import {spawn, exec} from 'child_process';
import * as path from 'path';

function setStatusBarText(what, docType){
    var date=new Date();
    var text=what + ' [' + docType + '] ' + date.toLocaleTimeString();
    vscode.window.setStatusBarMessage(text, 1500);
}

function getOutputDir(quickPickLabel) {
    var outputDir;
    
    switch (quickPickLabel) {
        case 'pdf':
            outputDir = vscode.workspace.getConfiguration('pandoc').get('pdfOutputDirString');
            console.log('outputDirstring = ' + outputDir);
            break;
        case 'docx':
            outputDir = vscode.workspace.getConfiguration('pandoc').get('docxOutputDirString');
            console.log('outputDirstring = ' + outputDir);
            break;
        case 'html':
            outputDir = vscode.workspace.getConfiguration('pandoc').get('htmlOutputDirString');
            console.log('outputDirstring = ' + outputDir);
            break;
    }
    
    return outputDir;
}

function getPandocOptions(quickPickLabel) {
    var pandocOptions;
    
    switch (quickPickLabel) {
        case 'pdf':
            pandocOptions = vscode.workspace.getConfiguration('pandoc').get('pdfOptString');
            console.log('pdocOptstring = ' + pandocOptions);
            break;
        case 'docx':
            pandocOptions = vscode.workspace.getConfiguration('pandoc').get('docxOptString');
            console.log('pdocOptstring = ' + pandocOptions);
            break;
        case 'html':
            pandocOptions = vscode.workspace.getConfiguration('pandoc').get('htmlOptString');
            console.log('pdocOptstring = ' + pandocOptions);
            break;
    }
    
    return pandocOptions;
}

export function activate(context: vscode.ExtensionContext) {

	console.log('Congratulations, your extension "vscode-pandoc" is now active!'); 
    
	var disposable = vscode.commands.registerCommand('pandoc.render', () => {
        
        var editor = vscode.window.activeTextEditor;
        var fullName = path.normalize(editor.document.fileName);
        var filePath = path.dirname(fullName);
        var fileName = path.basename(fullName);
        var fileNameOnly = path.parse(fileName).name;
        
        let items: vscode.QuickPickItem[] = [];
        items.push({ label: 'pdf',  description: 'Render as pdf document'  });
        items.push({ label: 'docx', description: 'Render as word document' });
        items.push({ label: 'html', description: 'Render as html document' });
                                 
        vscode.window.showQuickPick(items).then((qpSelection) => {
            if (!qpSelection) {
                return;
            }
            
            var inFile = path.join(filePath, fileName).replace(/(^.*$)/gm,"\"" + "$1" + "\"");
            var outFile = (path.join(filePath, fileNameOnly) + '.' + qpSelection.label).replace(/(^.*$)/gm,"\"" + "$1" + "\"");
            
            setStatusBarText('Generating', qpSelection.label);
            
            var pandocOptions = getPandocOptions(qpSelection.label);
            var outputDir = getOutputDir(qpSelection.label);
            if (outputDir.length > 0) {
                var subPath = path.join(filePath, outputDir);
                outFile = (path.join(subPath, fileNameOnly) + '.' + qpSelection.label).replace(/(^.*$)/gm,"\"" + "$1" + "\"");
            
            // debug
            console.log('debug: inFile = ' + inFile);
            if (outputDir.length > 0) {
                console.log('debug: outputDir = ' + outputDir);                
            }                            
            console.log('debug: outFile = ' + outFile);
            console.log('debug: pandoc ' + inFile + ' -o ' + outFile + pandocOptions);
            
            var space = '\x20';            
            var targetExec = 'pandoc' + space + inFile + space + '-o' + space + outFile + space + pandocOptions;
            console.log('debug: exec ' + targetExec);
            
            var child = exec(targetExec, function(error, stdout, stderr) {
                                
                if (stdout !== null) {
                    console.log(stdout.toString());
                }
                
                if (stderr !== null) {
                    console.log(stderr.toString());
                }
                
                if (error !== null) {
                    console.log('exec error: ' + error);
                } else {
                    setStatusBarText('Launching', qpSelection.label);
                    switch(process.platform) {
                      case 'darwin':
                        exec('open ' + outFile);
                        break;
                      case 'linux':
                        exec('xdg-open ' + outFile);
                        break;
                      default:
                        exec(outFile);
                    }
                }
            });
        });
    });
	
    context.subscriptions.push(disposable);
}