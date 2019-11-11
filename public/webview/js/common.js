(function(){
    const vscode = acquireVsCodeApi();
    var logCtr = getElById('log');
    var projectPath = getElById('projectPath');
    var projectType = getElById('projectType');
    var projectTmpls = getElById('projectTmpls');
    var openFolderDialog = getElById('openFolderDialog');

    log(`vscode state:${JSON.stringify(vscode.getState())}, vscode: ${JSON.stringify(vscode)}`);
    
    function postMessage(message) {
        vscode.postMessage(message);
    }

    function createElement(targetName){
        return document.createElement(targetName);
    }

    function createOption(label, value){
        var option = createElement('option');
            option.label = label;
            option.value = value;
        return option;
    }

    function log(msg){
        logCtr.innerHTML += msg+'<br/>';
    }

    function resetSelect(select){
        select.innerHTML = '';
        select.value = '';
        select.add(createOption('Empty', 'empty'));
    }

    function getElById(name){
        return document.getElementById(name);
    }
    
    // events area
    projectType.onchange = (event) => {
        var target = event.target;
        log(`projectType onchange:`, target.value);
        postMessage({
            command: 'projectType',
            data: target.value
        });
    }

    openFolderDialog.onclick = () => {
        postMessage({
            command: 'openFolderDialog'
        });
    }

    window.addEventListener('message', (event) => {
        const message = event.data;
        const data = message.data;
        log(`message:${JSON.stringify(message)}`);
        try {
            switch(message.command) {
                case 'init':
                        projectPath.value = data.projectPath;
                        const projectTypes = data.projectTypes;
                        if(projectTypes && projectTypes.length > 0){
                            projectType.innerHTML = '';
                            projectType.value = '';
                            projectTypes.forEach((_projectType) => {
                                const option = createOption(_projectType, _projectType);
                                projectType.add(option);
                            });
                            
                            postMessage({
                                command:'projectType',
                                data:projectTypes[0]
                            });
                        }
                    break;
                case 'tmpls':
                        
                        if (data && data.length > 0) {
                            resetSelect(projectTmpls);
                            
                            data.forEach((tmpl) => {
                                var option = createOption(tmpl, tmpl);
                                projectTmpls.add(option);
                            });
                        } else {
                            resetSelect(projectTmpls);
                        }
                    break;
            }
        } catch (error) {
            log(JSON.stringify(error));
        }
    });
}())