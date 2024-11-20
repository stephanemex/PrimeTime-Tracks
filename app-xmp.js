import { globalOutputData } from './globals.js';
import { parseFilePath, parseTimecodesForXMP } from './utils.js';
document.addEventListener('DOMContentLoaded', function () {
    const fileInputXMP = document.getElementById('input-xmp');
    const uploadLabelXMP = document.querySelector('.file-upload-label-xmp');
    let outputDataXMP = []; // Données de sortie pour les fichiers XMP

    console.log("Chargement de app-xmp.js : Gestion des fichiers XMP activée");


    // Activer l'input de fichiers après l'initialisation
    fileInputXMP.disabled = false;

    // Écouteur pour le changement de fichiers XMP
    fileInputXMP.addEventListener('change', function (event) {
        const files = event.target.files;
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            console.log("Fichier XMP sélectionné : ", file.name);

            if (file.name.endsWith('.xmp')) {
                console.log("Détection d'un fichier XMP : ", file.name);
                processXMP(file); // Appelle la fonction pour traiter le fichier XMP
            } else {
                console.warn("Fichier non pris en charge : ", file.name);
            }
        }
    });

// Fonction pour traiter les fichiers XMP
async function processXMP(file) {
    console.log("Traitement du fichier XMP : ", file.name);

    const fileContent = await file.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(fileContent, "application/xml");

    if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
        console.error("Erreur de parsing dans le fichier XMP :", file.name);
        return;
    }

    const items = xmlDoc.getElementsByTagName("rdf:li");
    if (items.length === 0) {
        console.warn("Aucune balise <rdf:li> trouvée dans le fichier XMP :", file.name);
        return;
    }

    console.log(`${items.length} pistes trouvées dans le fichier XMP`);
    const audioData = [];

    for (let item of items) {
        const filePath = item.getElementsByTagName("stRef:filePath")[0]?.textContent || "Inconnu";
        const fromPart = item.getElementsByTagName("stRef:fromPart")[0]?.textContent || "time:0";
        const toPart = item.getElementsByTagName("stRef:toPart")[0]?.textContent || "time:0";

        if (filePath === "Inconnu" || !filePath.endsWith('.aiff')) continue;

        const timecodes = parseTimecodesForXMP(fromPart, toPart);
        audioData.push({
            filePath,
            ...timecodes,
        });
    }

    if (audioData.length > 0) {
        globalOutputData.push({
            file: file.name,
            data: audioData,
        });
    }


    console.log("Fichiers audio extraits et traités :", audioData);

    // Ajouter les données audio au tableau global
    if (audioData.length > 0) {
        globalOutputData.push({
            file: file.name,
            data: audioData,
        });

        console.log("Données ajoutées à globalOutputData :", globalOutputData);
        showMessage(`Données extraites avec succès pour le fichier XMP : ${file.name}`, "success");
    } else {
        console.warn("Aucun fichier audio valide trouvé dans le fichier XMP :", file.name);
        showMessage(`Aucun fichier audio valide trouvé dans le fichier XMP : ${file.name}`, "warning");
    }
}

});
