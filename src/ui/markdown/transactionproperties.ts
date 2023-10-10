import * as vscode from 'vscode';
import { Action, ContextItem, Steps, Transaction, TransactionAttributes } from "../../miiservice/abstract/responsetypes";
import { ShowMarkdownPreview, closeFileIfOpen } from "../../modules/vscode";
import transactionPropertiesVirtualDoc from '../virtualdocument/transactionproperties';

export async function CreateTransactionMarkdown(transaction: Transaction) {
    const inputs: { item: ContextItem, usages: Action[] }[] = [];
    for (const item of transaction?.Context?.ContextItem || []) {
        if (!item.ReadOnly) {
            inputs.push({ item, usages: [] });
        }
    }


    findUsageInSteps(transaction.Steps, inputs);
    const content = await createContent(inputs, transaction)

    transactionPropertiesVirtualDoc.content = content;
    const uri = vscode.Uri.parse('transactionproperties:' + transaction.Name.substring(transaction.Name.lastIndexOf('/')));
    const document = await vscode.workspace.openTextDocument(uri); // calls back into the provider
    vscode.languages.setTextDocumentLanguage(document, "markdown");
    await vscode.window.showTextDocument(document, { preview: false, viewColumn: vscode.ViewColumn.Beside });
    await ShowMarkdownPreview(document.uri);
    closeFileIfOpen(document.uri);
}


function findUsageInSteps(steps: Steps | string, inputs: { item: ContextItem, usages: Action[] }[]) {
    if (typeof steps === 'string') return;
    for (const step of steps.Step || []) {
        findUsageInSteps(step.Steps, inputs);
        if (typeof step.Actions === 'string') continue;
        for (const input of inputs || []) {
            for (const action of step.Actions.Action || []) {
                const links = JSON.stringify(action.IncomingLinks);
                if (links.includes('Transaction.' + input.item.Name)) {
                    input.usages.push(action);
                }
            }
        }
    }
}

async function createContent(inputs: { item: ContextItem, usages: Action[] }[], transaction: Transaction) {
    const mInputs = {}, usedInputs = {};
    let isDifferent = false;
    for (const input of inputs) {
        mInputs[input.item.Name] = 'remove';
        if (input.usages.length != 0) {
            usedInputs[input.item.Name] = 'remove';
        }
        else {
            isDifferent = true;
        }
    }
    let inputText = JSON.stringify(mInputs, null, ' ').replaceAll('\"remove\"', "").replaceAll('\"', "");
    inputText = '```javascript \n' + inputText + '\n ```';
    let usedInputText = JSON.stringify(usedInputs, null, ' ').replaceAll('\"remove\"', "").replaceAll('\"', "");
    usedInputText = '```javascript \nonly used inputs\n' + usedInputText + '\n ```';

    let output: string = 'Outputs: ' + (transaction.Context.ContextItem.filter((item) => item.ReadOnly).map((item) => item.Name).join(' ,'))

    let usages: string[] = [];

    for (const input of inputs) {
        let usage: string = '#### Input: ` ' + input.item.Name + ' ` *[' + input.item.Value["@_xsi:type"] + ']*' +
            '\n - *Description:*  ' + (input.item.Description || '') +
            '\n - *Default Value:*  ' + (input.item.Value["#text"] || '');

        usage += '\n - Count: ' + input.usages.length
        if (input.usages.length != 0)
            usage += ' \n' + input.usages.map((action) => '\t- ' + action.Name).join('\n');
        usages.push(usage + '\n');
    }

    const propertyInfo = generateAttributes(transaction.TransactionAttributes);

    const mainText =
        [
            '## Transaction Path: ' + transaction.Name,
            propertyInfo,
            '\n### Inputs as an object',
            inputText,
            isDifferent ? usedInputText : '',
            '\n' + output,
            '\n### Usages',
            usages.join('\n')
        ].join('\n');
   /*  const document = await OpenTextDocument(mainText, 'markdown', true, vscode.ViewColumn.Beside);
    await ShowMarkdownPreview(document.uri); */
    return mainText;



    function generateAttributes(attributes: TransactionAttributes) {
        const filteredAttributes = attributes.ContextItem.filter((item) => item.Name.includes('Created') || item.Name.includes('Edited'));
        let text: string = '`\n' + filteredAttributes.map((item) => item.Name + ': ' + item.Value["#text"]).join(', \n') + '\n`';;
        return text;
    }
}

