import * as path from 'path';
import * as fse from 'fs-extra';

// *** UTILS VARIABLES
const JOIN = path.join;
const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg'];
const MAX_IMAGE_COPIES = 1000;
const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

// *** FOLDER STRUCTURE VARIABLES
const ASSETS_PATH = JOIN(__dirname, 'assets');
const OUTPUT_PATH = JOIN(__dirname, 'NFTS');
let imageCount = 1;


/**
 * @description
 * Helper function that cheks if a path contains
 * allowed image types
 */
function filterOutUnwantedImageExtensions(found_images: any) {
    return found_images.filter((element: any) => {
        const imageExtension = path.extname(element.name).toLowerCase();
        return element.isFile() && ALLOWED_IMAGE_EXTENSIONS.includes(imageExtension);
    });
}

/**
 * @description
 * Helper function that displays a briefing regarding the assets folder (images to copy)
 */
async function displayImagesStatus(imageFiles: any, copiesPerImage: number, addtionalCopies: number) {
    console.log("\x1b[32m", "------------------------");
    console.log("\x1b[32m", "      Images Status");
    console.log("\x1b[32m", "------------------------");
    console.log("\x1b[32m", "Total Images:", imageFiles.length);
    console.log("\x1b[32m", "Copies Per Image:", copiesPerImage);
    console.log("\x1b[32m", "Additional Copies:", addtionalCopies);
    console.log("\x1b[32m", "------------------------");

    const question = 'Press Enter to continue or any other key to cancel: ';

    await new Promise<void>((resolve, reject) => {
        readline.question(question, (answer: any) => {
            if (answer.toLowerCase() === '') {
                resolve();
            } else {
                reject(new Error('User cancelled copying'));
            }
            readline.close();
        });
    });
}

/**
 * @description
 * Helper function that takes care of genrating copies
 * based on the number of copies per image
 */
async function generateCopies(imageFiles: any, copiesPerImage: number, addtionalCopies: number) {

    const copyImage = async (imageFile: any, SOURCE_PATH: any) => {
        const imageExtension = imageFile.name.endsWith('.jpg') ? '.jpg' : '.jpeg';

        const DESTINATION_PATH = JOIN(OUTPUT_PATH, `${imageCount}${imageExtension}`);

        console.log("\x1b[34m", `--> Copying Image: ${imageFile.name} (copy ${imageCount})`, "\x1b[0m");

        imageCount++;
        await fse.copy(SOURCE_PATH, DESTINATION_PATH);
    }

    for (const imageFile of imageFiles) {
        const SOURCE_PATH = JOIN(ASSETS_PATH, imageFile.name);

        for (let i = 0; i < copiesPerImage; i++) { copyImage(imageFile, SOURCE_PATH); }
    }

    // copying over the first element to make sure final count is correct
    if (addtionalCopies > 0) {
        console.log("\x1b[32m", "----------------------------------------");
        console.log("\x1b[32m", "re-Copying images to match final count");
        console.log("\x1b[32m", "----------------------------------------");
        const SOURCE_PATH = JOIN(ASSETS_PATH, imageFiles[0].name);
        for (let i = 0; i < addtionalCopies; i++) { copyImage(imageFiles[0], SOURCE_PATH); }
    }

    console.log("\x1b[32m", "------------------------");
    console.log("\x1b[32m", "Copies Completed");
    console.log("\x1b[32m", "------------------------");
}


// ** MAIN FUNCTION **
(async function () {

    await fse.ensureDirSync(OUTPUT_PATH);

    const found_images = fse.readdirSync(ASSETS_PATH, { withFileTypes: true });

    const imageFiles = filterOutUnwantedImageExtensions(found_images);

    const copiesPerImage = Math.round(MAX_IMAGE_COPIES / imageFiles.length);
    const addtionalCopies = MAX_IMAGE_COPIES % imageFiles.length;


    if (copiesPerImage < 0) {
        console.log("No copies needed as there are less images than desired NFTs.");
        return;
    }

    displayImagesStatus(imageFiles, copiesPerImage, addtionalCopies)
        .then(
            async () => await generateCopies(imageFiles, copiesPerImage, addtionalCopies)
        )
})();