// DOM prêt
document.addEventListener("DOMContentLoaded", function () {
    console.log("Initialisation du gestionnaire de projets");

    const inputCsv = document.getElementById("input-csv");
    const btnUploadCsv = document.getElementById("btn-upload-csv");
    const mappingList = document.getElementById("mapping-list");
    const addMappingBtn = document.getElementById("add-mapping-btn");

    // Affiche un message dans l'interface
    function showMessage(message, type = "info") {
        const messageContainer = document.getElementById("message");
        if (!messageContainer) return;
        messageContainer.innerText = message;
        messageContainer.className = `message ${type}`;
    }

    // Parsing du fichier CSV
    function parseCsv(text) {
        const rows = text.trim().split("\n");
        const headers = rows.shift().split(",").map(header => header.replace(/"/g, "").trim());
        return rows.map(row => {
            const values = row.split(",").map(value => value.replace(/"/g, "").trim());
            return headers.reduce((acc, header, index) => {
                acc[header] = values[index] || "Inconnu";
                return acc;
            }, {});
        });
    }

    // Gestionnaire de clic pour le bouton CSV
    btnUploadCsv.addEventListener("click", () => {
        inputCsv.click(); // Simule un clic sur l'input CSV
    });

    // Gestion de l'importation CSV
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
            try {
                globalCsvData = parseCsv(e.target.result);
                console.log("Données CSV importées :", globalCsvData); // Log pour vérifier les données importées
                if (globalCsvData.length > 0) {
                    showMessage(`CSV importé avec ${globalCsvData.length} entrées.`, "success");
                } else {
                    showMessage("Le fichier CSV est vide ou invalide.", "warning");
                }
            } catch (error) {
                console.error("Erreur lors du parsing CSV :", error);
                showMessage("Erreur lors de l'importation du CSV.", "error");
            }
        };
        reader.readAsText(file);
    });

    // Met à jour la liste des correspondances
    function updateMappingList() {
        if (!mappingList) return;
        mappingList.innerHTML = "";
    
        Object.entries(diffusionMappings).forEach(([subject, mapping]) => {
            const { producerName, showName, broadcastCount, projectDate, csvRows } = mapping;
    
            // Crée l'élément de liste pour chaque correspondance
            const listItem = document.createElement("li");
            listItem.className = "mapping-item";
    
            // Construire le tableau HTML avec les entêtes et les lignes
            let tableContent = "";
    
            if (csvRows.length > 0) {
                const headers = Object.keys(csvRows[0]); // Récupère les entêtes du CSV
                tableContent += "<table class='csv-table'>";
                tableContent += "<thead><tr>" + headers.map(header => `<th>${header}</th>`).join("") + "</tr></thead>";
                tableContent += "<tbody>";
                tableContent += csvRows.map(row => {
                    return "<tr>" + headers.map(header => `<td>${row[header] || "Inconnu"}</td>`).join("") + "</tr>";
                }).join("");
                tableContent += "</tbody></table>";
            } else {
                tableContent = "<p>Aucune donnée CSV associée trouvée.</p>";
            }
    
            // Détails principaux de la correspondance
            const details = `
                <div>
                    <ul>
                        <li>Producteur : <b>${producerName}</b></li>
                        <li>Émission : <b>${showName}</b></li>
                        <li>Sujet : <b>${subject}</b></li>
                        <li>Diffusions : <b>${broadcastCount}</b></li>
                        <li>Date : <b>${projectDate}</b></li>
                    </ul>
                    <h4>Données CSV associées :</h4>
                    ${tableContent}
                </div>
            `;
            listItem.innerHTML = details;
    
            // Bouton pour supprimer la correspondance
            const deleteBtn = document.createElement("button");
            deleteBtn.textContent = "Supprimer";
            deleteBtn.addEventListener("click", () => {
                delete diffusionMappings[subject];
                updateMappingList();
                showMessage(`Correspondance supprimée pour ${subject}`, "info");
            });
            listItem.appendChild(deleteBtn);
    
            mappingList.appendChild(listItem);
        });
    }
    

    // Ajout de correspondance
    addMappingBtn.addEventListener("click", () => {
        const producerName = document.getElementById("producer-name").value.trim();
        const showName = document.getElementById("show-name").value.trim();
        const subject = document.getElementById("project-name").value.trim();
        const broadcastCount = parseInt(document.getElementById("broadcast-count").value.trim());
        const projectDate = document.getElementById("project-date").value.trim();
    
        if (!producerName || !showName || !subject || isNaN(broadcastCount) || !projectDate) {
            showMessage("Veuillez remplir tous les champs.", "error");
            return;
        }
    
        if (globalCsvData.length === 0) {
            showMessage("Aucune donnée CSV disponible. Veuillez importer un fichier CSV.", "error");
            return;
        }
    
        console.log("Clés disponibles dans une ligne CSV :", Object.keys(globalCsvData[0])); // Vérifie les clés
        console.log("Sujet recherché :", subject.toLowerCase());
    
        const csvRows = globalCsvData; // Associe toutes les lignes du CSV sans filtrer

        console.log("Lignes CSV correspondantes :", csvRows); // Vérifie les résultats filtrés
    
        diffusionMappings[subject] = {
            producerName,
            showName,
            broadcastCount,
            projectDate,
            csvRows,
        };
    
        updateMappingList();
        showMessage(`Correspondance ajoutée pour ${subject}`, "success");
    });
    
    console.log("Gestionnaire de projets prêt.");
});
