// Variables globales
let globalOutputData = []; // Données de sortie globales
let diffusionMappings = {}; // Mappage des diffusions (projets)
let projectName = ""; // Nom du projet actuel
let csvData = []; // Données issues du fichier CSV

// Fonction pour afficher les messages
function showMessage(message, type = 'info') {
    const messageContainer = document.getElementById('message');
    messageContainer.innerText = message;
    messageContainer.className = `message ${type}`;
    setTimeout(() => {
        messageContainer.innerText = '';
        messageContainer.className = 'message';
    }, 5000);
}

// Fonction pour parser un fichier CSV
function parseCsv(text) {
    const rows = text.trim().split("\n");
    const headers = rows.shift().split(",");
    return rows.map(row => {
        const values = row.split(",");
        const entry = {};
        headers.forEach((header, index) => {
            entry[header.trim()] = values[index]?.trim() || "Inconnu";
        });
        return entry;
    });
}

// Fonction de correspondance entre XMP et CSV
function matchCSVWithXMP(xmpData, csvData) {
    console.log("Début de la correspondance XMP/CSV");
    const matchedData = [];

    xmpData.forEach(xmpItem => {
        const parsedFile = parseFileName(xmpItem.filePath || "");
        if (!parsedFile) {
            return; // Fichier ignoré ou invalide
        }

        // Recherche d'une correspondance dans le CSV
        const csvMatch = csvData.find(csvRow =>
            csvRow["Album Code"] === parsedFile.album &&
            csvRow["Track #"] === parsedFile.track &&
            csvRow["Track Title"]?.toLowerCase() === parsedFile.title.toLowerCase()
        );

        const matchedEntry = {
            label: csvMatch?.["Label"] || parsedFile.label,
            album: csvMatch?.["Album Title"] || parsedFile.album,
            trackNumber: csvMatch?.["Track #"] || parsedFile.track,
            trackName: csvMatch?.["Track Title"] || parsedFile.title,
            artists: csvMatch?.["Artist(s)"] || "Inconnu",
            composer: csvMatch?.["Composer(s)"] || parsedFile.artist,
            duration: csvMatch?.["Duration"] || "Inconnu",
            timecodeIn: xmpItem.timecodeIn || "Inconnu",
            timecodeOut: xmpItem.timecodeOut || "Inconnu",
        };

        matchedData.push(matchedEntry);
    });

    return matchedData;
}


// Fonction pour traiter les données d'un fichier CSV
function processCSVData(csvData, fileName) {
    console.log(`Traitement des données CSV pour le fichier : ${fileName}`);
    
    const cleanedData = csvData.map(row => ({
        label: row["Label"]?.replace(/"/g, "") || "Inconnu",
        album: row["Album Title"]?.replace(/"/g, "") || "Inconnu",
        trackNumber: row["Track #"]?.replace(/"/g, "") || "Inconnu",
        trackName: row["Track Title"]?.replace(/"/g, "") || "Inconnu",
        artists: row["Artist(s)"]?.replace(/"/g, "") || "Inconnu",
        duration: row["Duration"]?.replace(/"/g, "") || "Inconnu",
    }));

    globalOutputData.push({
        file: fileName,
        data: cleanedData
    });

    console.log("globalOutputData après traitement CSV :", globalOutputData);
}

// Fonction pour traiter les données d'un fichier XMP
function processXMPData(extractedData, fileName) {
    console.log(`Traitement des données XMP pour le fichier : ${fileName}`);
    console.log("Données XMP extraites :", extractedData);

    try {
        const matchedData = csvData.length > 0 ? 
            matchCSVWithXMP(extractedData, csvData) : 
            extractedData.map(item => ({
                label: item.label || "Inconnu",
                album: "Inconnu",
                trackNumber: "Inconnu",
                trackName: item.label?.split("_").slice(3).join(" ") || "Inconnu",
                artists: "Inconnu",
                composer: "Inconnu",
                duration: item.duration || "Inconnu",
                timecodeIn: item.timecodeIn || "Inconnu",
                timecodeOut: item.timecodeOut || "Inconnu"
            }));

        globalOutputData.push({
            file: fileName,
            data: matchedData
        });

        console.log("globalOutputData après traitement XMP :", globalOutputData);
    } catch (error) {
        console.error("Erreur lors du traitement XMP:", error);
        showMessage("Erreur lors du traitement du fichier XMP", "error");
    }
}

// Fonction pour afficher l'aperçu
function displayPreview(outputData, projectName) {
    console.log("Début de la fonction displayPreview");
    console.log("Données reçues :", outputData);
    console.log("Nom du projet :", projectName);

    const previewContainer = document.getElementById('preview');
    previewContainer.innerHTML = '';

    if (outputData.length === 0) {
        showMessage("Aucune donnée à afficher.", "warning");
        return;
    }

    // Titre du projet
    const title = document.createElement('h3');
    title.textContent = `Projet : ${projectName}`;
    previewContainer.appendChild(title);

    // Création du tableau
    const table = document.createElement('table');
    table.classList.add('preview-table');

    // En-têtes
    const headers = ['Label', 'Album', 'Track #', 'Track Title', 'Artists', 'Duration', 'Timecode In', 'Timecode Out', 'Actions'];
    const headerRow = table.insertRow();
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });

    // Données
    outputData.forEach(fileData => {
        if (fileData.data && fileData.data.length > 0) {
            fileData.data.forEach((item, index) => {
                const row = table.insertRow();
                
                // Cellules d'information
                [item.label, item.album, item.trackNumber, item.trackName, 
                 item.artists, item.duration, item.timecodeIn, item.timecodeOut
                ].forEach(text => {
                    const cell = row.insertCell();
                    cell.textContent = text || 'Inconnu';
                    cell.contentEditable = true;
                });

                // Cellule d'actions
                const actionsCell = row.insertCell();
                const deleteButton = document.createElement('button');
                deleteButton.textContent = 'Supprimer';
                deleteButton.onclick = () => {
                    table.deleteRow(row.rowIndex);
                    fileData.data.splice(index, 1);
                };
                actionsCell.appendChild(deleteButton);
            });
        }
    });

    previewContainer.appendChild(table);
    showMessage("Aperçu généré avec succès.", "success");
}

// Fonction pour générer le fichier Excel
function generateExcel(outputData, projectName) {
    try {
        if (!projectName || outputData.length === 0) {
            showMessage("Données insuffisantes pour générer le fichier Excel.", "error");
            return;
        }

        // Récupération des informations du projet
        const projectInfo = diffusionMappings[projectName];
        if (!projectInfo) {
            showMessage("Informations du projet non trouvées.", "error");
            return;
        }

        // Création des données pour l'export
        const exportData = outputData.flatMap(fileData => 
            fileData.data.map(item => ({
                "Journaliste/Producteur": projectInfo.producerName,
                "Émission": projectInfo.showName,
                "Sujet": projectName,
                "Nombre de diffusions": projectInfo.broadcastCount,
                "Date": projectInfo.projectDate,
                "Label": item.label,
                "Album": item.album,
                "Track #": item.trackNumber,
                "Titre": item.trackName,
                "Artiste(s)": item.artists,
                "Durée": item.duration,
                "Timecode In": item.timecodeIn,
                "Timecode Out": item.timecodeOut
            }))
        );

        // Création du workbook
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(exportData);

        // Ajout de la feuille au workbook
        XLSX.utils.book_append_sheet(wb, ws, "Rapport");

        // Génération du fichier
        const fileName = `Rapport_${projectName}_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);

        showMessage("Fichier Excel généré avec succès.", "success");
    } catch (error) {
        console.error("Erreur lors de la génération du fichier Excel:", error);
        showMessage("Erreur lors de la génération du fichier Excel.", "error");
    }
}

// Initialisation du DOM
document.addEventListener('DOMContentLoaded', function () {
    const fileInput = document.getElementById('input-files');
    const csvInput = document.getElementById('input-csv');
    const uploadLabel = document.querySelector('.file-upload-label');
    const extractBtn = document.getElementById('extract-btn');
    const processBtn = document.getElementById('process-btn');
    const downloadBtn = document.getElementById('download-btn');

    // Configuration initiale
    fileInput.disabled = true;
    extractBtn.style.display = 'none';
    downloadBtn.style.display = 'none';

    // Fonction pour vérifier et activer l'input de fichiers
    function checkEnableFileInput() {
        fileInput.disabled = Object.keys(diffusionMappings).length === 0;
        uploadLabel.classList.toggle('enabled', !fileInput.disabled);
    }

    // Fonction pour mettre à jour la liste des projets
    function updateMappingList() {
        const mappingList = document.getElementById('mapping-list');
        mappingList.innerHTML = '';

        Object.entries(diffusionMappings).forEach(([subject, info]) => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <div class="mapping-info">
                    <ul class="mapping-details">
                        <li><strong>Journaliste/Producteur:</strong> ${info.producerName}</li>
                        <li><strong>Émission:</strong> ${info.showName}</li>
                        <li><strong>Sujet:</strong> ${subject}</li>
                        <li><strong>Diffusions:</strong> ${info.broadcastCount}</li>
                        <li><strong>Date:</strong> ${info.projectDate}</li>
                    </ul>
                    <button class="delete-btn">Supprimer</button>
                </div>
            `;

            listItem.querySelector('.delete-btn').onclick = () => {
                delete diffusionMappings[subject];
                updateMappingList();
                checkEnableFileInput();
            };

            mappingList.appendChild(listItem);
        });

        if (Object.keys(diffusionMappings).length === 0) {
            mappingList.innerHTML = '<li>Aucune correspondance ajoutée.</li>';
        }
    }

    // Gestion du fichier CSV
    csvInput.addEventListener('change', async function (event) {
        try {
            const file = event.target.files[0];
            if (file) {
                console.log("Fichier CSV sélectionné :", file.name);
                const text = await file.text();
                csvData = parseCsv(text);
                console.log("Données CSV parsées :", csvData);
                processCSVData(csvData, file.name);
                showMessage("Fichier CSV traité avec succès.", "success");
            }
        } catch (error) {
            console.error("Erreur lors du traitement du fichier CSV:", error);
            showMessage("Erreur lors du traitement du fichier CSV", "error");
        }
    });

    // Gestion de l'ajout de projet
    document.getElementById('add-mapping-btn').addEventListener('click', () => {
        const producerName = document.getElementById('producer-name').value.trim();
        const showName = document.getElementById('show-name').value.trim();
        const subject = document.getElementById('project-name').value.trim();
        const broadcastCount = parseInt(document.getElementById('broadcast-count').value);
        const projectDate = document.getElementById('project-date').value;

        if (producerName && showName && subject && !isNaN(broadcastCount) && projectDate) {
            diffusionMappings[subject] = {
                producerName,
                showName,
                broadcastCount,
                projectDate,
                csvData: csvData.length > 0 ? [...csvData] : null
            };

            // Réinitialisation des champs
            document.getElementById('producer-name').value = '';
            document.getElementById('show-name').value = '';
            document.getElementById('project-name').value = '';
            document.getElementById('broadcast-count').value = '';
            document.getElementById('project-date').value = '';

            updateMappingList();
            checkEnableFileInput();
            showMessage("Projet ajouté avec succès.", "success");
        } else {
            showMessage("Veuillez remplir tous les champs correctement.", "error");
        }
    });

    // Gestion des fichiers XML/FCPXMLD
    fileInput.addEventListener('change', function () {
        const file = fileInput.files[0];
        if (file) {
            uploadLabel.textContent = `Fichier sélectionné : ${file.name}`;
            extractBtn.style.display = file.name.endsWith('.fcpxmld') ? 'inline-block' : 'none';
            showMessage("Fichier sélectionné avec succès.", "success");
        } else {
            uploadLabel.textContent = "Sélectionner les fichiers XML";
        }
    });

    // Gestion du bouton d'aperçu
    processBtn.addEventListener('click', () => {
        console.log("Bouton 'Générer l'aperçu' cliqué.");
        console.log("Contenu de globalOutputData avant l'aperçu :", globalOutputData);

        if (globalOutputData.length === 0) {
            showMessage("Aucune donnée disponible pour afficher l'aperçu.", "warning");
            return;
        }

        // Récupération du premier projet
        const firstProject = Object.keys(diffusionMappings)[0];
        if (firstProject) {
            projectName = firstProject;
            console.log("Nom du projet utilisé :", projectName);

            // Génération de l'aperçu
            displayPreview(globalOutputData, projectName);

            // Afficher le bouton de téléchargement
            downloadBtn.style.display = 'inline-block';
            showMessage("Aperçu généré avec succès.", "success");
        } else {
            showMessage("Aucun projet sélectionné pour générer l'aperçu.", "error");
        }
    });

    // Gestion du bouton de téléchargement
    downloadBtn.addEventListener('click', function () {
        console.log("Bouton 'Télécharger' cliqué.");
        if (globalOutputData.length === 0) {
            showMessage("Aucune donnée à exporter.", "warning");
            return;
        }

        try {
            generateExcel(globalOutputData, projectName);
        } catch (error) {
            console.error("Erreur lors de la génération du fichier Excel :", error);
            showMessage("Erreur lors de la génération du fichier Excel.", "error");
        }
    });

    // Initialisation de la liste des projets
    updateMappingList();
});
