// Fonction pour extraire les informations depuis le nom du fichier
function parseFileName(filePath) {
    let fileName = filePath.replace('.aiff', ''); // Supprimer l'extension
    let parts = fileName.split('-'); // Découper par tiret

    return {
        label: parts[0] || "Inconnu", // Ex : "BMGPM"
        album: parts[1] || "Inconnu", // Ex : "4tvm106"
        track: parts[2] || "Inconnu", // Ex : "tr10"
        title: parts[3] || "Inconnu", // Ex : "Wave_Rock_Main"
        artist: parts[4] || "Inconnu" // Ex : "Schauer"
    };
}

// Fonction pour décoder les valeurs time (par exemple : "time:12345")
function decodeTimeValue(timeString, fps = 25) {
    let rawValue = timeString.replace('time:', ''); // Supprimer le préfixe "time:"
    let frames = parseInt(rawValue, 10); // Convertir en nombre brut
    return frames / fps; // Convertir en secondes
}

// Fonction pour calculer les timecodes IN/OUT et la durée
function parseTimecodes(fromPart, toPart) {
    const fps = 25; // Assumer une fréquence d'image par défaut (modifiable si besoin)

    let startSeconds = decodeTimeValue(fromPart, fps);
    let endSeconds = decodeTimeValue(toPart, fps);

    return {
        timecodeIn: convertFramesToTimecode(startSeconds),
        timecodeOut: convertFramesToTimecode(endSeconds),
        duration: convertFramesToTimecode(endSeconds - startSeconds)
    };
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
        