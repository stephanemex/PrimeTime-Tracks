// Fonction pour afficher les messages dans l'interface
function showMessage(message, type = 'info') {
    const messageContainer = document.getElementById('message');
    messageContainer.innerHTML = message;
    messageContainer.className = `message ${type}`;
    messageContainer.style.display = 'block'; // Rendre le message visible
}

// Gestion de la sélection des fichiers
document.getElementById('directory-input').addEventListener('change', function () {
    const files = this.files;

    // Filtrer les fichiers valides
    let validFiles = Array.from(files).filter(file => !file.name.startsWith('~$') && file.name.endsWith('.xlsx'));

    const directoryUploadLabel = document.getElementById('directory-upload-label');
    const processButton = document.getElementById('process-btn');
    const messageContainer = document.getElementById('message');

    if (validFiles.length > 0) {
        const directoryName = validFiles[0].webkitRelativePath.split("/")[0];
        directoryUploadLabel.innerText = `Répertoire sélectionné : ${directoryName}`;
        directoryUploadLabel.style.backgroundColor = '#4CAF50'; // Couleur verte
        processButton.style.display = 'inline-block'; // Afficher le bouton de traitement

        let fileList = "<strong>Fichiers chargés pour le traitement :</strong><br><ul>";
        validFiles.forEach(file => {
            fileList += `<li>${file.name}</li>`;
        });
        fileList += "</ul>";
        showMessage(fileList, 'info');
    } else {
        directoryUploadLabel.innerText = 'Choisir un répertoire';
        directoryUploadLabel.style.backgroundColor = ''; // Réinitialiser la couleur
        processButton.style.display = 'none'; // Cacher le bouton
        messageContainer.innerHTML = ''; // Réinitialiser le message
    }
});

// Gestion du traitement des fichiers
document.getElementById('process-btn').addEventListener('click', async function () {
    const directoryInput = document.getElementById('directory-input');
    const files = directoryInput.files;

    // Filtrer les fichiers valides
    let validFiles = Array.from(files).filter(file => !file.name.startsWith('~$') && file.name.endsWith('.xlsx'));

    if (!validFiles.length) {
        showMessage("Aucun fichier Excel valide trouvé dans le répertoire.", "error");
        return;
    }

    const progressBar = document.getElementById('progress-bar');
    const progressContainer = progressBar.parentElement;
    progressBar.style.width = '0%';
    progressContainer.style.display = 'block'; // Afficher la barre de progression

    const combinedWorkbook = new ExcelJS.Workbook();
    const combinedWorksheet = combinedWorkbook.addWorksheet('Rapport Combiné');

    // Titre principal du rapport combiné
    combinedWorksheet.mergeCells('A1:I1');
    const mainTitle = combinedWorksheet.getCell('A1');
    mainTitle.value = "Déclaration de droits musicaux combinée";
    mainTitle.font = { size: 24, bold: true, color: { argb: 'FFFFFFFF' } };
    mainTitle.alignment = { vertical: 'middle', horizontal: 'center' };
    mainTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6FA1B6' } };
    combinedWorksheet.getRow(1).height = 40;

    let currentRow = 2;
    const progressStep = 100 / validFiles.length;

    const previewContainer = document.getElementById('preview');
    previewContainer.innerHTML = ''; // Réinitialiser l’aperçu HTML

    for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i];

        try {
            const arrayBuffer = await file.arrayBuffer();
            const workbook = await new ExcelJS.Workbook().xlsx.load(arrayBuffer);
            const worksheet = workbook.getWorksheet(1);

            // Récupérer les métadonnées
            const producer = worksheet.getCell('B1').value || "Non spécifié";
            const show = worksheet.getCell('B2').value || "Non spécifié";
            const subject = worksheet.getCell('B3').value || "Non spécifié";
            const broadcastCount = worksheet.getCell('B4').value || "Non spécifié";
            const date = worksheet.getCell('B5').value || "Non spécifié";

            // Ajouter un bloc HTML avec les métadonnées
            const metaContainer = document.createElement('div');
            metaContainer.classList.add('meta-container');
            metaContainer.innerHTML = `
                <h3 style="color: #003366;">Musiques Utilisées pour le projet ${show} - ${subject}</h3>
                <p><strong>Producteur :</strong> ${producer}</p>
                <p><strong>Émission :</strong> ${show}</p>
                <p><strong>Sujet :</strong> ${subject}</p>
                <p><strong>Diffusions :</strong> ${broadcastCount}</p>
                <p><strong>Date :</strong> ${date}</p>
            `;
            previewContainer.appendChild(metaContainer);

            // Ajouter les métadonnées au rapport Excel
            const metaEntries = [
                ["Producteur", producer],
                ["Émission", show],
                ["Sujet", subject],
                ["Diffusions", broadcastCount],
                ["Date", date],
            ];
            metaEntries.forEach(([key, value]) => {
                const metaRow = combinedWorksheet.addRow([`${key}:`, value]);
                metaRow.getCell(1).font = { bold: true };
                metaRow.getCell(2).font = { italic: true };
                metaRow.getCell(1).alignment = { horizontal: "right" };
                metaRow.getCell(2).alignment = { horizontal: "left" };
                metaRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFB0C4DE" } };
            });

            combinedWorksheet.addRow([]);

            // Ajouter le titre du projet dans Excel
            const titleRow = combinedWorksheet.addRow([`Musiques Utilisées pour le projet ${show} - ${subject}`]);
            combinedWorksheet.mergeCells(`A${titleRow.number}:I${titleRow.number}`);
            titleRow.font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
            titleRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF003366" } };
            titleRow.alignment = { horizontal: "center", vertical: "middle" };

            currentRow++;

            // Ajouter les données musicales et exclure le footer
            const table = document.createElement('table');
            table.classList.add('preview-table');

            let footerFound = false;
            worksheet.eachRow((row, rowNumber) => {
                const rowValues = row.values.filter(v => v);
                const isFooter = rowValues.some(value =>
                    typeof value === 'string' &&
                    (value.includes("Document extrait de") || value.includes("Développée par"))
                );

                if (footerFound || isFooter) {
                    footerFound = true; // Stop processing once footer is found
                    return;
                }

                if (rowNumber > 7) { // Ignorer les métadonnées et titres
                    const dataRow = table.insertRow();
                    row.eachCell((cell, colNumber) => {
                        const cellElement = dataRow.insertCell();
                        cellElement.contentEditable = true;
                        cellElement.innerText = cell.value || '';
                    });

                    const newRow = combinedWorksheet.getRow(currentRow);
                    row.eachCell((cell, colNumber) => {
                        newRow.getCell(colNumber).value = cell.value;
                    });
                    currentRow++;
                }
            });

            previewContainer.appendChild(table);
            combinedWorksheet.addRow([]);

        } catch (error) {
            console.error(`Erreur lors du traitement du fichier ${file.name}:`, error);
            showMessage(`Erreur lors du traitement du fichier ${file.name}.`, "error");
        }

        progressBar.style.width = `${(i + 1) * progressStep}%`;
    }

    // Ajouter un footer global
    const footerMessage1 = "Document combiné extrait de l'application PrimeTime Tracks";
    const footerMessage2 = "Développée par Stéphane Mex - Contact : stephane.mex@lemanbleu.ch";

    combinedWorksheet.addRow([]);
    const footerRow1 = combinedWorksheet.addRow([footerMessage1]);
    combinedWorksheet.mergeCells(`A${footerRow1.number}:I${footerRow1.number}`);
    footerRow1.getCell(1).font = { italic: true, color: { argb: 'FF6FA1B6' } };
    footerRow1.getCell(1).alignment = { horizontal: "center", vertical: "middle" };

    const footerRow2 = combinedWorksheet.addRow([footerMessage2]);
    combinedWorksheet.mergeCells(`A${footerRow2.number}:I${footerRow2.number}`);
    footerRow2.getCell(1).font = { italic: true, color: { argb: 'FF6FA1B6' } };
    footerRow2.getCell(1).alignment = { horizontal: "center", vertical: "middle" };

    showMessage("Rapport combiné généré avec succès ! Cliquez sur 'Télécharger le fichier' pour sauvegarder.", "success");

    // Ajouter un bouton pour télécharger le fichier Excel
    const downloadBtn = document.createElement('button');
    downloadBtn.innerText = 'Télécharger le fichier Excel';
    downloadBtn.addEventListener('click', async function () {
        const buffer = await combinedWorkbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rapport_combine_${new Date().toISOString().slice(0, 10)}.xlsx`;
        a.click();
    });
    previewContainer.appendChild(downloadBtn);
});
