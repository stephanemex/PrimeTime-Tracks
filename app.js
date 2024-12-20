// Variables globales
let globalCsvData = []; // Contiendra les données parsées du CSV
let diffusionMappings = {}; // Stocke les correspondances entre sujets et diffusions
let outputData = []; // Contient les données extraites des fichiers XML

document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM chargé, initialisation de l'application");

    // Sélection des éléments DOM
    const inputCsv = document.getElementById("input-csv");
    const btnUploadCsv = document.getElementById("btn-upload-csv");
    const mappingList = document.getElementById("mapping-list");
    const fileInput = document.getElementById("input-files");
    const extractBtn = document.getElementById("extract-btn");
    const processBtn = document.getElementById("process-btn");
    const downloadBtn = document.getElementById("download-btn");
    const uploadLabel = document.querySelector(".file-upload-label");
    const addMappingBtn = document.getElementById("add-mapping-btn");

    // Initialisation des éléments
    extractBtn.style.display = "none";
    processBtn.style.display = "none";
    downloadBtn.style.display = "none";

    // Affiche un message utilisateur dans l'interface
    function showMessage(message, type = "info") {
        const messageContainer = document.getElementById("message");
        if (!messageContainer) return;
        messageContainer.innerText = message;
        messageContainer.className = `message ${type}`;
    }

    // Fonction pour parser le contenu d'un fichier CSV
    function parseCsv(text) {
        const rows = text.trim().split("\n");
        const headers = rows
            .shift()
            .split(",")
            .map((header) => header.replace(/"/g, "").trim());
        return rows.map((row) => {
            const values = row.split(",").map((value) => value.replace(/"/g, "").trim());
            return headers.reduce((acc, header, index) => {
                acc[header] = values[index] || "Inconnu";
                return acc;
            }, {});
        });
    }

    // Gestion de l'importation du CSV
    inputCsv.addEventListener("change", function (event) {
        const file = event.target.files[0];
        if (!file) {
            showMessage("Aucun fichier CSV sélectionné.", "warning");
            return;
        }

        btnUploadCsv.textContent = `Fichier ajouté : ${file.name}`;
        btnUploadCsv.classList.add("btn-success");

        const reader = new FileReader();
        reader.onload = function (e) {
            const content = e.target.result;
            globalCsvData = parseCsv(content);
            if (globalCsvData.length > 0) {
                showMessage(`Fichier CSV importé avec ${globalCsvData.length} entrées.`, "success");
                console.log("Données CSV parsées :", globalCsvData);
            } else {
                showMessage("Le fichier CSV semble vide ou invalide.", "error");
            }
        };
        reader.readAsText(file);
    });

    // Mise à jour de la liste des correspondances
    function updateMappingList() {
        if (!mappingList) return;
        mappingList.innerHTML = "";

        Object.entries(diffusionMappings).forEach(([subject, mapping]) => {
            const { producerName, showName, broadcastCount, projectDate, csvRows } = mapping;

            const listItem = document.createElement("li");
            listItem.className = "mapping-item";

            const escapedHtml = `
                <div class="mapping-info">
                    <ul class="mapping-details">
                        <li>Journaliste/Producteur : <b>${producerName}</b></li>
                        <li>Émission : <b>${showName}</b></li>
                        <li>Sujet : <b>${subject}</b></li>
                        <li>Diffusions : <b>${broadcastCount}</b></li>
                        <li>Date : <b>${projectDate}</b></li>
                    </ul>
                    <h4>Données associées depuis le CSV :</h4>
                    <ul class="csv-details">
                        ${renderCsvRows(csvRows)}
                    </ul>
                </div>`;
            listItem.innerHTML = escapedHtml;

            const deleteButton = document.createElement("button");
            deleteButton.className = "delete-btn";
            deleteButton.textContent = "Supprimer";
            deleteButton.addEventListener("click", () => {
                delete diffusionMappings[subject];
                updateMappingList();
                showMessage(`Correspondance supprimée pour le sujet : "${subject}"`, "info");
            });

            listItem.appendChild(deleteButton);
            mappingList.appendChild(listItem);
        });
    }

    // Fonction pour afficher les lignes associées du CSV
    function renderCsvRows(csvRows) {
        if (!Array.isArray(csvRows) || csvRows.length === 0) {
            return "<li>Aucune donnée associée trouvée dans le CSV.</li>";
        }
        return csvRows
            .map(
                (row, index) => `
                <li>
                    <strong>Entrée ${index + 1} :</strong>
                    Label : ${row.Label || "Inconnu"} | 
                    Album : ${row["Album Title"] || "Inconnu"} | 
                    Piste : ${row["Track #"] || "Inconnu"} | 
                    Titre : ${row["Track Title"] || "Inconnu"} |
                    Artistes : ${row["Artist(s)"] || "Inconnu"} |
                    Durée : ${row.Duration || "Inconnu"}
                </li>`
            )
            .join("");
    }

    // Ajout de correspondances
    addMappingBtn.addEventListener("click", function () {
        const producerName = document.getElementById("producer-name").value.trim();
        const showName = document.getElementById("show-name").value.trim();
        const subject = document.getElementById("project-name").value.trim();
        const broadcastCount = parseInt(document.getElementById("broadcast-count").value.trim());
        const projectDate = document.getElementById("project-date").value.trim();

        if (!producerName || !showName || !subject || isNaN(broadcastCount) || !projectDate) {
            showMessage("Tous les champs du formulaire doivent être remplis correctement.", "error");
            return;
        }

        const csvRows = globalCsvData.filter((row) =>
            row["Track Title"]?.toLowerCase().includes(subject.toLowerCase())
        );

        if (csvRows.length === 0) {
            showMessage(`Aucune correspondance trouvée dans le CSV pour le sujet : "${subject}"`, "warning");
        }

        diffusionMappings[subject] = {
            producerName,
            showName,
            broadcastCount,
            projectDate,
            csvRows,
        };

        updateMappingList();
        resetForm();
        showMessage(`Correspondance ajoutée pour le sujet : "${subject}"`, "success");
    });

    // Réinitialiser le formulaire
    function resetForm() {
        ["producer-name", "show-name", "project-name", "broadcast-count", "project-date"].forEach((id) => {
            const element = document.getElementById(id);
            if (element) element.value = "";
        });
    }

    // Initialisation de la liste des correspondances
    updateMappingList();
    console.log("Initialisation de l'application terminée");
});

    // Gestion de la sélection de fichier
    fileInput.addEventListener('change', async () => {
        const file = fileInput.files[0];
        const fileName = file ? file.name : "";
    
        console.log("Fichier sélectionné :", file);
        console.log("Nom du fichier :", fileName);
    
        if (fileName) {
            uploadLabel.textContent = `Fichier sélectionné : ${fileName}`;
            uploadLabel.classList.add('uploaded');
    
            if (fileName.endsWith('.fcpxmld') || fileName.endsWith('.fcpxmld.zip')) {
                console.log("Fichier .fcpxmld détecté");
                extractBtn.style.display = 'inline-block';
            } else {
                console.log("Fichier non .fcpxmld détecté");
                extractBtn.style.display = 'none';
            }
        } else {
            console.log("Aucun fichier sélectionné");
            uploadLabel.textContent = "Sélectionner les fichiers XML";
            uploadLabel.classList.remove('uploaded');
        }
    });

    // Extraction automatique du contenu .fcpxml depuis .fcpxmld
    extractBtn.addEventListener('click', async function() {
        console.log("Bouton d'extraction cliqué");
        const file = fileInput.files[0];
        if (file && (file.name.endsWith('.fcpxmld') || file.name.endsWith('.fcpxmld.zip'))) {
            console.log("Fichier .fcpxmld valide sélectionné :", file.name);
            try {
                const xmlContent = await extractFcpxmlFromPackage(file);
                if (xmlContent) {
                    fcpxmlExtractedContent = xmlContent;
                    console.log("Contenu FCPXML extrait avec succès");
                    showMessage("Extraction réussie ! Vous pouvez maintenant générer l'aperçu.", "success");
                    console.log("Contenu FCPXML extrait (premiers 200 caractères) :", fcpxmlExtractedContent.substring(0, 200));
                } else {
                    console.error("Échec de l'extraction du contenu FCPXML");
                    showMessage("Échec de l'extraction du fichier FCPXML. Veuillez vérifier le fichier.", "error");
                }
            } catch (error) {
                console.error("Erreur lors de l'extraction :", error);
                showMessage("Erreur lors de l'extraction du fichier FCPXML : " + error.message, "error");
            }
        } else {
            console.error("Fichier invalide ou non sélectionné :", file ? file.name : "aucun fichier");
            showMessage("Veuillez sélectionner un fichier .fcpxmld ou .fcpxmld.zip valide.", "error");
        }
    });

    // Fonction pour extraire le contenu FCPXML du paquet
    async function extractFcpxmlFromPackage(file) {
        console.log("Début de l'extraction du fichier :", file.name);
        try {
            const arrayBuffer = await file.arrayBuffer();
            console.log("Fichier lu comme ArrayBuffer");
            
            const zip = await JSZip.loadAsync(arrayBuffer);
            console.log("Fichier décompressé avec JSZip");
            
            // Recherche du fichier Info.fcpxml dans le zip
            const fcpxmlFile = zip.file(/.*Info\.fcpxml$/i)[0];
            
            if (fcpxmlFile) {
                console.log("Fichier Info.fcpxml trouvé :", fcpxmlFile.name);
                const content = await fcpxmlFile.async('string');
                console.log("Contenu XML extrait (premiers 200 caractères) :", content.substring(0, 200));
                return content;
            } else {
                console.error("Aucun fichier Info.fcpxml trouvé dans le paquet");
                return null;
            }
        } catch (error) {
            console.error("Erreur lors de l'extraction :", error);
            return null;
        }
    }
    
    // Fonction d'extraction et de parsing de XML dans .fcpxmld
    async function extractAndParseFCPXML(file) {
        try {
            const fileContent = await file.arrayBuffer();
            const zip = await JSZip.loadAsync(fileContent);
            const infoFile = zip.file("Kast.fcpxmld/Info.fcpxml");
    
            if (infoFile) {
                let extractedContent = await infoFile.async("string");
                console.log("Contenu extrait brut de Info.fcpxml :", extractedContent.substring(0, 200), "...");
    
                // Nettoyage et vérification de la structure XML
                let cleanedContent = extractedContent.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x80-\xFF]/g, "");
    
                if (!cleanedContent.trim().startsWith("<?xml")) {
                    console.error("Erreur: structure XML non valide après nettoyage.");
                    return null;
                }
    
                console.log("Contenu XML nettoyé :", cleanedContent.substring(0, 200), "...");
    
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(cleanedContent, "application/xml");
    
                if (xmlDoc.getElementsByTagName("parsererror").length) {
                    console.error("Erreur de parsing dans le contenu XML nettoyé :", xmlDoc.getElementsByTagName("parsererror")[0].textContent);
                    return null;
                }
    
                console.log("Document XML complet :", new XMLSerializer().serializeToString(xmlDoc));
                return xmlDoc;
            } else {
                console.error("Fichier Info.fcpxml non trouvé dans l'archive.");
                return null;
            }
        } catch (error) {
            console.error("Erreur lors de l'extraction du fichier Info.fcpxml : ", error);
            return null;
        }
    }
    
    // Fonction pour extraire le nom du projet depuis le XML
    function extractProjectName(xmlContent) {
        xmlContent = xmlContent.replace(/&(?!amp;|lt;|gt;|quot;|apos;)/g, "&amp;");
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
    
        if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
            console.error("Erreur de parsing du XML :", xmlDoc.getElementsByTagName("parsererror")[0].textContent);
            return "Nom de projet inconnu";
        }
    
        const projectNode = xmlDoc.getElementsByTagName('project')[0];
        return projectNode ? projectNode.getAttribute('name') || "Nom de projet inconnu" : "Nom de projet inconnu";
    }
    
    // Supposons que l'extraction se passe bien ici
    function extractionReussie() {
        // Change le bouton d'extraction
        let boutonExtraire = document.getElementById('extract-btn');
        if (boutonExtraire) {
            boutonExtraire.classList.add('succes');
        }
    
        // Change le bouton "Générer l'aperçu"
        let boutonGenerer = document.getElementById('process-btn');
        if (boutonGenerer) {
            boutonGenerer.classList.add('actif');
        }
    }

    // Fonction pour traiter le XML et extraire les données nécessaires
    function extractMusicInfo(name, isFcpxmld) {
        let label = "", album = "", trackNumber = "", trackName = "", artists = "";
    
        console.log("Extraction des informations musicales pour :", name);
        
        if (isFcpxmld) {
            // Tentative de découpage avec underscore
            let parts = name.split('_');
            if (parts.length < 4) {
                // Si la tentative échoue, essayons avec des tirets ou des espaces
                parts = name.split('-');
                if (parts.length < 4) {
                    parts = name.split(' ');
                }
            }
    
            console.log("Parties extraites du nom (FCPXMLD) :", parts);
    
            if (parts.length >= 4) {
                label = parts[0] || "";
                album = parts[1] || "";
                trackNumber = parts[2] || "";
                trackName = parts[3].replace('__', ' ').trim(); // Le titre
    
                // Extraire les artistes s'il y a des informations supplémentaires après "___"
                if (parts.length > 4) {
                    artists = parts.slice(4).join(' ').replace('_', ' ').trim();
                }
            } else if (parts.length === 1) {
                // Si le nom est très court, on peut l'attribuer comme titre
                trackName = name.replace('__', ' ').trim();
            } else {
                console.warn("Format de nom inattendu pour FCPXMLD :", name);
            }
    
        } else {
            // Cas FCPXML classique - séparation par tirets
            let parts = name.split('-');
            if (parts.length >= 5) {
                label = parts[0] || "";
                album = parts[1] || "";
                trackNumber = parts[2] || "";
                trackName = parts[3] || "";
                artists = parts[4] || "";
            } else {
                console.warn("Format de nom inattendu pour FCPXML :", name);
            }
        }
    
        return {
            label: label.trim(),
            album: album.trim(),
            trackNumber: trackNumber.trim(),
            trackName: trackName.trim(),
            artists: artists.trim()
        };
    }
    
    // Dans votre fonction processXml, vous pouvez appeler extractMusicInfo pour obtenir ces informations
    function processXml(xmlContent, fileName, outputData) {
        console.log("Début du traitement XML pour le fichier :", fileName);
    
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
    
        console.log("Structure XML complète:", new XMLSerializer().serializeToString(xmlDoc));
    
        const assetClips = xmlDoc.getElementsByTagName('asset-clip');
        console.log("Nombre de asset-clip dans le fichier:", assetClips.length);
    
        const data = [];
        if (assetClips.length === 0) {
            console.warn("Aucune balise asset-clip trouvée dans ce fichier.");
            return;
        }
    
        const isFcpxmld = fileName.endsWith('.fcpxmld') || fileName.endsWith('.fcpxmld.zip');
    
        for (let assetClip of assetClips) {
            let musicRoles = [];
            const audioChannels = assetClip.getElementsByTagName('audio-channel-source');
            
            for (let channel of audioChannels) {
                const role = channel.getAttribute('role') || "";
                musicRoles.push(role);
            }
            
            console.log("Rôles détectés pour cet asset-clip :", musicRoles);
            
            const hasMusicRole = musicRoles.some(role => role.startsWith('music.'));
            let name = assetClip.getAttribute("name") || "";
            let cleanName = cleanText(name);
    
            if (hasMusicRole || couldBeMusicAsset(cleanName)) {
                console.log("Traitement d'un asset-clip potentiellement musical :", name);
    
                let { label, album, trackNumber, trackName, artists } = extractMusicInfo(cleanName, isFcpxmld);
    
                console.log("Données extraites pour cet asset-clip :", {
                    label, album, trackNumber, trackName, artists
                });
    
                let startFrames = parseFraction(assetClip.getAttribute("start") || "0/1s");
                let durationFrames = parseFraction(assetClip.getAttribute("duration") || "0/1s");
    
                startFrames = isNaN(startFrames) ? 0 : startFrames;
                durationFrames = isNaN(durationFrames) ? 0 : durationFrames;
    
                let startTime = convertFramesToTimecode(startFrames);
                let duration = convertFramesToTimecode(durationFrames);
                let endTime = calculateEndTime(startFrames, durationFrames);
    
                const trackData = {
                    label: label || "Inconnu",
                    album: album || "Inconnu",
                    trackNumber: trackNumber || "Inconnu",
                    trackName: trackName || name, // Utilise le nom complet si trackName n'est pas extrait
                    artists: artists || "Inconnu",
                    startTime: startTime,
                    endTime: endTime,
                    duration: duration
                };
    
                // Vérification plus souple : on ajoute l'asset si on a au moins un nom de piste ou un artiste
                if (trackData.trackName || trackData.artists) {
                    console.log("Données track avant ajout à data :", trackData);
                    data.push(trackData);
                } else {
                    console.warn("Données insuffisantes pour l'asset, mais on l'ajoute quand même :", name);
                    trackData.trackName = name;
                    data.push(trackData);
                }
            } else {
                console.log("Ignoré : asset probablement non musical :", name);
            }
        }
    
        console.log("Nombre total de pistes extraites :", data.length);
    
        if (data.length > 0) {
            outputData.push({
                file: fileName,
                data: data
            });
            console.log("Données ajoutées à outputData :", outputData);
        } else {
            console.warn("Aucune donnée valide extraite du fichier.");
        }
    
        return outputData;
    }
    
    function couldBeMusicAsset(name) {
        // Cette fonction vérifie si le nom pourrait être un asset musical
        // même s'il ne suit pas strictement le format attendu
        const musicKeywords = ['music', 'song', 'track', 'audio', 'mp3', 'wav', 'sound'];
        return musicKeywords.some(keyword => name.toLowerCase().includes(keyword));
    }
     
        // Fonction pour déterminer si un fichier est un fichier de musique
    function isMusicFile(filename) {
        // Liste des extensions de fichiers audio courants
        const audioExtensions = ['.mp3', '.wav', '.aac', '.m4a', '.flac', '.ogg', '.wma'];
        
        // Vérifier si le nom de fichier se termine par l'une des extensions audio
        return audioExtensions.some(ext => filename.toLowerCase().endsWith(ext));
    }
    
    // Fonctions utilitaires pour le traitement de texte et de temps
    function cleanText(text) {
        text = text.replace(/_/g, ' ');
        try { text = decodeURIComponent(text); } catch (e) { console.warn("Erreur de décodage dans cleanText :", e); }
        return text;
    }
    
    function parseFraction(fraction) {
        fraction = fraction.replace(/s$/, '');
        let [numerator, denominator] = fraction.split('/').map(Number);
        return !isNaN(numerator) && !isNaN(denominator) && denominator !== 0 ? numerator / denominator : 0;
    }
    
    function convertFramesToTimecode(seconds) {
        let hours = Math.floor(seconds / 3600);
        let minutes = Math.floor((seconds % 3600) / 60);
        let remainingSeconds = Math.floor(seconds % 60);
    
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    // Calcule le TC de fin en additionnant Start et Duration
    function calculateEndTime(startFrames, durationFrames) {
        let endFrames = startFrames + durationFrames;
        return convertFramesToTimecode(endFrames);
    }
    
    // Affiche les messages dans l'interface
    function showMessage(message, type = 'info') {
        const messageContainer = document.getElementById('message');
        messageContainer.innerText = message;
        messageContainer.className = `message ${type}`;
    }
    
    // Fonction d'extraction et de parsing de XML dans .fcpxmld
    async function extractAndParseFCPXML(file) {
        try {
            const fileContent = await file.arrayBuffer();
            const zip = await JSZip.loadAsync(fileContent);
            const infoFile = zip.file("Kast.fcpxmld/Info.fcpxml");
    
            if (infoFile) {
                let extractedContent = await infoFile.async("string");
                console.log("Contenu extrait brut de Info.fcpxml :", extractedContent.substring(0, 200), "...");
    
                // Nettoyage et vérification de la structure XML
                let cleanedContent = extractedContent.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x80-\xFF]/g, "");
    
                if (!cleanedContent.trim().startsWith("<?xml")) {
                    console.error("Erreur: structure XML non valide après nettoyage.");
                    return null;
                }
    
                console.log("Contenu XML nettoyé :", cleanedContent.substring(0, 200), "...");
    
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(cleanedContent, "application/xml");
    
                if (xmlDoc.getElementsByTagName("parsererror").length) {
                    console.error("Erreur de parsing dans le contenu XML nettoyé :", xmlDoc.getElementsByTagName("parsererror")[0].textContent);
                    return null;
                }
    
                console.log("Document XML complet :", new XMLSerializer().serializeToString(xmlDoc));
                return xmlDoc;
            } else {
                console.error("Fichier Info.fcpxml non trouvé dans l'archive.");
                return null;
            }
        } catch (error) {
            console.error("Erreur lors de l'extraction du fichier Info.fcpxml : ", error);
            return null;
        }
    }
   
    //fonction pour afficher le preview
    function displayPreview(outputData, projectName) {
        console.log("Affichage de l'aperçu pour le projet :", projectName);
        console.log("Contenu des données de sortie :", outputData);
    
        const previewContainer = document.getElementById('preview');
        previewContainer.innerHTML = ''; // Réinitialiser le contenu précédent
    
        const projectDetails = diffusionMappings[projectName];
        if (!projectDetails) {
            console.error("Détails du projet non trouvés pour :", projectName);
            showMessage("Erreur : détails du projet non trouvés.", "error");
            return;
        }
    
        const title = document.createElement('h3');
        title.innerText = `Projet : ${projectName}`;
        previewContainer.appendChild(title);
    
        const projectInfo = document.createElement('div');
        projectInfo.innerHTML = `
            <p><strong>Journaliste/Producteur :</strong> ${projectDetails.producerName || 'Non spécifié'}</p>
            <p><strong>Emission :</strong> ${projectDetails.showName || 'Non spécifiée'}</p>
            <p><strong>Date :</strong> ${projectDetails.projectDate || 'Non spécifiée'}</p>
            <p><strong>Diffusions :</strong> ${projectDetails.broadcastCount || 'Non spécifié'}</p>
        `;
        previewContainer.appendChild(projectInfo);
    
        const table = document.createElement('table');
        table.classList.add('preview-table');
    
        const headerRow = table.insertRow();
        const headers = [
            'Journaliste / Producteur', 'Emission', 'Sujet', 'Date', 'Titre', 'Artiste', 
            'Album', 'Label', 'Durée', 'Diffusions', 'Actions'
        ];
        headers.forEach(header => {
            const th = document.createElement('th');
            th.innerText = header;
            headerRow.appendChild(th);
        });
    
        outputData.forEach((item, itemIndex) => {
            item.data.forEach((row, rowIndex) => {
                const dataRow = table.insertRow();
                const cells = [
                    projectDetails.producerName || '',
                    projectDetails.showName || '',
                    projectName,
                    projectDetails.projectDate || '',
                    row.trackName || '',
                    row.artists || '',
                    row.album || '',
                    row.label || '',
                    row.duration || '',
                    projectDetails.broadcastCount || ''
                ];
    
                cells.forEach((cellData, cellIndex) => {
                    const cell = dataRow.insertCell();
                    cell.contentEditable = true;
                    cell.innerText = cellData;
    
                    cell.addEventListener('input', function () {
                        switch (cellIndex) {
                            case 0: projectDetails.producerName = cell.innerText; break;
                            case 1: projectDetails.showName = cell.innerText; break;
                            case 3: projectDetails.projectDate = cell.innerText; break;
                            case 4: row.trackName = cell.innerText; break;
                            case 5: row.artists = cell.innerText; break;
                            case 6: row.album = cell.innerText; break;
                            case 7: row.label = cell.innerText; break;
                            case 8: row.duration = cell.innerText; break;
                            case 9: projectDetails.broadcastCount = parseInt(cell.innerText) || 0; break;
                        }
                    });
                });
    
                const actionCell = dataRow.insertCell();
                const deleteBtn = document.createElement('button');
                deleteBtn.innerText = 'Supprimer';
                deleteBtn.classList.add('delete-btn');
                deleteBtn.addEventListener('click', () => {
                    table.deleteRow(dataRow.rowIndex);
                    outputData[itemIndex].data.splice(rowIndex, 1);
                });
                actionCell.appendChild(deleteBtn);
            });
        });
    
        previewContainer.appendChild(table);
    
        const addRowBtn = document.createElement('button');
        addRowBtn.innerText = 'Ajouter une ligne';
        addRowBtn.classList.add('add-row-btn');
        addRowBtn.addEventListener('click', () => {
            const newRowData = {
                trackName: '', artists: '', album: '', label: '', duration: ''
            };
            if (outputData.length > 0) {
                outputData[0].data.push(newRowData);
                const newRow = table.insertRow();
                addRowToTable(newRow, newRowData, projectDetails);
            } else {
                console.warn("Impossible d'ajouter une ligne : outputData est vide");
            }
        });
    
        previewContainer.appendChild(addRowBtn);
    }
     
    // Fonction pour ajouter une nouvelle ligne au tableau d'aperçu
    function addRowToTable(table, rowData, subjectData) {
        const dataRow = table.insertRow();
    
        const cells = [
            subjectData.producerName || "", // Journaliste / Producteur
            subjectData.showName || "",     // Emission
            projectName,                    // Sujet
            rowData.trackName || "",        // Titre
            rowData.composer || "",         // Artiste
            rowData.album || "",            // Album
            rowData.label || "",            // Label
            rowData.duration || "",         // Durée
            subjectData.broadcastCount || "" // Diffusions
        ];
    
        cells.forEach((cellData, cellIndex) => {
            const cell = dataRow.insertCell();
            cell.contentEditable = true; // Rendre chaque cellule éditable
            cell.innerText = cellData;
    
            // Mettre à jour outputData en fonction des modifications
            cell.addEventListener('input', function () {
                switch (cellIndex) {
                    case 0: subjectData.producerName = cell.innerText; break;
                    case 1: subjectData.showName = cell.innerText; break;
                    case 2: /* Sujet ne doit pas être édité */ break;
                    case 3: rowData.trackName = cell.innerText; break;
                    case 4: rowData.composer = cell.innerText; break;
                    case 5: rowData.album = cell.innerText; break;
                    case 6: rowData.label = cell.innerText; break;
                    case 7: rowData.duration = cell.innerText; break;
                    case 8: subjectData.broadcastCount = parseInt(cell.innerText) || 0; break;
                }
            });
        });
    
        // Ajouter un bouton de suppression pour la nouvelle ligne
        const actionCell = dataRow.insertCell();
        const deleteBtn = document.createElement('button');
        deleteBtn.innerText = 'Supprimer';
        deleteBtn.classList.add('delete-btn'); // Ajout de la classe pour style rouge
        deleteBtn.addEventListener('click', () => {
            table.deleteRow(dataRow.rowIndex);
            outputData[0].data.splice(outputData[0].data.length - 1, 1); // Supprimer de outputData
        });
        actionCell.appendChild(deleteBtn);
    }
    
    // Log supplémentaire dans la gestion du bouton de génération d'aperçu
    document.getElementById('process-btn').addEventListener('click', async function () {
        console.log("Bouton de génération d'aperçu cliqué");
    
        const fileInput = document.getElementById('input-files');
        outputData = []; // Réinitialiser outputData
    
        for (let i = 0; i < fileInput.files.length; i++) {
            const file = fileInput.files[i];
            console.log("Traitement du fichier :", file.name);
    
            if (file.name.endsWith('.fcpxmld') || file.name.endsWith('.fcpxmld.zip')) {
                try {
                    const xmlContent = await extractFcpxmlFromPackage(file);
                    if (xmlContent) {
                        processXml(xmlContent, file.name, outputData);
                        console.log("Après traitement du fichier, outputData :", outputData);
                    } else {
                        console.warn("Impossible d'extraire le fichier XML du package FCPXMLD :", file.name);
                    }
                } catch (error) {
                    console.error("Erreur lors de l'extraction du FCPXMLD :", error);
                }
            } else if (file.name.endsWith('.fcpxml')) {
                const reader = new FileReader();
                reader.onload = function (event) {
                    processXml(event.target.result, file.name, outputData);
                    console.log("Après traitement du fichier, outputData :", outputData);
                };
                reader.readAsText(file);
            }
        }
    
        // Attendre que le traitement soit terminé avant d'afficher l'aperçu
        setTimeout(() => {
            console.log("Contenu final de outputData :", outputData);
            if (outputData.length > 0) {
                const projectName = Object.keys(diffusionMappings)[0]; // Prend le premier projet ajouté
                displayPreview(outputData, projectName);
                document.getElementById('download-btn').style.display = 'inline-block';
            } else {
                showMessage("Aucune donnée trouvée dans les fichiers sélectionnés.", "error");
            }
        }, 1000);
    });
    
    // Ajouter un écouteur pour le bouton "Télécharger le fichier Excel"
    document.getElementById('download-btn').addEventListener('click', function () {
        console.log("Bouton de téléchargement cliqué");
        console.log("Contenu de outputData avant génération Excel :", outputData);
        const projectName = Object.keys(diffusionMappings)[0]; // Prend le premier projet ajouté
        generateExcel(outputData, projectName);
    });
    
    //Fonction pour générer le fichier Excel
    async function generateExcel(outputData, projectName) {
        console.log("Début de generateExcel avec :", { outputData, projectName });
        if (!outputData || outputData.length === 0) {
            console.warn("Aucune donnée à générer dans le fichier Excel.");
            showMessage("Erreur : aucune donnée à exporter.", "error");
            return;
        }
    
        const projectDetails = diffusionMappings[projectName];
        console.log("Détails du projet :", projectDetails);
        if (!projectDetails) {
            console.error("Détails du projet non trouvés pour :", projectName);
            showMessage("Erreur : détails du projet non trouvés.", "error");
            return;
        }
   
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Déclaration de droits musicaux");
    
        // Titre du fichier
        worksheet.mergeCells('A1:J1');
        worksheet.getCell('A1').value = "Déclaration de droits musicaux";
        worksheet.getCell('A1').font = { size: 24, bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };
        worksheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6FA1B6' } };
        worksheet.getRow(1).height = 40;
    
        // Informations du projet
        worksheet.mergeCells('A2:J2');
        worksheet.getCell('A2').value = `Projet : ${projectName}`;
        worksheet.getCell('A2').font = { italic: true };
        worksheet.getCell('A2').alignment = { vertical: 'middle', horizontal: 'center' };
    
        worksheet.mergeCells('A3:J3');
        worksheet.getCell('A3').value = `Journaliste/Producteur : ${projectDetails.producerName || 'Non spécifié'}, Emission : ${projectDetails.showName || 'Non spécifiée'}`;
        worksheet.getCell('A3').font = { italic: true };
        worksheet.getCell('A3').alignment = { vertical: 'middle', horizontal: 'center' };
    
        worksheet.mergeCells('A4:J4');
        worksheet.getCell('A4').value = `Date : ${projectDetails.projectDate || 'Non spécifiée'}, Nombre de diffusions : ${projectDetails.broadcastCount || 'Non spécifié'}`;
        worksheet.getCell('A4').font = { italic: true };
        worksheet.getCell('A4').alignment = { vertical: 'middle', horizontal: 'center' };
    
        // En-têtes de colonnes
        const headerRow = worksheet.addRow([
            'Journaliste / Producteur', 'Emission', 'Sujet', 'Date', 'Titre', 'Artiste', 
            'Album', 'Label', 'Durée', 'Diffusions'
        ]);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
        headerRow.height = 30;
        headerRow.eachCell((cell, colNumber) => {
            if (colNumber <= 10) {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6FA1B6' } };
            }
        });
    
        // Largeurs de colonnes ajustées
        const columnWidths = [25, 25, 30, 20, 30, 25, 25, 20, 15, 15];
        columnWidths.forEach((width, index) => worksheet.getColumn(index + 1).width = width);
    
        // Remplir les données
        outputData.forEach(item => {
            item.data.forEach(row => {
                const dataRow = worksheet.addRow([
                    projectDetails.producerName || '',
                    projectDetails.showName || '',
                    projectName,
                    projectDetails.projectDate || '',
                    row.trackName || '',
                    row.artists || '',
                    row.album || '',
                    row.label || '',
                    row.duration || '',
                    projectDetails.broadcastCount || ''
                ]);
                dataRow.height = 20;
            });
            worksheet.addRow([]); // Ajouter une ligne vide après chaque élément
        });
    
        const contactRow = worksheet.addRow(['Pour toute question, veuillez contacter : email@exemple.com']);
        worksheet.mergeCells(`A${contactRow.number}:J${contactRow.number}`);
        contactRow.getCell(1).font = { italic: true, color: { argb: 'FF6FA1B6' } };
    
        // Génération du fichier Excel
        try {
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
    
            const a = document.createElement('a');
            a.href = url;
            a.download = `Rapport_Suisa - ${projectDetails.producerName || 'Unknown'} - ${projectDetails.showName || 'Unknown'} - ${projectName}.xlsx`;
            a.click();
            window.URL.revokeObjectURL(url);
    
            showMessage("Fichier Excel généré avec succès !", "success");
        } catch (error) {
            console.error("Erreur lors de la génération du fichier Excel :", error);
            showMessage("Erreur lors de la génération du fichier Excel.", "error");
        }
    }

    // Initialise l'affichage des correspondances
    updateMappingList();

    console.log("Initialisation de l'application terminée");
});