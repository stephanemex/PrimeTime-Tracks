document.addEventListener('DOMContentLoaded', function () {
    const { parseFileName, parseTimecodesForXMP } = window.utils;

    const fileInputXMP = document.getElementById('input-xmp');
    fileInputXMP.disabled = false;

    // Ajout d'un écouteur pour le chargement des fichiers XMP
    fileInputXMP.addEventListener('change', function (event) {
        const files = event.target.files;
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            console.log("Fichier XMP détecté :", file.name);
            processXMP(file);
        }
    });

    // Fonction pour traiter un fichier XMP
    async function processXMP(file) {
        try {
            const content = await file.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(content, "application/xml");

            if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
                console.error("Erreur de parsing XML dans le fichier :", file.name);
                return;
            }

            const rdfItems = xmlDoc.getElementsByTagName("rdf:li");
            if (rdfItems.length === 0) {
                console.warn(`Aucune balise <rdf:li> trouvée dans le fichier ${file.name}`);
                return;
            }

            const extractedData = []; // Contiendra les données extraites du fichier XMP

            for (let item of rdfItems) {
                const filePath = item.getElementsByTagName("stRef:filePath")[0]?.textContent || "Inconnu";
                const fromPart = item.getElementsByTagName("stRef:fromPart")[0]?.textContent || "time:0";
                const toPart = item.getElementsByTagName("stRef:toPart")[0]?.textContent || "time:0";

                // Extraction des données et conversion
                const parsedFile = parseFileName(filePath);
                const timecodes = parseTimecodesForXMP(fromPart, toPart);

                extractedData.push({ ...parsedFile, ...timecodes });
            }

            console.log(`Données extraites du fichier XMP (${file.name}) :`, extractedData);

            // Vérifie si la fonction processXMPData existe
            if (typeof processXMPData === "function") {
                processXMPData(extractedData, file.name);
            } else {
                console.error(
                    "La fonction processXMPData n'est pas définie. Assurez-vous qu'elle est implémentée correctement dans app_updated.js."
                );
            }
        } catch (error) {
            console.error(`Erreur lors du traitement du fichier XMP (${file.name}) :`, error);
        }
    }
});
