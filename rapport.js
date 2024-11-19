// Fonction pour afficher les messages dans l'interface avec style infobulle
function showMessage(message, type = 'info') {
    const messageContainer = document.getElementById('message');
    messageContainer.innerHTML = message;
    messageContainer.className = `message ${type}`;
    messageContainer.style.display = 'block';  // Rendre le message visible
}

document.getElementById('directory-input').addEventListener('change', function () {
    const files = this.files;

    let validFiles = Array.from(files).filter(file => !file.name.startsWith('~$')); // Filtrer les fichiers temporaires

    const directoryUploadLabel = document.getElementById('directory-upload-label');
    const processButton = document.getElementById('process-btn');
    const messageContainer = document.getElementById('message');

    if (validFiles.length > 0) {
        // Afficher le nom du répertoire sélectionné et changer la couleur du bouton
        const directoryName = validFiles[0].webkitRelativePath.split("/")[0];
        directoryUploadLabel.innerText = `Répertoire sélectionné : ${directoryName}`;
        directoryUploadLabel.style.backgroundColor = '#4CAF50';  // Couleur verte
        processButton.style.display = 'inline-block';  // Afficher le bouton de traitement

        // Afficher la liste des fichiers dans la section des messages
        let fileList = "<strong>Fichiers chargés pour le traitement :</strong><br><ul>";
        for (let i = 0; i < validFiles.length; i++) {
            fileList += `<li>${validFiles[i].name}</li>`;
        }
        fileList += "</ul>";
        showMessage(fileList, 'info');  // Utiliser le style "info" défini par le CSS
    } else {
        directoryUploadLabel.innerText = 'Choisir un répertoire';
        directoryUploadLabel.style.backgroundColor = '';  // Réinitialiser la couleur du bouton
        processButton.style.display = 'none';  // Cacher le bouton de traitement
        messageContainer.innerHTML = '';  // Réinitialiser le message en cas d'annulation
    }
});

document.getElementById('process-btn').addEventListener('click', async function () {
    const directoryInput = document.getElementById('directory-input');
    const files = directoryInput.files;

    let validFiles = Array.from(files).filter(file => !file.name.startsWith('~$')); // Filtrer les fichiers temporaires

    if (!validFiles.length) {
        showMessage("Aucun fichier Excel valide trouvé dans le répertoire.", "error");
        return;
    }

    // Activation de la barre de progression
    const progressBar = document.getElementById('progress-bar');
    const progressContainer = progressBar.parentElement;
    progressBar.style.width = '0%'; 
    progressContainer.style.display = 'block';  // Afficher la barre de progression

    const combinedWorkbook = new ExcelJS.Workbook();
    const combinedWorksheet = combinedWorkbook.addWorksheet('Rapport Combiné');

    combinedWorksheet.mergeCells('A1:J1');
    combinedWorksheet.getCell('A1').value = "Déclaration de droits musicaux";
    combinedWorksheet.getCell('A1').font = { size: 24, bold: true, color: { argb: 'FFFFFFFF' } };
    combinedWorksheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };
    combinedWorksheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6FA1B6' } };
    combinedWorksheet.getRow(1).height = 40;

    let currentRow = 2;
    let progressStep = 100 / validFiles.length; // Calcul de la progression par fichier

    for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];

        // Ignorer les fichiers temporaires ou cachés qui commencent par '~$'
        if (file.name.startsWith('~$') || !file.name.endsWith('.xlsx')) {
            showMessage(`Le fichier ${file.name} est ignoré car il est invalide ou temporaire.`, "warning");
            continue;
        }

        try {
            const arrayBuffer = await file.arrayBuffer();
            const workbook = await new ExcelJS.Workbook().xlsx.load(arrayBuffer);
            const worksheet = workbook.worksheets[0]; // Prendre la première feuille

            worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
                const firstCell = row.getCell(1).value;

                // Éviter d'ajouter les lignes contenant le message de contact
                if (typeof firstCell === 'string' && firstCell.includes('Pour toute question')) {
                    return; // Ne pas ajouter cette ligne
                }

                if (rowNumber >= 6) { // Commencer à la ligne 6
                    const newRow = combinedWorksheet.getRow(currentRow);
                    row.eachCell((cell, colNumber) => {
                        newRow.getCell(colNumber).value = cell.value;
                    });
                    currentRow++;
                }
            });

            // Ajouter une ligne vide entre les sujets
            currentRow++;

        } catch (error) {
            console.error(`Erreur lors du traitement du fichier ${file.name}:`, error);
            showMessage(`Erreur lors du traitement du fichier ${file.name}.`, "error");
        }

        // Mettre à jour la barre de progression
        progressBar.style.width = `${(i + 1) * progressStep}%`;
    }

    // Ajouter une seule fois le texte de contact à la fin du rapport combiné
    const contactRow = combinedWorksheet.addRow(['Pour toute question, veuillez contacter : email@exemple.com']);
    combinedWorksheet.mergeCells(`A${contactRow.number}:J${contactRow.number}`);
    contactRow.getCell(1).font = { italic: true, color: { argb: 'FF6FA1B6' } };

    // Affichage de l'aperçu dans une table HTML éditable avant téléchargement, sans titre ni message de contact
    displayPreview(combinedWorkbook);

    // Garder la barre de progression affichée et mettre à jour le message sous le tableau
    showMessage("Rapport combiné généré avec succès !", "success");
});

function displayPreview(workbook) {
    const previewContainer = document.getElementById('preview');
    previewContainer.innerHTML = ''; // Réinitialiser le contenu précédent

    const worksheet = workbook.getWorksheet(1); // Utiliser la première feuille de calcul
    const table = document.createElement('table');
    table.classList.add('preview-table');

    worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1 || rowNumber === worksheet.lastRow.number) {
            return; // Ne pas afficher la première ligne (titre) ni la dernière (message de contact)
        }
        const dataRow = table.insertRow();
        row.eachCell((cell, colNumber) => {
            const cellElement = dataRow.insertCell();
            cellElement.contentEditable = true; // Rendre chaque cellule éditable
            cellElement.innerText = cell.value || '';
            cellElement.addEventListener('input', function () {
                row.getCell(colNumber).value = cellElement.innerText;
            });
        });
    });

    previewContainer.appendChild(table);

    // Ajouter un bouton pour télécharger le fichier après édition
    const downloadBtn = document.createElement('button');
    downloadBtn.innerText = 'Télécharger le rapport combiné';
    downloadBtn.classList.add('download-btn');
    downloadBtn.addEventListener('click', async function () {
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rapport_combiné_${new Date().toISOString().slice(0, 10)}.xlsx`;
        a.click();
        window.URL.revokeObjectURL(url);
    });

    previewContainer.appendChild(downloadBtn);
}
